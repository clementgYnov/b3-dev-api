const express = require('express');
const mongoose = require('mongoose');
const app = express();
const Product = require('./models/Product');

const mongoUrl = "mongodb+srv://clementgrosieux93_db_user:khTKnXuyRQ2yV8jD@cluster0.qd0lxci.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoUrl, {})
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });

app.use(express.json());

let posts = [
    {id: 1, title: "Mon premier post", like: 0},
    {id: 2, title: "Mon deuxième post", like: 0},
    {id: 3, title: "Mon troisième post", like: 0},
];

app.use((req, res, next) => {
    console.log("Middleware");
    next();
})


// j'intercepte les requêtes GET sur /products
app.get('/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.get('/productspage', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const skip = (page - 1) * limit;
        const products = await Product.find().skip(skip).limit(limit);
        const total = await Product.countDocuments();

        res.json({
            data: products,
            pagination: {
                page: page,
                limit: limit,
                total: total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// j'intercepte les requêtes POST sur /posts
app.post("/products", async (req, res) => {
    try {
        const { name, price } = req.body;
        if(!name || !price) {
            return res.status(400).json({ message: "Name and price are required" });
        }

        // findByIdAndUpdate

        const newProduct = new Product({ name, price });
        const savedProduct = await newProduct.save();
        res.status(201).json({
            message: "Product created",
            product: savedProduct
        });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ message: "Server error" });
    }
})

app.patch("/products/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price } = req.body;

        if(!name && !price) {
            return res.status(400).json({ message: "Name or price are required" });
        }

        // Construire l'objet de mise à jour avec seulement les champs fournis
        const updateData = {};
        if (name) updateData.name = name;
        if (price) updateData.price = price;

        const updatedProduct = await Product.findByIdAndUpdate(
            id, updateData, {new: true}
        );
        if(!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json({
            message: "Product updated",
            product: updatedProduct
        });
    }
    catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ message: "Server error" });
    }
});


app.post("/posts/:id/like", (req, res) => {
    const id = parseInt(req.params.id);
    const post = posts.find(p => p.id === id);
    if (!post) {
        return res.status(404).json({ message: "Post not found" });
    }
    post.like += 1;
    res.status(200).json({
        message: "Post liked",
        post: post
    });
});


app.listen(3000, () => {
  console.log(`Server is running at http://localhost:3000`);
});
