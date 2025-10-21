const express = require('express');
const mongoose = require('mongoose');
const app = express();
const Product = require('./models/Product');
const User = require('./models/User');
const {
    generateToken,
    authenticateUser,
    requiredRole,
    requireAnyRole,
    requirePermission,
    optionalAuthenticate
} = require('./middleware/auth');



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

app.get('/roles',  (req, res) => {
    res.json({
        roles: User.ROLES,
        roleHierarchy: User.ROLE_HIERARCHY
    });
});

app.post('/register', async (req, res) => {
    try{
        const { username, email, password } = req.body;

        if(!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = new User({ username, email, password });
        await user.save();
        const jwtToken = generateToken(user._id);

        res.status(201).json({
            message: "User registered successfully",
            user: user,
            token: jwtToken
        });

    } catch (error) {  
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if(!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email: email });
        if(!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const passwordMatch = await user.comparePassword(password);
        if(!passwordMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const jwtToken = generateToken(user._id);
        console.log(user.ROLES);
        return res.status(200).json({
            message: "Login successful",
            user: user,
            token: jwtToken
        });
    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ message: "Server error" });
    }
});


app.get('/products', optionalAuthenticate, async (req, res) => {
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

app.post("/products", authenticateUser, requirePermission('create_products'), async (req, res) => {
    try {
        console.log("Creating product with data:", req.body);
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

app.patch("/products/:id", authenticateUser, requireAnyRole([User.ROLES.VENDOR, User.ROLES.ADMIN]), async (req, res) => {
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

app.delete("/products/:id", authenticateUser, requiredRole(User.ROLES.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProduct = await Product.findByIdAndDelete(id);
        
        if(!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        res.status(200).json({
            message: "Product deleted successfully",
            product: deletedProduct
        });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.get("/users", authenticateUser, requirePermission('manage_users'), async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
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
