const Joi = require("joi");
const bcrypt = require('bcrypt');

const schemaId = Joi.object({
    id:Joi.string().required()
});

async function getUsersHandler(req,res,db){
    try{
        if (req.role != 'admin') return res.status(403).json({error : 'Cannot Access'});
        const selected = await db('users').select('*').returning('*');
        res.status(201).json(selected);
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
        
    }
}

async function getUserHandler(req,res,db){
    try{
        const {error : paramError , value : paramValue} = schemaId.validate(req.params);
        if(paramError) return  res.status(400).json({error : paramError.details[0].message});
        const {id} = paramValue;

        if (req.role !== 'admin' && req.uid !== id ) return res.status(403).json({error : 'Cannot Access'});

        const selected = await db('users').select('*').where('uid','=',id).returning('*');
        res.status(201).json(selected);
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
        
    }
}


const schemaUpdated = Joi.object({
    name : Joi.string(),
    email:Joi.string().email(),
    password:Joi.string().min(6),
});


async function updateUserHandler(req,res,db){
    try{
        

        const {error : paramError , value : paramValue} = schemaId.validate(req.params);
        if(paramError) return  res.status(400).json({error : paramError.details[0].message});
        const {id} = paramValue;

        if (req.role !== 'admin' && req.uid !== id ) return res.status(403).json({error : 'Cannot Access'});

        const {error:bodyError , value:bodyValue }=schemaUpdated.validate(req.body);
        if(bodyError) return  res.status(400).json({error : bodyError.details[0].message});
         const hashedPassword = await bcrypt.hash(bodyValue.password, 10);
        const user = {
            name: bodyValue.name,
            email: bodyValue.email,
            password : hashedPassword,
        };
         
        const updated = await db('users').where('uid','=',id).update(user).returning('*');

        if (updated.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(201).json(updated);
    }
    catch(err){
         console.error(err);
        res.status(500).json({ error: "Internal server error" });
        
    }
}

async function deleteUserHandler(req,res,db){
    try{

        const {error : paramError , value : paramValue} = schemaId.validate(req.params);
        if(paramError) return  res.status(400).json({error : paramError.details[0].message});
        const {id} = paramValue;

         
        if (req.role !== 'admin' && req.uid !== id ) return res.status(403).json({error : 'Cannot Access'});
        await db('users').delete().where('uid','=',id);
       
        res.status(200).json({ message: 'Product Deleted successfully', id });
    }
    catch(err){
         console.error(err);
        res.status(500).json({ error: "Internal server error" });
        
    }
}

module.exports = {getUsersHandler , getUserHandler , updateUserHandler ,deleteUserHandler};