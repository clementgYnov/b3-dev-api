const { body } = require('express-validator');

// Validation pour la création d'un avis
const createReviewValidation = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .notEmpty()
    .withMessage('Comment is required')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment must be at most 1000 characters'),
];

// Validation pour la modification d'un avis
const updateReviewValidation = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment must be at most 1000 characters'),
];

module.exports = {
  createReviewValidation,
  updateReviewValidation,
};
