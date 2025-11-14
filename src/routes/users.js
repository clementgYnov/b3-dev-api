const express = require('express');
const Game = require('../models/Game');

const router = express.Router();

// GET /api/users/:id/borrowed - Liste des jeux empruntés par un utilisateur
router.get('/:id/borrowed', async (req, res) => {
  try {
    const userId = req.params.id;

    // Récupérer tous les jeux empruntés par cet utilisateur
    const borrowedGames = await Game.find({
      borrowedBy: userId,
      status: 'borrowed',
    })
      .populate('ownerId', 'username email')
      .populate('borrowedBy', 'username email')
      .sort({ borrowedAt: -1 });

    res.json({
      count: borrowedGames.length,
      games: borrowedGames,
    });
  } catch (error) {
    console.error('Get borrowed games error:', error);
    res.status(500).json({ error: 'Server error retrieving borrowed games' });
  }
});

module.exports = router;
