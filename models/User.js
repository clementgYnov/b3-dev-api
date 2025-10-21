const mongoose = require('mongoose');

//username, email, password (hashé), bio, createdAt 
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String, default: '' },
}, { timestamps: { createdAt: 'createdAt' } });

userSchema.pre('save', function(next) {
    if(this.isModified('password')) {
        // Hash the password before saving
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        bcrypt.hash(this.password, saltRounds, (err, hash) => {
            if(err) return next(err);
            this.password = hash;
            next();
        });
    } else {
        next();
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;