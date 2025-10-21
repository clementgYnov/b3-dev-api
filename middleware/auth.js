const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = "your_jwt_secret_key";

const generateToken = (userId) => {
    return jwt.sign(
        { userId: userId },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
};

const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Authorization header missing or malformed" });
        } 
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if(!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
        next();
    }catch (error) {
        if(error.name == "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        }

        if(error.name == "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        }
        console.error("Authentication error:", error);
        res.status(500).json({ message: "Erreur lors de la vérification du token" });
    }
};

const requiredRole = (requiredRole) => {
    return (req, res, next) => {
        if(!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        if(!req.user.hasRole(requiredRole)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        next();
    };
}; 

const requestAnyRole = (allowedRoles) => {
    return (req, res, next) => {
        if(!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        if(!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        next();
    };
};

const requirePermission = (action) => {
    return (req, res, next) => {
        if(!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        if(!req.user.canPerform(action)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        next();
    };
}

const optionalAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.userId);
            if(user) {
                req.user = user;
            }
        }
        next();
    }catch (error) {
        console.error("Optional authentication error:", error);
        next();
    }
};

module.exports = {
    generateToken,
    authenticateUser,
    requiredRole,
    requestAnyRole,
    requirePermission,
    optionalAuthenticate
};
