const express = require('express');
const router = express.Router();
const { registerController } = require('../controllers/authController');
const { validate } = require('../middlewares/validationMiddleware');
const { registerValidation } = require('../validators/userValidator');

router.post('/register', registerValidation, validate, registerController);

module.exports = router;