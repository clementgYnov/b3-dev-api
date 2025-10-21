const express = require('express');
const authRoute = require('./routes/authRoute');
const mongoose = require('mongoose');
require('dotenv').config();

const { errorHandler, notFoundHandler } = require('./middlewares/errorMiddleware');
const { logger, requestLogger, consoleLogger } = require('./utils/logger');
const { AppError, ValidationError, asyncHandler } = require('./utils/errors');

const app = express();
const PORT = process.env.PORT || 3000;



app.use(express.json());

// Logger les requêtes
app.use(requestLogger);
app.use(consoleLogger);

const mongoUrl = process.env.MONGODB_URL;

mongoose.connect(mongoUrl, {})
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });


// Routes
app.use('/auth', authRoute);

// Gestion des erreurs
app.use(errorHandler);
app.use(notFoundHandler);


app.listen(PORT, () => {
  logger.info(`Serveur démarré sur http://localhost:${PORT}`);
  logger.info('🚀 Serveur prêt!');
});