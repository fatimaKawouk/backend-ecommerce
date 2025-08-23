const Joi = require("joi");

function validateParamMiddleware(req,res,next){
    const schemaId = Joi.object({
    id:Joi.string().required()
});

  const {error : paramError , value : paramValue} = schemaId.validate(req.params);
  if(paramError) return  res.status(400).json({error : paramError.details[0].message});
 req.validatedId = paramValue.id;
  next();
}

module.exports = {validateParamMiddleware};