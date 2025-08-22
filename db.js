const request  = require("pg");
const knex = require("knex");
require('dotenv').config()

const db =knex({
    client: 'pg',
    connection :{
        host:"localhost",
        user:process.env.USER_DB,
        database:process.env.NAME_DB,
        password:process.env.PASSWORD_DB,
        port:process.env.PORT_DB,
  }
   
})



module.exports = db;