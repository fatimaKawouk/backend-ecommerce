const Joi = require("joi");

async function getCartHandler(req,res,db){
    try{
    
        if (req.role !== 'user') return res.status(403).json({error : 'Cannot Access'});
        const id = req.uid;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const sort = req.query.sort || 'title';
        const order = req.query.order || 'asc';

        const [selected ]= await db('carts').select('*').where('userid','=',id);
        const [{ count }] = await db('cart_items')
        .join('product', 'cart_items.productid', '=', 'product.pid')
        .count('*') 
        .where('cart_items.cartid', '=', selected.cid)
        .andWhere('product.stock', '>=', req.query.available || 1);
        
        let query = db('cart_items')
            .join('product', 'cart_items.productid', '=', 'product.pid')
            .select(
                'cart_items.productid',
                'cart_items.quantity',
                'product.title',
                'product.price',
                'product.category'
            )
            .where('cart_items.cartid', '=', selected.cid).limit(limit)
            .andWhere('stock', '>=', req.query.available || 1)
            .offset(offset)
            .orderBy(sort, order);

        if(req.query.category){
            query = query.where('category','=', req.query.category);
        }
        if(req.query.minPrice){
            query = query.where('price', '>=', req.query.minPrice);
        }
        if(req.query.maxPrice){
            query = query.where('price', '<=', req.query.maxPrice);
        }

        const cart = await query;

            const itemsWithSubtotal = cart.map(item => ({
                ...item,
                subtotal: item.quantity * Number(item.price)
            }));
        const totalAmount = itemsWithSubtotal.reduce((sum, item) => sum + item.subtotal, 0);
        res.status(200).json({total: parseInt(count),
            page,
            totalPages: Math.ceil(count / limit),
            items: itemsWithSubtotal,
            totalAmount});
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


async function createCartHandler(req,res,db){
    try{ 
        if (req.role !== 'user') return res.status(403).json({error : 'Cannot Access'});
        const uid = req.uid;
        const item = req.body;
        const {error , value} = schema.validate(item);
        if(error) return res.status(400).json({error : error.details[0].message});

        let [cart] = await db('carts').select('*').where('userid','=',uid);
        if(!cart ){
            [cart]  = await db('carts').insert({userid : uid }).returning('*');
        }
        
        const existItem = await db('cart_items')
        .select('*')
        .where('cartid','=',cart.cid )
        .andWhere('productid','=',value.product)
        .first();
        if(!existItem ){
            const [inserted] = await db('cart_items').insert( {
                    cartid: cart.cid ,
                    productid: value.product,
                    quantity: value.quantity,
                }).returning('*'); 
                res.status(201).json({ message: 'Item added to cart successfully',inserted });
        }
        else{
           const [updateQuantity] = await db('cart_items')
           .where('cartid','=',cart.cid )
           .update({quantity : existItem.quantity+value.quantity})
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
module.exports = {getCartHandler,createCartHandler,updateCartHandler, deleteCartItemHandler};