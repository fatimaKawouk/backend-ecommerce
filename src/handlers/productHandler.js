const Joi = require("joi");



       
async function getProductHandler(req,res,db){
    try{
        const id = req.validatedId;

        const selected = await db('product').select('*').where('pid','=',id);
        res.status(200).json(selected);
    }
    catch(err){
        console.error(err);
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
        }
        if(req.query.minPrice){
            query = query.andWhere('price', '>=', req.query.minPrice);
        }
        if(req.query.maxPrice){
            query = query.andWhere('price', '<=', req.query.maxPrice);
        }
         const [{ count }] = await query.clone().count('*');

        const selected = await query.select('*')
        .limit(limit)
        .offset(offset)
        .orderBy(sort,order);

        res.status(200).json({
            total: parseInt(count),
            page,
            totalPages: Math.ceil(count / limit),
            selected
        });
    }
    catch(err){
        console.error(err);
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
        if (req.role != 'admin') return res.status(403).json({error : 'Cannot Access'});
   
        const {error , value }=schema.validate(req.body);
        if(error) return  res.status(400).json({error : error.details[0].message});

        const product = {
            title: value.title,
            description: value.description,
            category : value.category,
            price: value.price,
            stock :value.stock
        };
        const inserted = await db('product').insert(product).returning('*');
        res.status(201).json(inserted);
    }
    catch(err){
         console.error(err);
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
        if (req.role != 'admin') return res.status(403).json({error : 'Cannot Access'});

        const id = req.validatedId;

        const {error:bodyError , value:bodyValue }=schemaUpdated.validate(req.body);
        if(bodyError) return  res.status(400).json({error : bodyError.details[0].message});

        const product = {
            title: bodyValue.title,
            description: bodyValue.description,
            category : bodyValue.category,
            price: bodyValue.price,
            stock :bodyValue.stock
        };
         
        const updated = await db('product').where('pid','=',id).update(product).returning('*');
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

async function deleteProductHandler(req,res,db){
    try{
        if (req.role != 'admin') return res.status(403).json({error : 'Cannot Access'});

        const id = req.validatedId;
        await db('product').delete().where('pid','=',id);
       
        res.status(200).json({ message: 'Product Deleted successfully', id });
    }
    catch(err){
         console.error(err);
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

        const [{ count }] = await db('product').count('*');
        let query =  db('product')
        .select('*')
        .limit(limit)
        .offset(offset)
        .orderBy(sort,order)
        .where('stock', '>=', req.query.available || 1);

        if (req.query.q) {
            query = query.where(function () {
                this.where("title", "ilike", `%${req.query.q}%`)
                    .orWhere("description", "ilike", `%${req.query.q}%`);
            });
        }

        if(req.query.category){
            query = query.where('category','=', req.query.category);
        }
        if(req.query.minPrice){
            query = query.where('price', '>=', req.query.minPrice);
        }
        if(req.query.maxPrice){
            query = query.where('price', '<=', req.query.maxPrice);
        }
        
        const selected = await query;
        res.status(200).json({
            total: parseInt(count),
            page,
            totalPages: Math.ceil(count / limit),
            selected
        });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
        
    }
}

module.exports= {getProductHandler ,
    getProductsHandler, 
    addProductHandler , 
    updateProductHandler , 
    deleteProductHandler,
    searchProductsHandler};