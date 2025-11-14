const { body, query } = require('express-validator');

const createGameValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required'),
  body('platform')
    .trim()
    .notEmpty()
    .withMessage('Platform is required'),
  body('genre')
    .trim()
    .notEmpty()
    .withMessage('Genre is required'),
  body('releaseYear')
    .isInt({ min: 1970, max: new Date().getFullYear() + 2 })
    .withMessage('Release year must be valid'),
  body('status')
    .optional()
    .isIn(['available', 'borrowed', 'playing'])
    .withMessage('Status must be available, borrowed, or playing'),
];

const updateGameValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty'),
  body('platform')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Platform cannot be empty'),
  body('genre')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Genre cannot be empty'),
  body('releaseYear')
    .optional()
    .isInt({ min: 1970, max: new Date().getFullYear() + 2 })
    .withMessage('Release year must be valid'),
  body('status')
    .optional()
    .isIn(['available', 'borrowed', 'playing'])
    .withMessage('Status must be available, borrowed, or playing'),
];

// Validation pour les filtres de recherche
const filterValidation = [
  query('platform')
    .optional()
    .trim(),
  query('genre')
    .optional()
    .trim(),
  query('status')
    .optional()
    .isIn(['available', 'borrowed', 'playing'])
    .withMessage('Invalid status filter'),
];

module.exports = {
  createGameValidation,
  updateGameValidation,
  filterValidation,
};
