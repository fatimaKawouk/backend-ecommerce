const express = require("express");
const db = require("./db");
const {registerHandler} = require("./src/handlers/registerHandler.js");
const {loginHandler} = require("./src/handlers/loginHandler.js");
const {getProductHandler , addProductHandler , getProductsHandler ,updateProductHandler ,deleteProductHandler} = require("./src/handlers/productHandler.js");
const {authenticateToken} = require("./src/middlewares/authenticateToken.js");

const app = express();
const port  = 3000;

app.use(express.json());



app.post("/auth/login", (req,res) => loginHandler(req,res,db));

//products CRUD
app.get("/products", (req,res) => getProductsHandler(req,res,db));

app.get("/products/:id", (req,res) => getProductHandler(req,res,db));

app.post("/products",authenticateToken, (req,res) => addProductHandler(req,res,db));

app.put("/products/:id", authenticateToken ,(req,res) => updateProductHandler(req,res,db));

app.delete("/products/:id", authenticateToken , (req,res) => deleteProductHandler(req,res,db));


app.listen(port , ()=>{
    console.log("Listening at port :"+port);

});
