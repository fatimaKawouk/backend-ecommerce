const winston = require('winston');

const logger = winston.createLogger({
  level: 'debug' ,
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(), // logs to console
    new winston.transports.File({ filename: 'app.log' }) // logs to file
  ],
});

module.exports = logger;
