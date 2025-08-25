const Joi = require("joi");
const {validateProductBody} = require("./validateProduct");

async function createCartHandler(req,res,db){
    try{ 
        if (req.role !== 'user') return res.status(403).json({error : 'Cannot Access'});
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
                res.status(201).json({ message: 'Item added to cart successfully',inserted });
        }
        else{
           const [updateQuantity] = await db('cart_items')
           .where('cartid','=',cart.cid )
           .update({quantity : existItem.quantity+item.quantity})
           .returning('*');
           res.status(201).json({ message: 'Item added to cart successfully',updateQuantity });
        }
        
    }
    catch(err){
         console.error(err);
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
        if (req.role !== 'user' ) return res.status(403).json({error : 'Cannot Access'});
        
        const {error:bodyError , value:bodyValue }=schemaUpdated.validate(req.body);
        if(bodyError) return  res.status(400).json({error : bodyError.details[0].message});

        const [selected ]= await db('carts').select('*').where('userid','=',uid);
        let updated = await db('cart_items')
        .where('cartid', '=', selected.cid)
        .andWhere('productid', '=', productid)
        .update({
            quantity: db.raw(
                'quantity + ?',
                [bodyValue.quantity === 'increase' ? 1 : bodyValue.quantity === 'decrease' ? -1 : 0]
            )
        })
        .returning('*');


        if (updated.length === 0) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json(updated);
    }
    catch(err){
         console.error(err);
        res.status(500).json({ error: "Internal server error" });
        
    }
}


async function deleteCartItemHandler(req,res,db){
    try{
        const productid = req.validatedId;
        const uid = req.uid;
        if (req.role !== 'user' ) return res.status(403).json({error : 'Cannot Access'});
        
        const [selected ]= await db('carts').select('*').where('userid','=',uid);

        await db('cart_items').delete().where('cartid','=',selected.cid).andWhere('productid','=',productid);
       
        res.status(200).json({ message: 'Product Deleted successfully', productid});
    }
    catch(err){
         console.error(err);
        res.status(500).json({ error: "Internal server error" });
        
    }
}
module.exports = {createCartHandler,updateCartHandler, deleteCartItemHandler};