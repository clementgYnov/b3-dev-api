const express = require('express');
const { validationResult } = require('express-validator');
const Game = require('../models/Game');
const Review = require('../models/Review');
const authenticate = require('../middleware/authenticate');
const checkOwnership = require('../middleware/checkOwnership');
const {
  createGameValidation,
  updateGameValidation,
  filterValidation,
} = require('../validators/gameValidators');
const {
  createReviewValidation,
} = require('../validators/reviewValidators');

const router = express.Router();

// GET /api/games - Liste publique avec filtres optionnels
router.get('/', filterValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { platform, genre, status } = req.query;
    const filters = {};

    // Ajoute les filtres seulement s'ils sont présents
    if (platform) filters.platform = platform;
    if (genre) filters.genre = genre;
    if (status) filters.status = status;

    const games = await Game.find(filters)
      .populate('ownerId', 'username email')
      .populate('borrowedBy', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      count: games.length,
      games,
    });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ error: 'Server error retrieving games' });
  }
});

// POST /api/games/:gameId/reviews - Créer un avis pour un jeu
router.post('/:gameId/reviews', authenticate, createReviewValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { gameId } = req.params;
    const { rating, comment } = req.body;

    // Vérifier que le jeu existe
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Vérifier si l'utilisateur a déjà laissé un avis pour ce jeu
    const existingReview = await Review.findOne({
      gameId,
      userId: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this game' });
    }

    // Créer l'avis
    const review = new Review({
      gameId,
      userId: req.user._id,
      rating,
      comment,
    });

    await review.save();

    // Populate les informations de l'utilisateur
    await review.populate('userId', 'username email');

    res.status(201).json({
      message: 'Review created successfully',
      review,
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Server error creating review' });
  }
});

// GET /api/games/:gameId/reviews - Lister les avis d'un jeu avec moyenne
router.get('/:gameId/reviews', async (req, res) => {
  try {
    const { gameId } = req.params;

    // Vérifier que le jeu existe
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Récupérer tous les avis du jeu
    const reviews = await Review.find({ gameId })
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });

    // Calculer la moyenne des ratings
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRating / reviews.length;
    }

    res.json({
      count: reviews.length,
      averageRating: parseFloat(averageRating.toFixed(2)),
      reviews,
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Server error retrieving reviews' });
  }
});

// GET /api/games/:id - Détails d'un jeu avec owner et reviews
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('ownerId', 'username email bio')
      .populate('borrowedBy', 'username email');

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({ game });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ error: 'Server error retrieving game' });
  }
});

// POST /api/games - Créer un jeu (auth requise)
router.post('/', authenticate, createGameValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, platform, genre, releaseYear, status } = req.body;

    const game = new Game({
      title,
      platform,
      genre,
      releaseYear,
      status: status || 'available',
      ownerId: req.user._id, // Utilise l'ID de l'utilisateur connecté
    });

    await game.save();

    // Populate le propriétaire avant de renvoyer
    await game.populate('ownerId', 'username email');

    res.status(201).json({
      message: 'Game created successfully',
      game,
    });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Server error creating game' });
  }
});

// PUT /api/games/:id - Modifier son jeu (ownership requis)
router.put('/:id', authenticate, checkOwnership, updateGameValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, platform, genre, releaseYear, status } = req.body;

    // req.game vient du middleware checkOwnership
    const game = req.game;

    // Met à jour seulement les champs fournis
    if (title !== undefined) game.title = title;
    if (platform !== undefined) game.platform = platform;
    if (genre !== undefined) game.genre = genre;
    if (releaseYear !== undefined) game.releaseYear = releaseYear;
    if (status !== undefined) game.status = status;

    await game.save();
    await game.populate('ownerId', 'username email');

    res.json({
      message: 'Game updated successfully',
      game,
    });
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ error: 'Server error updating game' });
  }
});

// DELETE /api/games/:id - Supprimer son jeu (ownership requis)
router.delete('/:id', authenticate, checkOwnership, async (req, res) => {
  try {
    // req.game vient du middleware checkOwnership
    await req.game.deleteOne();

    res.json({
      message: 'Game deleted successfully',
    });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ error: 'Server error deleting game' });
  }
});

// POST /api/games/:id/borrow - Emprunter un jeu disponible
router.post('/:id/borrow', authenticate, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Vérifier que le jeu est disponible
    if (game.status !== 'available') {
      return res.status(400).json({ error: 'Game is not available for borrowing' });
    }

    // Empêcher le propriétaire d'emprunter son propre jeu
    if (game.ownerId.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot borrow your own game' });
    }

    // Mettre à jour le jeu
    game.status = 'borrowed';
    game.borrowedBy = req.user._id;
    game.borrowedAt = new Date();

    await game.save();
    await game.populate('ownerId', 'username email');
    await game.populate('borrowedBy', 'username email');

    res.json({
      message: 'Game borrowed successfully',
      game,
    });
  } catch (error) {
    console.error('Borrow game error:', error);
    res.status(500).json({ error: 'Server error borrowing game' });
  }
});

// POST /api/games/:id/return - Retourner un jeu (emprunteur ou propriétaire)
router.post('/:id/return', authenticate, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Vérifier que le jeu est bien emprunté
    if (game.status !== 'borrowed') {
      return res.status(400).json({ error: 'Game is not currently borrowed' });
    }

    // Vérifier que c'est l'emprunteur ou le propriétaire
    const isOwner = game.ownerId.toString() === req.user._id.toString();
    const isBorrower = game.borrowedBy && game.borrowedBy.toString() === req.user._id.toString();

    if (!isOwner && !isBorrower) {
      return res.status(403).json({ error: 'Only the owner or borrower can return this game' });
    }

    // Remettre le jeu disponible
    game.status = 'available';
    game.borrowedBy = null;
    game.borrowedAt = null;

    await game.save();
    await game.populate('ownerId', 'username email');

    res.json({
      message: 'Game returned successfully',
      game,
    });
  } catch (error) {
    console.error('Return game error:', error);
    res.status(500).json({ error: 'Server error returning game' });
  }
});

module.exports = router;
