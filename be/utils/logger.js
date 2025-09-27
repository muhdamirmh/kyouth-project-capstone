const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        // Log all errors to a dedicated file
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        // Log all info/error to the console
        new winston.transports.Console({ format: winston.format.simple() }),
    ],
});

module.exports = logger;