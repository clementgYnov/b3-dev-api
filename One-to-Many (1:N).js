// relation  One-to-Many (1:N).
//  Exemple : Un auteur a plusieurs recettes


// models/User.js
const userSchema = new mongoose.Schema({
  username: String,
  email: String
  // Pas besoin de stocker les recettes ici
});

const User = mongoose.model('User', userSchema);

// models/Recipe.js
const recipeSchema = new mongoose.Schema({
  title: String,
  description: String,
  // Référence vers User
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Nom du modèle référencé
    required: true
  },
  createdAt: { type: Date, default: Date.now }
});

const Recipe = mongoose.model('Recipe', recipeSchema);


------------------------------------------
populate
-----------------------------------------
  // Récupérer une recette avec les infos de l'auteur
const recipe = await Recipe.findById(recipeId)
  .populate('authorId'); // Remplace l'ObjectId par le document User complet

console.log(recipe.authorId.username); // Accès direct au nom de l'auteur

------------------------------------------
resultat
-----------------------------------------
{
  _id: "123",
  title: "Lasagne",
  authorId: {  // Populated !
    _id: "456",
    username: "Alice",
    email: "alice@example.com"
  }
}


