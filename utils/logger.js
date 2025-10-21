const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

// Créer le dossier logs s'il n'existe pas
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Chemins des fichiers de log
const errorLogPath = path.join(logsDir, 'errors.log');
const accessLogPath = path.join(logsDir, 'access.log');

// Créer un stream pour écrire dans access.log
const accessLogStream = fs.createWriteStream(accessLogPath, { flags: 'a' });

// Configuration de Morgan
// Format: :method :url :status :response-time ms - :date[iso]
const morganFormat = ':method :url :status :response-time ms - :date[iso]';

// Middleware Morgan pour logger toutes les requêtes
const requestLogger = morgan(morganFormat, {
  stream: accessLogStream
});

// Middleware Morgan pour la console (coloré en développement)
const consoleLogger = morgan('dev');

// Fonction simple pour écrire les erreurs
const writeErrorLog = (message) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(errorLogPath, logEntry);
};

// Logger simple pour les erreurs et infos
const logger = {
  // Log d'erreur
  error: (message, error = null) => {
    const errorMsg = error 
      ? `ERROR: ${message} - ${error.message}\n${error.stack}`
      : `ERROR: ${message}`;
    
    console.error(`❌ ${errorMsg}`);
    writeErrorLog(errorMsg);
  },
  
  // Log d'info
  info: (message) => {
    console.log(`ℹ️  ${message}`);
    const timestamp = new Date().toISOString();
    fs.appendFileSync(accessLogPath, `[${timestamp}] INFO: ${message}\n`);
  }
};

module.exports = {
  logger,
  requestLogger,
  consoleLogger
};
