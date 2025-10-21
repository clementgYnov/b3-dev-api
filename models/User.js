const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const ROLES = {
    USER: 'user',
    VENDOR: 'vendor',
    ADMIN: 'admin'
};

const ROLE_HIERARCHY = {
    [ROLES.USER]: 1,
    [ROLES.VENDOR]: 2,
    [ROLES.ADMIN]: 3
}

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.USER
    }
}, { timestamps: true });

userSchema.pre('save', async function (next){
    if(!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password =  await bcrypt.hash(this.password, salt);
        next();
    }catch (error) {
        return next(error);
    }
})

userSchema.methods.comparePassword = async function(passwordFromUser) {
    return bcrypt.compare(passwordFromUser, this.password);
}

userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
}

userSchema.methods.hasRole = function(requiredRole) {
    const userLevel = ROLE_HIERARCHY[this.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
    return userLevel >= requiredLevel;
}

userSchema.methods.canPerform = function(action) {
    const rolePermissions = {
        'read_products': [ROLES.USER, ROLES.VENDOR, ROLES.ADMIN],
        'create_products': [ROLES.VENDOR, ROLES.ADMIN],
        'delete_products': [ROLES.ADMIN],
        'manage_users': [ROLES.ADMIN]
    };

    const permissions = rolePermissions[action] || [];
    return permissions.includes(this.role);
}

userSchema.statics.ROLES = ROLES;
userSchema.statics.ROLE_HIERARCHY = ROLE_HIERARCHY;



const User = mongoose.model('User', userSchema);
module.exports = User;