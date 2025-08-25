const Joi = require("joi");
const logger = require("../../logger.js");


       
async function getProductHandler(req,res,db){
    try{
        const id = req.validatedId;
        logger.debug('Fetching product', { productId: id, userId: req.uid });

        const selected = await db('product').select('*').where('pid','=',id);
          if (selected.length === 0) {
            logger.info('Product not found', { productId: id });
            return res.status(404).json({ message: 'Product not found' });
        }
        logger.info('Product retrieved successfully', { productId: id });
        res.status(200).json(selected);
    }
    catch(err){
        logger.error('Failed to fetch product', { productId: req.validatedId, error: err.message, stack: err.stack });
        res.status(500).json({ error: "Internal server error" });
        
    }
}

async function getProductsHandler(req,res,db){
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const offset = (page - 1) * limit;
        const sort = req.query.sort || 'title';
        const order = req.query.order || 'asc';

       
        let query =  db('product')
        .where('stock', '>=', req.query.available || 1);

        if(req.query.category){
            query = query.andWhere('category','=', req.query.category);
            logger.debug('Applied category filter', {  category: req.query.category });
        }
        if(req.query.minPrice){
            query = query.andWhere('price', '>=', req.query.minPrice);
            logger.debug('Applied minPrice filter', {  minPrice: req.query.minPrice});
        }
        if(req.query.maxPrice){
            query = query.andWhere('price', '<=', req.query.maxPrice);
            logger.debug('Applied maxPrice filter', {  maxPrice: req.query.maxPrice});
        }
         const [{ count }] = await query.clone().count('*');

        const selected = await query.select('*')
        .limit(limit)
        .offset(offset)
        .orderBy(sort,order);

        logger.info('Products retrieved successfully',{total: parseInt(count)});
        res.status(200).json({
            total: parseInt(count),
            page,
            totalPages: Math.ceil(count / limit),
            selected
        });
    }
    catch(err){
        logger.error('Failed to fetch products', { error: err.message, stack: err.stack });
        res.status(500).json({ error: "Internal server error" });
        
    }
}

const schema = Joi.object({
    title : Joi.string().required(),
    description :Joi.string().required(),
    category : Joi.string().required(),
    price : Joi.number().required(),
    stock:Joi.number().default(0)
});


async function addProductHandler(req,res,db){
    try{
        if (req.role != 'admin') {
            logger.warn('Unauthorized attempt to fetch orders', { userId: req.uid });
            return res.status(403).json({error : 'Cannot Access'});
        }
        const {error , value }=schema.validate(req.body);
        if(error){
            logger.info('Product validation failed', { userId: req.uid, error: error.details[0].message });
            return  res.status(400).json({error : error.details[0].message});
        }
        const product = {
            title: value.title,
            description: value.description,
            category : value.category,
            price: value.price,
            stock :value.stock
        };
        const inserted = await db('product').insert(product).returning('*');
        logger.info('Product added successfully', { userId: req.uid, productId: inserted[0].pid });
        res.status(201).json(inserted);
    }
    catch(err){
        logger.error('Failed to add product', { userId: req.uid, error: err.message, stack: err.stack });
        res.status(500).json({ error: "Internal server error" });
        
    }
}


const schemaUpdated = Joi.object({
    title : Joi.string(),
    description :Joi.string(),
    category : Joi.string(),
    price : Joi.number(),
    stock:Joi.number()
});

async function updateProductHandler(req,res,db){
    try{
        if (req.role != 'admin') {
            logger.warn('Unauthorized attempt to update orders', { userId: req.uid });
            return res.status(403).json({error : 'Cannot Access'});
        }
        const id = req.validatedId;

        const {error:bodyError , value:bodyValue }=schemaUpdated.validate(req.body);
        if(bodyError){
            logger.info('Product validation failed', { userId: req.uid, error: bodyError.details[0].message });
            return  res.status(400).json({error : bodyError.details[0].message});
        }
        const product = {};

        if(bodyValue.title)   product.title= bodyValue.title;
        if(bodyValue.description)   product. description= bodyValue.description;
        if(bodyValue.category)   product.category =bodyValue.category;
        if(bodyValue.price)    product.price= bodyValue.price;
        if(bodyValue.stock)   product.stock =bodyValue.stock;
       
         
        const updated = await db('product').where('pid','=',id).update(product).returning('*');
        if (updated.length === 0) {
            logger.warn('Product not found for update', { userId: req.uid, productId: id });
            return res.status(404).json({ message: "Product not found" });
        }
        logger.info('Product updated successfully', { userId: req.uid, productId: updated[0].pid });
        res.status(200).json(updated);
    }
    catch(err){
        logger.error('Failed to update product', { userId: req.uid, error: err.message, stack: err.stack });
        res.status(500).json({ error: "Internal server error" });
        
    }
}

async function deleteProductHandler(req,res,db){
    try{
        if (req.role != 'admin') {
            logger.warn('Unauthorized attempt to delete orders', { userId: req.uid });
            return res.status(403).json({error : 'Cannot Access'});
        }
        const id = req.validatedId;
        const deleted = await db('product').delete().where('pid','=',id).returning('*');
       if(!deleted){
            logger.warn('Product not found for delete', { userId: req.uid, productId: id });
            return res.status(404).json({ message: "Product not found" });
       }
        logger.info('Product deleted successfully', { userId: req.uid, productId: deleted[0].pid });
        res.status(200).json({ message: 'Product Deleted successfully', id });
    }
    catch(err){
        logger.error('Failed to delete product', { userId: req.uid, error: err.message, stack: err.stack });
        res.status(500).json({ error: "Internal server error" });
        
    }
}


async function searchProductsHandler(req,res,db){
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const offset = (page - 1) * limit;
        const sort = req.query.sort || 'title';
        const order = req.query.order || 'asc';

        
        let query =  db('product')
        .where('stock', '>=', req.query.available || 1);

        if (req.query.q) {
            query = query.where(function () {
                this.where("title", "ilike", `%${req.query.q}%`)
                    .orWhere("description", "ilike", `%${req.query.q}%`);
            });
            logger.debug('Applied search query', { q: req.query.q });
        }

        if(req.query.category){
            query = query.where('category','=', req.query.category);
            logger.debug('Applied category filter', {  category: req.query.category});
        }
        if(req.query.minPrice){
            query = query.where('price', '>=', req.query.minPrice);
            logger.debug('Applied minPrice filter', {  minPrice: req.query.minPrice});
        }
        if(req.query.maxPrice){
            query = query.where('price', '<=', req.query.maxPrice);
            logger.debug('Applied maxPrice filter', {  maxPrice: req.query.maxPrice});

        }
        const [{ count }] = await query.clone().count('*');
        const selected = await query.select('*')
        .limit(limit)
        .offset(offset)
        .orderBy(sort,order);

         logger.info('Products search completed', {
            userId: req.uid,
            totalResults: parseInt(count),
            returned: selected.length,
            page,
            totalPages: Math.ceil(count / limit)
        });
        res.status(200).json({
            total: parseInt(count),
            page,
            totalPages: Math.ceil(count / limit),
            selected
        });
    }
    catch(err){
        logger.error('Failed to search product', { userId: req.uid, error: err.message, stack: err.stack });
        res.status(500).json({ error: "Internal server error" });
    }
}

module.exports= {getProductHandler ,
    getProductsHandler, 
    addProductHandler , 
    updateProductHandler , 
    deleteProductHandler,
    searchProductsHandler};