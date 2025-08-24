const Joi = require("joi");



async function getOrderHandler(req,res,db){
    try{
        
        const id = req.validatedId;
        if (req.role !== 'admin' && req.uid !== id ) return res.status(403).json({error : 'Cannot Access'});

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const offset = (page - 1) * limit;
        const [{ count }] = await db('orders').count('*');
        const sort = req.query.sort || 'total_amount';
        const order = req.query.order || 'asc';
        const orders = await db('orders')
        .select('*')
        .where('userid','=',id)
        .limit(limit)
        .offset(offset)
        .orderBy(sort,order);

        res.status(200).json({ total: parseInt(count),
            page,
            totalPages: Math.ceil(count / limit),
            orders});
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
        
    }
}

async function getOrdersHandler(req,res,db){
    try{
        if (req.role !== 'admin') return res.status(403).json({error : 'Cannot Access'});

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const offset = (page - 1) * limit;
        const sort = req.query.sort || 'total_amount';
        const order = req.query.order || 'asc';

        const [{ count }] = await db('orders').count('*');

        const orders= await db('orders').select('*').limit(limit)
        .offset(offset)
        .orderBy(sort,order);
        res.status(200).json({total: parseInt(count),
            page,
            totalPages: Math.ceil(count / limit),
            orders});
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
       
        const uid = req.uid;

        const [selected ]= await db('carts').select('*').where('userid','=',uid); 
        const cart = await db('cart_items').select('*').where('cartid','=',selected.cid);
       
        if (cart.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }   
        
        let createdOrder;
        //transaction
        await db.transaction(async function (trx) {
            const [order] = await trx('orders')
                .insert({ userid: uid , total_amount: 0 })
                .returning('*');

            let total_amount = 0 ;

            for (let item of cart) {
                const product = await trx('product').select('stock' , 'price').where('pid','=',item.productid).first();
                if (!product) {
                    throw new Error('Product '+ item.productid+' not found');
                }

                if (product.stock < item.quantity){
                    throw new Error('Not enough stock for product : '+item.productid);
                }
            
                await trx('order_items').insert( {
                    orderid: order.oid,
                    productid: item.productid,
                    quantity: item.quantity,
                    price_at_purchase : product.price
                });

                const updateStock = await trx('product').update({'stock' : product.stock - item.quantity}).where('pid','=',item.productid);
                if (updateStock === 0 ){
                    throw new Error('Failed to update stock');
                }
               total_amount += product.price * item.quantity;

              
            }  
            await trx('orders').where('oid','=', order.oid).update({ total_amount: total_amount });
            createdOrder = order;

        });
        await db('cart_items').delete().where('cartid','=',selected.cid);
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
        res.status(200).json(updated);
    }
    catch(err){
         console.error(err);
        res.status(500).json({ error: "Internal server error" });
        
    }
}

module.exports= {getOrderHandler ,getOrdersHandler, createOrderHandler , updateOrderHandler};