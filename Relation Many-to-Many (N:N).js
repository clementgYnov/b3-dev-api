// Relation Many-to-Many (N:N)
// Exemple : Collections contiennent plusieurs recettes

// models/Collection.js
const collectionSchema = new mongoose.Schema({
  name: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Tableau de références
  recipes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  }]
});

const Collection = mongoose.model('Collection', collectionSchema);

--------------------------
  utilisation
-----------------
  // Créer une collection avec plusieurs recettes
const collection = await Collection.create({
  name: "Mes recettes italiennes",
  userId: "456",
  recipes: ["recipe1_id", "recipe2_id", "recipe3_id"]
});

// Récupérer avec populate
const fullCollection = await Collection.findById(collectionId)
  .populate('userId')      // Populate l'utilisateur
  .populate('recipes');    // Populate toutes les recettes

// Résultat
console.log(fullCollection.recipes[0].title); // "Lasagne"
console.log(fullCollection.userId.username); // "Alice"

---------------------
  Populate Sélectif
------------------------
  // Ne récupérer que certains champs
const recipe = await Recipe.findById(recipeId)
  .populate('authorId', 'username avatar'); // Uniquement username et avatar

// Ou exclure certains champs
const recipe = await Recipe.findById(recipeId)
  .populate('authorId', '-password -email'); // Tout sauf password et email

-----------------------
  Populate Multiple Niveaux
---------------------
  // models/Comment.js
const commentSchema = new mongoose.Schema({
  content: String,
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Populate imbriqué
const comment = await Comment.findById(commentId)
  .populate({
    path: 'recipeId',
    populate: {
      path: 'authorId',  // Populate l'auteur de la recette
      select: 'username'
    }
  })
  .populate('userId', 'username'); // Populate l'auteur du commentaire

// Résultat
console.log(comment.recipeId.title); // "Lasagne"
console.log(comment.recipeId.authorId.username); // "Alice" (auteur recette)
console.log(comment.userId.username); // "Bob" (auteur commentaire)

----------------------
  Populate dans les Queries
--------------------------
  // GET toutes les recettes avec leurs auteurs
const recipes = await Recipe.find({ status: 'published' })
  .populate('authorId', 'username avatar role')
  .sort('-createdAt')
  .limit(10);

-------------------
  Exemple complet :
// controllers/games.controller.js
const getGameById = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('ownerId', 'username bio')      // Populate le propriétaire
      .populate('borrowedBy', 'username')       // Populate l'emprunteur
      .populate({
        path: 'reviews',                        // Virtual populate
        populate: {
          path: 'userId',
          select: 'username avatar'
        }
      });

    if (!game) {
      return res.status(404).json({ message: 'Jeu non trouvé' });
    }

    res.json({ success: true, game });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

  
