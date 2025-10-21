const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * Middleware pour vérifier les résultats de validation express-validator
 * À utiliser après les règles de validation
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Extraire les erreurs
    const extractedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));
    
    // Créer une erreur de validation avec toutes les erreurs
    const validationError = new ValidationError('Erreur de validation', extractedErrors);
    return next(validationError);
  }
  
  // Pas d'erreurs, continuer
  next();
};

module.exports = {
  validate
};
