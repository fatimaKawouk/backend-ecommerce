const express = require("express");
const db = require("./db");
const {registerHandler} = require("./src/handlers/registerHandler.js");
const {loginHandler} = require("./src/handlers/loginHandler.js");
const {getProductHandler , addProductHandler , getProductsHandler ,updateProductHandler ,deleteProductHandler} = require("./src/handlers/productHandler.js");
const {authenticateToken} = require("./src/middlewares/authenticateToken.js");
const {getUsersHandler , getUserHandler ,updateUserHandler , deleteUserHandler} = require("./src/handlers/userHandler.js");

const app = express();
const port  = 3000;

app.use(express.json());

app.post("/auth/login", (req,res) => loginHandler(req,res,db));




//products CRUD

app.get("/products", (req,res) => 
    getProductsHandler(req,res,db)
); //everyone can read products

app.get("/products/:id", (req,res) => 
    getProductHandler(req,res,db)
); //everyone can read a specifi product

app.post("/products",authenticateToken, (req,res) => 
    addProductHandler(req,res,db)
);//admin add products

app.put("/products/:id", authenticateToken ,(req,res) => 
    updateProductHandler(req,res,db)
);//admin update products

app.delete("/products/:id", authenticateToken , (req,res) =>
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

app.get("/users/:id",authenticateToken, (req,res) =>
     getUserHandler(req,res,db)
); // admin can read specific user and user can only read himself

app.put("/users/:id", authenticateToken ,(req,res) => 
    updateUserHandler(req,res,db)
);//admin can edit users and user can only edit himself

app.delete("/users/:id", authenticateToken , (req,res) => 
    deleteUserHandler(req,res,db)
);//admin can delete users and user can only delete himself




app.listen(port , ()=>{
    console.log("Listening at port :"+port);

});
