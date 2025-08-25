const Joi = require("joi");
const bcrypt = require('bcrypt');
const logger = require("../../logger.js");


async function getUsersHandler(req,res,db){
    try{
        if (req.role !==  'admin'){
            logger.warn('Unauthorized attempt to fetch users', { userId: req.uid});
            return res.status(403).json({error : 'Cannot Access'});
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const offset = (page - 1) * limit;
        const sort = req.query.sort || 'uid';
        const order = req.query.order || 'asc';

        
        let query =  db('users');

        if(req.query.role){
            query = query.where('role', '=', req.query.role);
            logger.debug('Applied role filter', { role: req.query.role });
        }
        const [{ count }] = await query.clone().count('*');
        const selected = await query.select('*').limit(limit)
        .offset(offset)
        .orderBy(sort,order);
        
        logger.info('Fetched users successfully', {
            adminId: req.uid,
            fetchedCount: selected.length,
            total: parseInt(count),
            page,
            totalPages: Math.ceil(count / limit)
        });
        res.status(200).json({
            total: parseInt(count),
            page,
            totalPages: Math.ceil(count / limit),
            selected
        });
    }
    catch(err){
        logger.error('Failed to fetch users', { userId: req.validatedId, error: err.message });
        res.status(500).json({ error: "Internal server error" });
        
    }
}

async function getUserHandler(req,res,db){
    try{
        const id = req.validatedId;

        if (req.role !== 'admin' && req.uid !== id ) {
            logger.warn('Unauthorized attempt to fetch user', { userId: req.uid , targetId :id});
            return res.status(403).json({error : 'Cannot Access'});
        }
        const selected = await db('users').select('*').where('uid','=',id);
        logger.info('Fetched user successfully', { userId: req.uid, targetId: id });
        res.status(200).json(selected);
    }
    catch(err){
        logger.error('Failed to fetch user', { userId: req.validatedId, error: err.message });
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
        const id = req.validatedId;

        if (req.role !== 'admin' && req.uid !== id ) {
            logger.warn('Unauthorized attempt to update users', { userId: req.uid , targetId: id });
            return res.status(403).json({error : 'Cannot Access'});
        }
        const {error:bodyError , value:bodyValue }=schemaUpdated.validate(req.body);
        if(bodyError){
             logger.info('Validation failed for updating user', { userId: req.uid, targetId: id, error: bodyError.details[0].message });
             return  res.status(400).json({error : bodyError.details[0].message});
        }
        const user = {};
        if (bodyValue.name) user.name = bodyValue.name;
        if (bodyValue.email) user.email = bodyValue.email;
        if (bodyValue.password) user.password = await bcrypt.hash(bodyValue.password, 10);

         
        const updated = await db('users').where('uid','=',id).update(user).returning('*');

        if (updated.length === 0) {
            logger.warn('User not found for update', { userId: req.uid, targetId: id });
            return res.status(404).json({ message: "User not found" });
        }
        logger.info('User updated successfully', { userId: req.uid, targetId: id, changes: bodyValue });
        res.status(200).json(updated);
    }
    catch(err){
        logger.error('Failed to update user', { userId: req.validatedId, error: err.message });
        res.status(500).json({ error: "Internal server error" });
        
    }
}

async function deleteUserHandler(req,res,db){
    try{
        const id = req.validatedId;
         
        if (req.role !== 'admin' && req.uid !== id ) {
            logger.warn('Unauthorized attempt to delete users', { userId: req.uid, targetId: id });
            return res.status(403).json({error : 'Cannot Access'});
        }
        const deleted = await db('users').delete().where('uid','=',id);
        if(!deleted){
            logger.warn('User not found for delete', { userId: req.uid, targetId: id });
            return res.status(404).json({ message: "User not found" });
        }
       logger.info('User deleted successfully', { userId: req.uid, targetId: id });
        res.status(200).json({ message: 'Product Deleted successfully', id });
    }
    catch(err){
        logger.error('Failed to delete user', { userId: req.validatedId, error: err.message });
        res.status(500).json({ error: "Internal server error" });
        
    }
}

module.exports = {getUsersHandler , getUserHandler , updateUserHandler ,deleteUserHandler};