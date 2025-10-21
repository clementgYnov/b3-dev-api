const { logger } = require('../utils/logger');
const { AppError } = require('../utils/errors');

// Middleware principal de gestion des erreurs
const errorHandler = (err, req, res, next) => {
  // Logger l'erreur
  logger.error(`${req.method} ${req.originalUrl}`, err);
  
  // Déterminer le status code
  const statusCode = err.statusCode || 500;
  
  // Construire la réponse
  const response = {
    success: false,
    message: err.message || 'Erreur interne du serveur',
    timestamp: err.timestamp || new Date().toISOString()
  };
  
  // En développement, ajouter la stack trace
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }
  
  res.status(statusCode).json(response);
};

// Middleware pour les routes non trouvées
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.method} ${req.originalUrl} non trouvée`, 404);
  next(error);
};

module.exports = {
  errorHandler,
  notFoundHandler
};
