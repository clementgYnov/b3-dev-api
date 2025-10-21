const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../utils/errors');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt';

// Générer un token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId: userId }, 
    JWT_SECRET,
    { expiresIn: '24h' } // Token valide 24h
  );
};


const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Token d\'authentification manquant ou invalide', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.userId);
    next();
  } catch (error) {
    next(new AppError('Token d\'authentification invalide', 401));
  }
};

module.exports = {
    generateToken,
    authMiddleware
};