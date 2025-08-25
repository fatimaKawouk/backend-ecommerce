const Joi = require("joi");


function calculateCartTotals(cartItems) {
  const itemsWithSubtotal = cartItems.map(item => ({
    ...item,
    subtotal: item.quantity * Number(item.price)
  }));

  const totalAmount = itemsWithSubtotal.reduce((sum, item) => sum + item.subtotal, 0);

  return { itemsWithSubtotal, totalAmount };
}

function buildCartItemsQuery(db, cartId, queryParams) {
  let query = db('cart_items')
    .join('product', 'cart_items.productid', '=', 'product.pid')
    .select(
      'cart_items.productid',
      'cart_items.quantity',
      'product.title',
      'product.price',
      'product.category'
    )
    .where('cart_items.cartid', '=', cartId);

  if(queryParams.category) query = query.where('category','=', queryParams.category);
  if(queryParams.minPrice) query = query.where('price','>=', queryParams.minPrice);
  if(queryParams.maxPrice) query = query.where('price','<=', queryParams.maxPrice);

  return query;
}

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
        if(!selected) return res.status(404).json({ error: "Cart not found" });
        
        const [{ count }] = await db('cart_items')
        .join('product', 'cart_items.productid', '=', 'product.pid')
        .count('*') 
        .where('cart_items.cartid', '=', selected.cid)
        .andWhere('product.stock', '>=', req.query.available || 1);
        
        const query= buildCartItemsQuery(db,selected.cid,req.query);

        const cart = await query.offset(offset).limit(limit).orderBy(sort,order);

        const {itemsWithSubtotal , totalAmount}=calculateCartTotals(cart);
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

module.exports = {getCartHandler,calculateCartTotals,buildCartItemsQuery};