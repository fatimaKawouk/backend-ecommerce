const Joi = require("joi");



async function getOrderHandler(req,res,db){
    try{
        
        const id = req.validatedId;
        if (req.role !== 'admin' && req.uid !== id ) return res.status(403).json({error : 'Cannot Access'});

        const selected = await db('orders').select('*').where('userid','=',id);
        res.status(200).json(selected);
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
        
    }
}

async function getOrdersHandler(req,res,db){
    try{
        if (req.role !== 'admin') return res.status(403).json({error : 'Cannot Access'});
        const selected = await db('orders').select('*');
        res.status(200).json(selected);
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
        
    }
}

const schema = Joi.object({
    product : Joi.string().required(),
    quantity:Joi.number().required().min(1),
});


async function createOrderHandler(req,res,db){
    try{ 
        if (req.role !== 'user') return res.status(403).json({error : 'Cannot Access'});
        const products = Array.isArray(req.body) ? req.body : [req.body];
        const uid = req.uid;
        const schemaArray = Joi.array().items(schema).required();
        const {error , value} = schemaArray.validate(products);
        if(error) return res.status(400).json({error : error.details[0].message});

        let createdOrder;
            
        //transaction
        await db.transaction(async function (trx) {
            const [order] = await trx('orders')
                .insert({ userid: uid , total_amount: 0 })
                .returning('*');

            let total_amount = 0 ;

            for (let item of value) {
                const product = await trx('product').select('stock' , 'price').where('pid','=',item.product).first();
                if (!product) {
                    throw new Error('Product '+ item.product+' not found');
                }

                if (product.stock < item.quantity){
                    throw new Error('Not enough stock for product : '+item.product);
                }
            
                await trx('order_items').insert( {
                    orderid: order.oid,
                    productid: item.product,
                    quantity: item.quantity,
                    price_at_purchase : product.price
                });

                const updateStock = await trx('product').update({'stock' : product.stock - item.quantity}).where('pid','=',item.product);
                if (updateStock.length === 0 ){
                    throw new Error('Failed to update stock');
                }
               total_amount += product.price * item.quantity;

              
            }  
            await trx('orders').where('oid','=', order.oid).update({ total_amount: total_amount });
            createdOrder = order;

        });
        
      res.status(201).json({ message: 'Order created successfully', orderId:createdOrder.oid });
    }
    catch(err){
         console.error(err);
        res.status(500).json({ error: "Internal server error" });
        
    }
}


const schemaUpdated = Joi.object({
    status:Joi.string().required()
});


async function updateOrderHandler(req,res,db){
    try{
        if (req.role !== 'admin') return res.status(403).json({error : 'Cannot Access'});
        const id = req.validatedId;
        const {error:bodyError , value:bodyValue }=schemaUpdated.validate(req.body);
        if(bodyError) return  res.status(400).json({error : bodyError.details[0].message});

        const updated = await db('orders').where('oid','=',id).update({status : bodyValue.status}).returning('*');
        if (updated.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.status(201).json(updated);
    }
    catch(err){
         console.error(err);
        res.status(500).json({ error: "Internal server error" });
        
    }
}

module.exports= {getOrderHandler ,getOrdersHandler, createOrderHandler , updateOrderHandler};