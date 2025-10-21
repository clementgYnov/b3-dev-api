const mongoose = require('mongoose');
const Product = require('./models/Product');

const mongoUrl = "mongodb+srv://clementgrosieux93_db_user:khTKnXuyRQ2yV8jD@cluster0.qd0lxci.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const numberProductsToCreate = 50;

mongoose.connect(mongoUrl, {})
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });

const createProduct = (faker) => {
    const product = {
        name: faker.commerce.productName(),
        price: faker.commerce.price(),
        description: faker.commerce.productDescription(),
        image: faker.image.url(),
    };

    return product;
};

const seedProducts = async () => {
    try {
        const { faker } = await import('@faker-js/faker');
        
        await Product.deleteMany({});
        console.log("Existing products deleted");

        const products = [];
        for (let i = 0; i < numberProductsToCreate; i++) {
            products.push(createProduct(faker));
        }
        
        await Product.insertMany(products);
        console.log(`${numberProductsToCreate} products created`);
    } catch (error) {
        console.error("Error seeding products:", error);
    } finally {
        mongoose.connection.close();
    }
};
seedProducts();


