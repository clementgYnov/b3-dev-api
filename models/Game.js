const mongoose = require('mongoose');

const GAME_STATUS = ['available', 'borrowed', 'playing'];
// title, platform, genre, releaseYear, status (available/borrowed/playing), ownerId, borrowedBy, borrowedAt
const gameSchema = new mongoose.Schema({
    title: { type: String, required: true },
    platform: { type: String, required: true },
    genre: { type: String, required: true },
    releaseYear: { type: Number, required: true },
    status: { type: String, enum: GAME_STATUS, default: 'available' },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    borrowedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    borrowedAt: { type: Date, default: null }
}, { timestamps: true });

const Game = mongoose.model('Game', gameSchema);
module.exports = Game;
