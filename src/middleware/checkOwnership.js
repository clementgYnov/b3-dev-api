const Game = require('../models/Game');

// Vérifie que l'utilisateur est bien le propriétaire du jeu
const checkOwnership = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Compare l'ID du propriétaire avec l'ID de l'utilisateur connecté
    if (game.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied. You are not the owner of this game.' });
    }

    // Attache le jeu à la requête pour éviter de le rechercher à nouveau
    req.game = game;
    next();
  } catch (error) {
    console.error('Ownership check error:', error);
    res.status(500).json({ error: 'Server error checking ownership' });
  }
};

module.exports = checkOwnership;
