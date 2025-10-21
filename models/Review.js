const mongoose = require('mongoose');

// gameId, userId, rating (1-5), comment, created
const reviewSchema = new mongoose.Schema({
    gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '' }
}, { timestamps: { createdAt: 'createdAt' } });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;