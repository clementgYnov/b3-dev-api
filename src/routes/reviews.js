const express = require('express');
const { validationResult } = require('express-validator');
const Review = require('../models/Review');
const authenticate = require('../middleware/authenticate');
const {
  updateReviewValidation,
} = require('../validators/reviewValidators');

const router = express.Router();

// PUT /api/reviews/:id - Modifier son propre avis
router.put('/:id', authenticate, updateReviewValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const reviewId = req.params.id;
    const { rating, comment } = req.body;

    // Trouver l'avis
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Vérifier que c'est l'auteur de l'avis
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only edit your own reviews' });
    }

    // Mettre à jour les champs fournis
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();
    await review.populate('userId', 'username email');

    res.json({
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Server error updating review' });
  }
});

// DELETE /api/reviews/:id - Supprimer son propre avis
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const reviewId = req.params.id;

    // Trouver l'avis
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Vérifier que c'est l'auteur de l'avis
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    await review.deleteOne();

    res.json({
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Server error deleting review' });
  }
});

module.exports = router;
