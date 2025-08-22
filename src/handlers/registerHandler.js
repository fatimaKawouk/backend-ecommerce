const Joi = require("joi");
const bcrypt = require('bcrypt');

const schema = Joi.object({
    name : Joi.string().required(),
    role :Joi.string().default('user'),
    email:Joi.string().email().required(),
    password:Joi.string().min(6).required(),
    re_password:Joi.string().required(),
});


async function registerHandler(req,res,db){
      try{
   
        const {error , value }=schema.validate(req.body);
        if(error) return  res.status(400).json({error : error.details[0].message});

        if (value.password !== value.re_password) {
            return res.status(400).json({ error: "Passwords do not match" });
        }
        const hashedPassword = await bcrypt.hash(value.password, 10);
        const user = {
            name: value.name,
            email: value.email,
            password: hashedPassword,
            role: value.role
        };
        const inserted = await db('users').insert(user).returning('*');
        res.status(201).json(inserted);
    }
    catch(err){
         console.error(err);
        res.status(500).json({ error: "Internal server error" });
        
    }
}

module.exports= {registerHandler};