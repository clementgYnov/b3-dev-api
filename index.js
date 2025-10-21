const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const rfs = require('rotating-file-stream');
const path = require('path');
const app = express();

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

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
const swaggerJSDoc = require('swagger-jsdoc');



const mongoUrl = "mongodb+srv://clementgrosieux93_db_user:khTKnXuyRQ2yV8jD@cluster0.qd0lxci.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoUrl, {})
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });

// USE SWAGGER WITH OPTIONS

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Product and User Management API',
            version: '1.0.0',
            description: 'API for managing products and users with authentication and authorization'
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: ['./index.js']
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

const accessLogStream = rfs.createStream('access.log', {
    interval: '1d', // rotate every 20 seconds
    size: '1MB', // rotate every 1MB
    path: path.join(__dirname, 'logs'),
});


app.use(morgan('combined', { stream: accessLogStream }));

morgan.token('action', (req) => (req.action ? req.action : 'Guest'));
morgan.token('user-email', (req) => (req.user ? req.user.email : 'Guest'));
app.use(morgan(':action :user-email :response-time ms'));

const userActionsStream = rfs.createStream('access.log', {
    interval: '1d', // rotate every 20 seconds
    size: '1MB', // rotate every 1MB
    path: path.join(__dirname, 'logs/user-actions'),
});

const userActionLogger = morgan((tokens, req, res) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    userId: req.user?.id || 'anonymous',
    action: req.actionType || 'unknown',
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: parseInt(tokens.status(req, res), 10),
    ip: tokens['remote-addr'](req, res),
    userAgent: tokens['user-agent'](req, res),
    responseTime: tokens['response-time'](req, res)
  });
}, { stream: userActionsStream });

app.use(userActionLogger);

app.use(express.json());


let posts = [
    {id: 1, title: "Mon premier post", like: 0},
    {id: 2, title: "Mon deuxième post", like: 0},
    {id: 3, title: "Mon troisième post", like: 0},
];

app.use((req, res, next) => {
    next();
})


app.get('/roles',  (req, res) => {
    res.json({
        roles: User.ROLES,
        roleHierarchy: User.ROLE_HIERARCHY
    });
});

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with username, email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                 token:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login to the system
 *     description: Authenticate a user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid email or password
 *       500:
 *         description: Server error
 */
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


/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     description: Retrieve a list of all products. Authentication is optional.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     responses:
 *       200:
 *         description: List of products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   price:
 *                     type: number
 *       500:
 *         description: Server error
 */
app.get('/products', optionalAuthenticate, async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @swagger
 * /productspage:
 *   get:
 *     summary: Get paginated products
 *     description: Retrieve a paginated list of products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Paginated list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     description: Create a new product. Requires authentication and create_products permission.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: Laptop
 *               price:
 *                 type: number
 *                 example: 999.99
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 product:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Update a product
 *     description: Update product information. Requires authentication and VENDOR or ADMIN role.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Laptop
 *               price:
 *                 type: number
 *                 example: 899.99
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 product:
 *                   type: object
 *       400:
 *         description: Name or price required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     description: Delete a product by ID. Requires authentication and ADMIN role.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 product:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ADMIN role required
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users. Requires authentication and manage_users permission.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Server error
 */
app.get("/users", authenticateUser, requirePermission('manage_users'), async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @swagger
 * /posts/{id}/like:
 *   post:
 *     summary: Like a post
 *     description: Increment the like count of a specific post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post liked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 post:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     like:
 *                       type: integer
 *       404:
 *         description: Post not found
 */
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
  console.log(`API documentation available at http://localhost:3000/api-docs`);
});
