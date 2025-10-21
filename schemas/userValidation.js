const { body, param } = require('express-validator');

// Règles de validation pour la création d'un utilisateur
const createUserValidation = [
  body('nom')
    .trim()
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Le nom ne doit contenir que des lettres'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('L\'email doit être valide')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('L\'email ne doit pas dépasser 100 caractères'),
  
  body('age')
    .optional()
    .isInt({ min: 18, max: 120 }).withMessage('L\'âge doit être un nombre entre 18 et 120'),
  
  body('telephone')
    .optional()
    .trim()
    .matches(/^(\+33|0)[1-9](\d{2}){4}$/).withMessage('Le numéro de téléphone français n\'est pas valide')
];

// Règles de validation pour la mise à jour d'un utilisateur
const updateUserValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('L\'ID doit être un nombre entier positif'),
  
  body('nom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Le nom ne doit contenir que des lettres'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('L\'email doit être valide')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('L\'email ne doit pas dépasser 100 caractères'),
  
  body('age')
    .optional()
    .isInt({ min: 18, max: 120 }).withMessage('L\'âge doit être un nombre entre 18 et 120'),
  
  body('telephone')
    .optional()
    .trim()
    .matches(/^(\+33|0)[1-9](\d{2}){4}$/).withMessage('Le numéro de téléphone français n\'est pas valide')
];

// Règles de validation pour l'ID dans les paramètres
const userIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('L\'ID doit être un nombre entier positif')
];

module.exports = {
  createUserValidation,
  updateUserValidation,
  userIdValidation
};
