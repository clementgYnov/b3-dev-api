const { body, param } = require('express-validator');

const registerValidation = [
    body('username')
        .notEmpty().withMessage('Le nom d\'utilisateur est requis')
        .isLength({ min: 3 }).withMessage('Le nom d\'utilisateur doit contenir au moins 3 caractères'),
    body('email')
        .notEmpty().withMessage('L\'email est requis')
        .isEmail().withMessage('L\'email doit être valide'),
    body('password')
        .notEmpty().withMessage('Le mot de passe est requis')
        .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    body('bio')
        .optional()
        .isLength({ max: 200 }).withMessage('La bio ne doit pas dépasser 200 caractères')
];

const loginValidation = [
    body('email')
        .notEmpty().withMessage('L\'email est requis')
        .isEmail().withMessage('L\'email doit être valide'),
    body('password')
        .notEmpty().withMessage('Le mot de passe est requis')
];

module.exports = { registerValidation };