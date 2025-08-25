const Joi = require("joi");
const logger = require("../../logger.js");


async function getOrderHandler(req,res,db){
    try{
        
        const id = req.validatedId;
        if (req.role !== 'admin' && req.uid !== id ){
            logger.warn('Unauthorized attempt to fetch orders', { userId: id });
            return res.status(403).json({error : 'Cannot Access'});
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const offset = (page - 1) * limit;
        
        const sort = req.query.sort || 'total_amount';
        const order = req.query.order || 'asc';
        let query = db('orders').where('userid','=',id);

        if(req.query.minAmount){
            query = query.where('total_amount', '>=', req.query.minAmount);
            logger.debug('Applied minAmount filter', { userId: id, minAmount: req.query.minAmount });
        }
        if(req.query.maxAmount){
            query = query.where('total_amount', '<=', req.query.maxAmount);
            logger.debug('Applied maxAmount filter', { userId: id, maxAmount: req.query.maxAmount });
        }
        if(req.query.status){
            query = query.where('status', '=', req.query.status);
            logger.debug('Applied status filter', { userId: id, status: req.query.status });
        } 

        const [{ count }] = await query.clone().count('*');
        const orders = await query.select('*')
        .limit(limit)
        .offset(offset)
        .orderBy(sort,order);
        logger.info('Fetched orders successfully', {
            userId: id,
            fetchedCount: orders.length,
            total: parseInt(count),
            page,
            totalPages: Math.ceil(count / limit)
        });
        res.status(200).json({ total: parseInt(count),
            page,
            totalPages: Math.ceil(count / limit),
            orders});
    }
    catch(err){
        logger.error('Failed to fetch orders', { userId: req.validatedId, error: err.message });
        res.status(500).json({ error: "Internal server error" });
        
    }
}

async function getOrdersHandler(req,res,db){
    try{
        if (req.role !== 'admin'){
            logger.warn('Unauthorized attempt to fetch orders', { userId: req.uid});
            return res.status(403).json({error : 'Cannot Access'});
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const offset = (page - 1) * limit;
        const sort = req.query.sort || 'total_amount';
        const order = req.query.order || 'asc';

       
        let query =  db('orders');
        
        if(req.query.minAmount){
            query = query.where('total_amount', '>=', req.query.minAmount);
            logger.debug('Applied minAmount filter', { userId: id, minAmount: req.query.minAmount });
        }
        if(req.query.maxAmount){
            query = query.where('total_amount', '<=', req.query.maxAmount);
            logger.debug('Applied maxAmount filter', { userId: id, maxAmount: req.query.maxAmount });
        }
        if(req.query.status){
            query = query.where('status', '=', req.query.status);
            logger.debug('Applied status filter', { userId: id, status: req.query.status });
        } 
        
        const [{ count }] = await query.clone().count('*');
        const orders= await query.select('*').limit(limit)
        .offset(offset)
        .orderBy(sort,order);
        logger.info('Fetched orders successfully', {
            userId: req.uid,
            fetchedCount: orders.length,
            total: parseInt(count),
            page,
            totalPages: Math.ceil(count / limit)
        });
        res.status(200).json({total: parseInt(count),
            page,
            totalPages: Math.ceil(count / limit),
            orders});
    }
    catch(err){
        logger.error('Failed to fetch orders', { userId: req.validatedId, error: err.message });
        res.status(500).json({ error: "Internal server error" });
        
    }
}


async function createOrderHandler(req,res,db){
    try{ 
        if (req.role !== 'user') return res.status(403).json({error : 'Cannot Access'});
       
        const uid = req.uid;

        const [selected ]= await db('carts').select('*').where('userid','=',uid); 
        const cart = await db('cart_items').select('*').where('cartid','=',selected.cid);
       
        if (cart.length === 0) {
            logger.info('Attempted to create order with empty cart', { userId: uid });
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
                    logger.error('Failed to update stock', { userId: uid, productId: item.productid });
                    throw new Error('Failed to update stock');
                }
               total_amount += product.price * item.quantity;

              
            }  
            await trx('orders').where('oid','=', order.oid).update({ total_amount: total_amount });
            createdOrder = order;

        });
        await db('cart_items').delete().where('cartid','=',selected.cid);
        logger.info('Order created successfully', { userId: uid, orderId: createdOrder.oid, totalAmount: createdOrder.total_amount });
        res.status(201).json({ message: 'Order created successfully', orderId:createdOrder.oid });
    }
    catch(err){
        logger.error('Failed to create order', { userId: req.uid, error: err.message, stack: err.stack });
        res.status(500).json({ error: "Internal server error" });
        
    }
}


const schemaUpdated = Joi.object({
    status:Joi.string().required()
});


async function updateOrderHandler(req,res,db){
    try{
        if (req.role !== 'admin'){
            logger.warn('Unauthorized attempt to update order', { userId: req.uid });
            return res.status(403).json({error : 'Cannot Access'});
        }
         
        const id = req.validatedId;
        logger.debug('Processing order update request', { orderId: id, userId: req.uid });
        const {error:bodyError , value:bodyValue }=schemaUpdated.validate(req.body);
        if(bodyError){
            logger.warn('Order update validation failed', { orderId: id, validationError: bodyError.details[0].message });
            return  res.status(400).json({error : bodyError.details[0].message})
        } ;

        const updated = await db('orders').where('oid','=',id).update({status : bodyValue.status}).returning('*');
        if (updated.length === 0) {
            logger.info('Order not found for update', { orderId: id });
            return res.status(404).json({ message: "Order not found" });
        }
        logger.info('Order updated successfully', { orderId: id, newStatus: bodyValue.status });
        res.status(200).json(updated);
    }
    catch(err){
        logger.error('Failed to update order', { orderId: req.validatedId, error: err.message });
        res.status(500).json({ error: "Internal server error" });
        
    }
}

module.exports= {getOrderHandler ,getOrdersHandler, createOrderHandler , updateOrderHandler};