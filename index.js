const express = require("express");
const db = require("./db");
const {registerHandler} = require("./src/handlers/registerHandler.js");
const {loginHandler} = require("./src/handlers/loginHandler.js");
const {authenticateToken} = require("./src/middlewares/authenticateToken.js");

const app = express();
const port  = 3000;

app.use(express.json());

app.post("/auth/register",(req,res) =>  registerHandler(req,res,db));

app.post("/auth/login", (req,res) => loginHandler(req,res,db));




app.listen(port , ()=>{
    console.log("Listening at port :"+port);

});
