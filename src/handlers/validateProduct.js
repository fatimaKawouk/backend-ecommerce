const Joi = require("joi");


function validateProductBody(req,res){
 
    const schema = Joi.object({
        product : Joi.string().required(),
        quantity:Joi.number().required().min(1),
    });

    const {error , value} = schema.validate(req.body);
    if(error) {
        res.status(400).json({error : error.details[0].message});
        return null;
    } 

     return value;

}

module.exports={validateProductBody};