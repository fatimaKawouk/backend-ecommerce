const  Joi = require("joi");
const bcrypt =require("bcrypt");
var jwt = require('jsonwebtoken');
const logger = require("../../logger.js");

require('dotenv').config()

async function loginHandler(req,res,db){
    try {
    const { email, password } = req.body;

    
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required()
    });

    const { error, value } = schema.validate({ email, password });
    if (error){
       logger.info('Login validation failed', { email: req.body.email, error: error.details[0].message });
       return res.status(400).json({ message: error.details[0].message });
    }
   
    const user = await db('users').select('*').where('email', value.email).first();
    if (!user) {
      logger.warn('Login attempt with invalid email', { email: value.email });
      return res.status(400).json({ message: "Invalid email or password" });
    }
  
    const valid = await bcrypt.compare(value.password, user.password);
    if (!valid){
      logger.warn('Login attempt with invalid password', { password: value.password});
       return res.status(400).json({ message: "Invalid email or password" });
    }
   
    const payload = { uid: user.uid,  role: user.role };
    const token = jwt.sign(payload, process.env.PRIVATE_KEY, { algorithm: 'HS256', expiresIn: '1h' });
    logger.info('User logged in successfully', { userId: user.uid, email: value.email });
    res.json({ token : token , userId : payload.uid});

  } catch (err) {
    logger.error('Login failed', { error: err.message, stack: err.stack });
    res.status(500).json({ message: "Server error" });
  }
}

module.exports={loginHandler};