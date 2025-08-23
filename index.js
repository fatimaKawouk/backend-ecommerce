const express = require("express");
const db = require("./db");


const {registerHandler} = require("./src/handlers/registerHandler.js");
const {loginHandler} = require("./src/handlers/loginHandler.js");
const {getProductHandler , addProductHandler , getProductsHandler ,updateProductHandler ,deleteProductHandler} = require("./src/handlers/productHandler.js");
const {authenticateToken} = require("./src/middlewares/authenticateToken.js");
const {getUsersHandler , getUserHandler ,updateUserHandler , deleteUserHandler} = require("./src/handlers/userHandler.js");
const {getOrderHandler ,getOrdersHandler, createOrderHandler , updateOrderHandler } = require("./src/handlers/orderHandler.js");
const {validateParamMiddleware} = require("./src/middlewares/validateParam.js");

const app = express();
const port  = 3000;

app.use(express.json());

app.post("/auth/login", (req,res) => loginHandler(req,res,db));




//products CRUD

app.get("/products", (req,res) => 
    getProductsHandler(req,res,db)
); //everyone can read products

app.get("/products/:id",validateParamMiddleware, (req,res) => 
    getProductHandler(req,res,db)
); //everyone can read a specifi product

app.post("/products",authenticateToken, (req,res) => 
    addProductHandler(req,res,db)
);//admin add products

app.put("/products/:id", [authenticateToken ,validateParamMiddleware] ,(req,res) => 
    updateProductHandler(req,res,db)
);//admin update products

app.delete("/products/:id",[authenticateToken ,validateParamMiddleware], (req,res) =>
     deleteProductHandler(req,res,db)
); //admin delete product




//Users CRUD

app.post("/auth/register",(req,res) =>  
    registerHandler(req,res,db)
); //user register 

app.post("/users",authenticateToken, (req,res) => 
    addProductHandler(req,res,db)
); //admin create user

app.get("/users",authenticateToken, (req,res) => 
    getUsersHandler(req,res,db)
); //admin read users

app.get("/users/:id",[authenticateToken ,validateParamMiddleware], (req,res) =>
     getUserHandler(req,res,db)
); // admin can read specific user and user can only read himself

app.put("/users/:id", [authenticateToken ,validateParamMiddleware] ,(req,res) => 
    updateUserHandler(req,res,db)
);//admin can edit users and user can only edit himself

app.delete("/users/:id",[authenticateToken ,validateParamMiddleware]  , (req,res) => 
    deleteUserHandler(req,res,db)
);//admin can delete users and user can only delete himself




//Orders CRUD

app.post("/orders",authenticateToken, (req,res) =>  
    createOrderHandler(req,res,db)
); //user create order

app.get("/orders",authenticateToken, (req,res) => 
    getOrdersHandler(req,res,db)
); //admin read orders

app.get("/orders/:id",[authenticateToken ,validateParamMiddleware], (req,res) =>
     getOrderHandler(req,res,db)
); // admin can read specific order and user can only read his order passing userid as param

app.put("/orders/:id", [authenticateToken ,validateParamMiddleware],(req,res) => 
    updateOrderHandler(req,res,db)
);//admin can edit order status




app.listen(port , ()=>{
    console.log("Listening at port :"+port);

});
