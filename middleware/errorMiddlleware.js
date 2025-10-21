const {logger} = require('../utils/logger');
const { AppError } = require('../utils/error');

const errorHandler = (err, req, res, next) => {
    // Logger l'erreur
    logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, err);

    const statusCode = err.statusCode || 500;

    const response = {
        success: false,
        message: err.message || 'Internal Server Error',
        timestamp: new Date().toISOString()
    };

    if(process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
}

const notFoundHandler = (req, res, next) => {
    const error = new AppError(`Cannot find ${req.originalUrl} on this server`, 404);
    next(error);
}

module.exports = {
    errorHandler,
    notFoundHandler
};