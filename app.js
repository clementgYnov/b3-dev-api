const express = require('express');
const { AppError, asyncHandler } = require('./utils/errors');
const { logger, requestLogger, consoleLogger } = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const { validate } = require('./middleware/validationMiddleware');
const { createUserValidation, updateUserValidation, userIdValidation } = require('./schemas/userValidation');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());

// Morgan pour logger les requêtes HTTP
app.use(consoleLogger);      // Logs colorés dans la console
app.use(requestLogger);       // Logs dans le fichier access.log

// Données en mémoire pour la démo
let users = [
  { id: 1, nom: 'Alice', email: 'alice@test.com' },
  { id: 2, nom: 'Bob', email: 'bob@test.com' }
];

// ========================================
// ROUTES
// ========================================

// Route d'accueil
app.get('/', (req, res) => {
  res.json({
    message: 'API Simple - Gestion d\'erreurs 🚨',
    routes: {
      users: 'GET /users - Liste des utilisateurs',
      userById: 'GET /users/:id - Utilisateur par ID',
      createUser: 'POST /users - Créer un utilisateur (avec validation)',
      updateUser: 'PUT /users/:id - Mettre à jour un utilisateur',
      deleteUser: 'DELETE /users/:id - Supprimer un utilisateur',
      tests: {
        notFound: 'GET /users/999 - Test 404',
        validationError: 'POST /users (body vide) - Test validation',
        invalidId: 'GET /users/abc - Test validation ID',
        serverError: 'GET /test/error - Test erreur 500',
        asyncError: 'GET /test/async-error - Test erreur async'
      }
    },
    logs: 'Consultez le dossier ./logs pour les fichiers de log'
  });
});

// Lister tous les utilisateurs
app.get('/users', (req, res) => {
  res.json({ users });
});

// Récupérer un utilisateur par ID
app.get('/users/:id', userIdValidation, validate, (req, res, next) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    // Créer une erreur 404
    return next(new AppError('Utilisateur non trouvé', 404));
  }
  
  res.json({ user });
});

// Créer un utilisateur
app.post('/users', createUserValidation, validate, (req, res, next) => {
  const { nom, email, age, telephone } = req.body;
  
  // Vérifier si l'email existe déjà
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return next(new AppError('Cet email est déjà utilisé', 409));
  }
  
  const newUser = {
    id: users.length + 1,
    nom,
    email,
    ...(age && { age }),
    ...(telephone && { telephone })
  };
  
  users.push(newUser);
  
  res.status(201).json({
    message: 'Utilisateur créé avec succès',
    user: newUser
  });
});

// Mettre à jour un utilisateur
app.put('/users/:id', updateUserValidation, validate, (req, res, next) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return next(new AppError('Utilisateur non trouvé', 404));
  }
  
  const { nom, email, age, telephone } = req.body;
  
  // Vérifier si le nouvel email est déjà utilisé par un autre utilisateur
  if (email) {
    const existingUser = users.find(u => u.email === email && u.id !== userId);
    if (existingUser) {
      return next(new AppError('Cet email est déjà utilisé', 409));
    }
  }
  
  // Mettre à jour l'utilisateur
  users[userIndex] = {
    ...users[userIndex],
    ...(nom && { nom }),
    ...(email && { email }),
    ...(age && { age }),
    ...(telephone && { telephone })
  };
  
  res.json({
    message: 'Utilisateur mis à jour avec succès',
    user: users[userIndex]
  });
});

// Supprimer un utilisateur
app.delete('/users/:id', userIdValidation, validate, (req, res, next) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return next(new AppError('Utilisateur non trouvé', 404));
  }
  
  const deletedUser = users.splice(userIndex, 1)[0];
  
  res.json({
    message: 'Utilisateur supprimé avec succès',
    user: deletedUser
  });
});

// ========================================
// ROUTES DE TEST D'ERREURS
// ========================================

// Test d'erreur simple (synchrone)
app.get('/test/error', (req, res, next) => {
  // Déclencher une erreur
  throw new AppError('Ceci est une erreur de test', 500);
});

// Test d'erreur asynchrone
app.get('/test/async-error', asyncHandler(async (req, res, next) => {
  // Simuler une opération async qui échoue
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new AppError('Erreur asynchrone simulée', 500));
    }, 100);
  });
}));

// Test d'erreur JavaScript non gérée
app.get('/test/unhandled', (req, res) => {
  // Ceci va déclencher une erreur non gérée
  const obj = null;
  obj.property; // TypeError: Cannot read property of null
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ========================================
// MIDDLEWARES D'ERREUR (en dernier)
// ========================================

// 404 pour les routes non trouvées
app.use(notFoundHandler);

// Gestionnaire d'erreurs principal
app.use(errorHandler);

// ========================================
// DÉMARRAGE DU SERVEUR
// ========================================

app.listen(PORT, () => {
  logger.info(`Serveur démarré sur http://localhost:${PORT}`);
  console.log('🚀 Serveur prêt!');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log('📂 Logs: ./logs/');
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection', error);
  process.exit(1);
});
