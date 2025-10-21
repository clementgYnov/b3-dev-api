const { AppError } = require("../utils/errors");
const User = require("../models/User");
const { generateToken } = require("../middlewares/authMiddleware");

const registerController = async (req, res, next) => {
  const { username, bio, email, password } = req.body;

  // check if user already exists (pseudo or email)
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });

  if (existingUser) {
    return next(new AppError("Utilisateur déjà existant", 409));
  }

  const user = new User({
    username,
    bio,
    email,
    password,
  });
  await user.save();

  const jwtToken = generateToken(user._id);

  res.status(201).json({
    message: "Utilisateur enregistré avec succès",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      createdAt: user.createdAt,
    },
    token: jwtToken,
  });
};

module.exports = { registerController };
