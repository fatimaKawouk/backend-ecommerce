const Joi = require("joi");
const bcrypt = require('bcrypt');
const logger = require("../../logger.js");


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
        if(error){
            logger.warn('User registration validation failed', {
                input: req.body,
                reason: error.details[0].message
            });
            return  res.status(400).json({error : error.details[0].message});
        } 

        if (value.password !== value.re_password) {
            logger.warn('Password mismatch during registration', {
                email: value.email
            });
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
        logger.info('User registered successfully', {
            userId: inserted[0].id,
            email: inserted[0].email,
            role: inserted[0].role
        });

        res.status(201).json(inserted);
    }
    catch(err){
        logger.error('User registration failed', {
            error: err.message,
            stack: err.stack
        });
        res.status(500).json({ error: "Internal server error" });
        
    }
}

module.exports= {registerHandler};