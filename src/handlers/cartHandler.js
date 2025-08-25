const Joi = require("joi");
const {validateProductBody} = require("./validateProduct");
const logger = require("../../logger.js");

async function createCartHandler(req,res,db){
    try{ 
        if (req.role !== 'user') {
            logger.warn('Unauthorized attempt to add item to this cart', { userId: req.uid, targetId: id });
            return res.status(403).json({error : 'Cannot Access'});
        }
        const uid = req.uid;
        const item= validateProductBody(req,res);
        if(!item ) return;
        let [cart] = await db('carts').select('*').where('userid','=',uid);
        if(!cart ){
            [cart]  = await db('carts').insert({userid : uid }).returning('*');
        }
        
        const existItem = await db('cart_items')
        .select('*')
        .where('cartid','=',cart.cid )
        .andWhere('productid','=',item.product)
        .first();
        if(!existItem ){
            const [inserted] = await db('cart_items').insert( {
                    cartid: cart.cid ,
                    productid: item.product,
                    quantity: item.quantity,
                }).returning('*'); 
                logger.info('Item added to cart', { userId: uid, productId: item.product, quantity: item.quantity });
                res.status(201).json({ message: 'Item added to cart successfully',inserted });
        }
        else{
           const [updateQuantity] = await db('cart_items')
           .where('cartid','=',cart.cid )
           .update({quantity : existItem.quantity+item.quantity})
           .returning('*');
             logger.info('Cart item quantity updated', { userId: uid, productId: item.product, newQuantity: updateQuantity.quantity });
           res.status(201).json({ message: 'Item added to cart successfully',updateQuantity });
        }
        
    }
    catch(err){
        logger.error('Failed to add item to cart', { userId: req.uid, error: err.message, stack: err.stack });
        res.status(500).json({ error: "Internal server error" });
        
    }
}

const schemaUpdated = Joi.object({
    quantity: Joi.string().valid('increase', 'decrease').required(),
});


async function updateCartHandler(req,res,db){
    try{
        const productid = req.validatedId;
        const uid = req.uid;
        if (req.role !== 'user' )  {
            logger.warn('Unauthorized attempt to update cart', { userId: uid, productId: productid });
            return res.status(403).json({error : 'Cannot Access'});
        }
        const {error:bodyError , value:bodyValue }=schemaUpdated.validate(req.body);
        if(bodyError){
            logger.info('Validation failed for updating cart item', { userId: uid, productId: productid, error: bodyError.details[0].message });
            return  res.status(400).json({error : bodyError.details[0].message});
        }
        const [selected ]= await db('carts').select('*').where('userid','=',uid);
        let updated;

        if (bodyValue.quantity === 'increase') {
            updated = await db('cart_items')
                .where({ cartid: selected.cid, productid })
                .update({ quantity: db.raw('quantity + 1') })
                .returning('*');

        } else if (bodyValue.quantity === 'decrease') {
            updated = await db('cart_items')
                .where({ cartid: selected.cid, productid })
                .update({ quantity: db.raw('quantity - 1') })
                .where('quantity', '>', 1) 
                .returning('*');

            if (updated.length === 0) {
                const deleted = await db('cart_items')
                    .where({ cartid: selected.cid, productid })
                    .del();
                if (deleted === 0) {
                    logger.warn('Product not found in cart for update', { userId: uid, productId: productid }); 
                    return res.status(404).json({ message: "Product not found" });
                }
                logger.info('Product removed from cart', { userId: uid, productId: productid });
                return res.status(200).json({ message: "Product removed from cart" });

            }

        } else {
            return res.status(400).json({ error: "Invalid quantity action" });
        }


      


        
        logger.info('Cart item updated successfully', {
            userId: uid,
            productId: productid,
            change: bodyValue.quantity,
            newQuantity: updated.quantity
        });
        res.status(200).json(updated);
    }
    catch(err){
        logger.error('Failed to update cart item', { userId: req.uid, productId: req.validatedId, error: err.message, stack: err.stack });
        res.status(500).json({ error: "Internal server error" });
        
    }
}


async function deleteCartItemHandler(req,res,db){
    try{
        const productid = req.validatedId;
        const uid = req.uid;
        if (req.role !== 'user' ) {
            logger.warn('Unauthorized attempt to delete cart item', { userId: uid, productId: productid });
            return res.status(403).json({error : 'Cannot Access'});
        }
        const [selected ]= await db('carts').select('*').where('userid','=',uid);

        const deleted = await db('cart_items').delete().where('cartid','=',selected.cid).andWhere('productid','=',productid);
        if (deleted === 0) {
            logger.info('Attempted to delete product not in cart', { userId: uid, productId: productid });
            return res.status(404).json({ error: 'Product not found in cart' });
        }
        logger.info('Product deleted successfully from cart', { userId: uid, productId: productid });
        res.status(200).json({ message: 'Product Deleted successfully', productid});
    }
    catch(err){
        logger.error('Failed to delete cart item', { userId: req.uid, productId: req.validatedId, error: err.message });
        res.status(500).json({ error: "Internal server error" });
        
    }
}
module.exports = {createCartHandler,updateCartHandler, deleteCartItemHandler};