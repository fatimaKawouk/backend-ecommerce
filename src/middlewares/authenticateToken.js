var jwt = require('jsonwebtoken');
require('dotenv').config()

function authenticateToken(req,res,next){
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if(token == null) return res.status(401).json({error: 'Token is not provided'});

  jwt.verify(token , process.env.PRIVATE_KEY,(err,user)=>{
      if(err) return res.status(403).json({error:'Token expired'});
      req.role=user.role;
      req.uid = user.uid;
      next();

  });
  

}

module.exports ={authenticateToken};