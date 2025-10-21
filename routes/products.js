const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { authenticateUser } = require('../middleware/auth');

router.get('/', authenticateUser, async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

module.exports = router;