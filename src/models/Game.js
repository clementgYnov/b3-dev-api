const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  platform: {
    type: String,
    required: [true, 'Platform is required'],
    trim: true,
  },
  genre: {
    type: String,
    required: [true, 'Genre is required'],
    trim: true,
  },
  releaseYear: {
    type: Number,
    required: [true, 'Release year is required'],
    min: [1970, 'Release year must be after 1970'],
    max: [new Date().getFullYear() + 2, 'Release year cannot be too far in the future'],
  },
  status: {
    type: String,
    enum: ['available', 'borrowed', 'playing'],
    default: 'available',
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  borrowedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  borrowedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Game', gameSchema);
