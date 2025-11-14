# GameShare API

API permettant aux gamers de gérer leur bibliothèque de jeux, de les prêter à des amis et d'y laisser des avis.

## Stack Technique

- Express.js
- MongoDB (Mongoose)
- JWT (jsonwebtoken)
- express-validator
- bcryptjs

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement dans le fichier `.env` :
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/gameshare
JWT_SECRET=your_jwt_secret_key_change_in_production
```

3. S'assurer que MongoDB est installé et en cours d'exécution

4. Démarrer le serveur :
```bash
# Mode développement avec nodemon
npm run dev

# Mode production
npm start
```

## Phase 1 - Authentification (Complétée)

### Endpoints Implémentés

#### POST /api/auth/register
Créer un nouveau compte utilisateur.

**Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "bio": "Gamer passionné"
}
```

**Réponse (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "username": "johndoe",
    "email": "john@example.com",
    "bio": "Gamer passionné",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Validations:**
- Username: minimum 3 caractères, unique
- Email: format valide, unique
- Password: minimum 6 caractères (hashé avec bcrypt)
- Bio: optionnel, maximum 500 caractères

#### POST /api/auth/login
Se connecter et obtenir un JWT.

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Réponse (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "username": "johndoe",
    "email": "john@example.com",
    "bio": "Gamer passionné",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/auth/me
Obtenir le profil de l'utilisateur connecté (route protégée).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Réponse (200):**
```json
{
  "user": {
    "id": "...",
    "username": "johndoe",
    "email": "john@example.com",
    "bio": "Gamer passionné",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Sécurité

- Mots de passe hashés avec bcrypt (10 rounds de salt)
- JWT avec expiration de 7 jours
- Middleware d'authentification vérifiant les tokens
- Validation des données avec express-validator
- Protection contre les doublons (email et username uniques)

## Phase 2 - CRUD Jeux (Complétée)

### Endpoints Implémentés

#### GET /api/games
Liste publique des jeux avec filtres optionnels.

**Query params (optionnels):**
- `platform`: filtrer par plateforme
- `genre`: filtrer par genre
- `status`: filtrer par statut (available/borrowed/playing)

**Exemple:** `GET /api/games?platform=PS5&status=available`

**Réponse (200):**
```json
{
  "count": 2,
  "games": [
    {
      "_id": "...",
      "title": "The Last of Us Part II",
      "platform": "PS5",
      "genre": "Action",
      "releaseYear": 2020,
      "status": "available",
      "ownerId": {
        "_id": "...",
        "username": "johndoe",
        "email": "john@example.com"
      },
      "borrowedBy": null,
      "borrowedAt": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /api/games/:id
Détails d'un jeu avec informations du propriétaire.

**Réponse (200):**
```json
{
  "game": {
    "_id": "...",
    "title": "The Last of Us Part II",
    "platform": "PS5",
    "genre": "Action",
    "releaseYear": 2020,
    "status": "available",
    "ownerId": {
      "_id": "...",
      "username": "johndoe",
      "email": "john@example.com",
      "bio": "Gamer passionné"
    },
    "borrowedBy": null,
    "borrowedAt": null
  }
}
```

#### POST /api/games
Créer un nouveau jeu (authentification requise).

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "title": "The Last of Us Part II",
  "platform": "PS5",
  "genre": "Action",
  "releaseYear": 2020,
  "status": "available"
}
```

**Validations:**
- title: requis
- platform: requis
- genre: requis
- releaseYear: requis, entre 1970 et année actuelle + 2
- status: optionnel (available/borrowed/playing), défaut: available

**Réponse (201):**
```json
{
  "message": "Game created successfully",
  "game": { ... }
}
```

#### PUT /api/games/:id
Modifier un jeu (authentification + ownership requis).

**Headers:**
```
Authorization: Bearer <token>
```

**Body (tous les champs optionnels):**
```json
{
  "title": "The Last of Us Part II Remastered",
  "status": "playing"
}
```

**Réponse (200):**
```json
{
  "message": "Game updated successfully",
  "game": { ... }
}
```

**Erreurs:**
- 403: Si l'utilisateur n'est pas le propriétaire du jeu
- 404: Si le jeu n'existe pas

#### DELETE /api/games/:id
Supprimer un jeu (authentification + ownership requis).

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
{
  "message": "Game deleted successfully"
}
```

**Erreurs:**
- 403: Si l'utilisateur n'est pas le propriétaire du jeu
- 404: Si le jeu n'existe pas

### Middlewares

**authenticate**: Vérifie le token JWT (requis pour POST, PUT, DELETE)

**checkOwnership**: Vérifie que l'utilisateur connecté est le propriétaire du jeu (requis pour PUT, DELETE)

## Phase 3 - Système de prêt (Complétée)

### Endpoints Implémentés

#### POST /api/games/:id/borrow
Emprunter un jeu disponible (authentification requise).

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
{
  "message": "Game borrowed successfully",
  "game": {
    "_id": "...",
    "title": "The Last of Us Part II",
    "status": "borrowed",
    "borrowedBy": {
      "_id": "...",
      "username": "johndoe",
      "email": "john@example.com"
    },
    "borrowedAt": "2024-01-15T10:30:00.000Z",
    ...
  }
}
```

**Règles de validation:**
- Le jeu doit exister (404 si introuvable)
- Le jeu doit être disponible (400 si déjà emprunté ou en cours de jeu)
- L'utilisateur ne peut pas emprunter son propre jeu (400)
- Authentification requise (401 si pas de token)

**Comportement:**
- Change le statut du jeu à "borrowed"
- Enregistre l'emprunteur dans `borrowedBy`
- Enregistre la date d'emprunt dans `borrowedAt`

#### POST /api/games/:id/return
Retourner un jeu emprunté (authentification requise).

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
{
  "message": "Game returned successfully",
  "game": {
    "_id": "...",
    "title": "The Last of Us Part II",
    "status": "available",
    "borrowedBy": null,
    "borrowedAt": null,
    ...
  }
}
```

**Règles de validation:**
- Le jeu doit exister (404 si introuvable)
- Le jeu doit être emprunté (400 si status != borrowed)
- Seuls le propriétaire ou l'emprunteur peuvent retourner le jeu (403 sinon)
- Authentification requise (401 si pas de token)

**Comportement:**
- Change le statut du jeu à "available"
- Supprime l'emprunteur (`borrowedBy` = null)
- Supprime la date d'emprunt (`borrowedAt` = null)

#### GET /api/users/:id/borrowed
Lister tous les jeux empruntés par un utilisateur (route publique).

**Réponse (200):**
```json
{
  "count": 2,
  "games": [
    {
      "_id": "...",
      "title": "The Last of Us Part II",
      "status": "borrowed",
      "ownerId": {
        "_id": "...",
        "username": "owner",
        "email": "owner@example.com"
      },
      "borrowedBy": {
        "_id": "...",
        "username": "johndoe",
        "email": "john@example.com"
      },
      "borrowedAt": "2024-01-15T10:30:00.000Z",
      ...
    }
  ]
}
```

### Logique métier

- Un utilisateur ne peut pas emprunter son propre jeu
- Le statut du jeu est automatiquement mis à jour lors des emprunts/retours
- Les propriétaires peuvent récupérer leurs jeux même si ce n'est pas eux qui les ont empruntés
- Les jeux sont triés par date d'emprunt (plus récent en premier)

### Structure du Projet

```
correction_gameshare/
├── src/
│   ├── config/
│   │   └── db.js                 # Configuration MongoDB
│   ├── middleware/
│   │   ├── authenticate.js       # Middleware JWT
│   │   └── checkOwnership.js     # Vérification propriété
│   ├── models/
│   │   ├── User.js              # Modèle User
│   │   ├── Game.js              # Modèle Game
│   │   └── Review.js            # Modèle Review
│   ├── routes/
│   │   ├── auth.js              # Routes authentification
│   │   ├── games.js             # Routes jeux + prêt
│   │   ├── users.js             # Routes utilisateurs
│   │   └── reviews.js           # Routes avis
│   ├── validators/
│   │   ├── authValidators.js    # Validateurs auth
│   │   ├── gameValidators.js    # Validateurs jeux
│   │   └── reviewValidators.js  # Validateurs avis
│   └── server.js                # Point d'entrée
├── .env
├── .gitignore
├── package.json
├── test.js
└── README.md
```

## Tests Automatisés

Un fichier `test.js` est fourni pour tester automatiquement toutes les routes implémentées.

### Utilisation

1. S'assurer que le serveur est démarré :
```bash
npm run dev
```

2. Dans un autre terminal, lancer les tests :
```bash
npm test
```

### Ce qui est testé

Le script `test.js` exécute automatiquement 52 tests couvrant :

**Phase 1 - Authentification (7 tests):**
- Création de deux utilisateurs
- Vérification des doublons (email/username)
- Connexion avec bonnes et mauvaises credentials
- Accès au profil avec et sans token
- Gestion des erreurs 401

**Phase 2 - CRUD Jeux (17 tests):**
- Création de jeux par différents utilisateurs
- Listing de tous les jeux
- Filtres (platform, genre, status)
- Récupération des détails d'un jeu
- Modification d'un jeu (avec vérification ownership)
- Suppression d'un jeu (avec vérification ownership)
- Tests d'erreurs 401 (sans token) et 403 (pas le propriétaire)

**Phase 3 - Système de prêt (11 tests):**
- Emprunt d'un jeu disponible
- Emprunt d'un jeu déjà emprunté (devrait échouer)
- Emprunt de son propre jeu (devrait échouer)
- Emprunt sans token (devrait échouer)
- Emprunt d'un jeu inexistant (devrait échouer)
- Retour d'un jeu par l'emprunteur
- Retour d'un jeu par le propriétaire
- Retour d'un jeu non emprunté (devrait échouer)
- Retour sans autorisation (devrait échouer)
- Liste des jeux empruntés par un utilisateur
- Liste vide pour un utilisateur sans emprunt

**Phase 4 - Avis (14 tests):**
- Création d'un avis pour un jeu
- Création de plusieurs avis par différents utilisateurs
- Tentative de créer un avis en double (devrait échouer)
- Création d'un avis sans token (devrait échouer)
- Création d'un avis avec rating invalide (devrait échouer)
- Création d'un avis pour un jeu inexistant (devrait échouer)
- Listing des avis d'un jeu avec calcul de la moyenne
- Listing des avis d'un jeu sans avis
- Modification de son propre avis
- Modification de l'avis de quelqu'un d'autre (devrait échouer)
- Modification d'un avis sans token (devrait échouer)
- Suppression de l'avis de quelqu'un d'autre (devrait échouer)
- Suppression de son propre avis
- Suppression d'un avis sans token (devrait échouer)

Les tests utilisent des codes couleur pour faciliter la lecture :
- ✓ en vert = test réussi
- ✗ en rouge = test échoué

## Tests avec Postman

### Phase 1 - Auth
1. Créer un compte : `POST http://localhost:3000/api/auth/register`
2. Se connecter : `POST http://localhost:3000/api/auth/login`
3. Copier le token reçu
4. Tester le profil : `GET http://localhost:3000/api/auth/me` avec le header `Authorization: Bearer <token>`

### Phase 2 - Jeux
1. Créer un jeu : `POST http://localhost:3000/api/games` avec le token
2. Lister les jeux : `GET http://localhost:3000/api/games`
3. Filtrer les jeux : `GET http://localhost:3000/api/games?platform=PS5&status=available`
4. Voir un jeu : `GET http://localhost:3000/api/games/:id`
5. Modifier un jeu : `PUT http://localhost:3000/api/games/:id` avec le token (ownership requis)
6. Supprimer un jeu : `DELETE http://localhost:3000/api/games/:id` avec le token (ownership requis)

### Phase 3 - Système de prêt
1. Emprunter un jeu : `POST http://localhost:3000/api/games/:id/borrow` avec le token
2. Retourner un jeu : `POST http://localhost:3000/api/games/:id/return` avec le token
3. Lister les jeux empruntés d'un utilisateur : `GET http://localhost:3000/api/users/:id/borrowed`

### Phase 4 - Avis
1. Créer un avis : `POST http://localhost:3000/api/games/:gameId/reviews` avec le token
2. Lister les avis d'un jeu : `GET http://localhost:3000/api/games/:gameId/reviews`
3. Modifier son avis : `PUT http://localhost:3000/api/reviews/:id` avec le token
4. Supprimer son avis : `DELETE http://localhost:3000/api/reviews/:id` avec le token

## Phase 4 - Système d'avis (Complétée)

### Endpoints Implémentés

#### POST /api/games/:gameId/reviews
Créer un avis pour un jeu (authentification requise).

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "rating": 5,
  "comment": "Excellent jeu ! Une expérience inoubliable."
}
```

**Validations:**
- rating: requis, entre 1 et 5
- comment: requis, maximum 1000 caractères
- Un utilisateur ne peut laisser qu'un seul avis par jeu

**Réponse (201):**
```json
{
  "message": "Review created successfully",
  "review": {
    "_id": "...",
    "gameId": "...",
    "userId": {
      "_id": "...",
      "username": "johndoe",
      "email": "john@example.com"
    },
    "rating": 5,
    "comment": "Excellent jeu ! Une expérience inoubliable.",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Erreurs:**
- 400: Si l'utilisateur a déjà laissé un avis pour ce jeu
- 401: Si pas de token
- 404: Si le jeu n'existe pas

#### GET /api/games/:gameId/reviews
Lister tous les avis d'un jeu avec la moyenne des ratings (route publique).

**Réponse (200):**
```json
{
  "count": 2,
  "averageRating": 4.5,
  "reviews": [
    {
      "_id": "...",
      "gameId": "...",
      "userId": {
        "_id": "...",
        "username": "johndoe",
        "email": "john@example.com"
      },
      "rating": 5,
      "comment": "Excellent jeu !",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "...",
      "gameId": "...",
      "userId": {
        "_id": "...",
        "username": "janedoe",
        "email": "jane@example.com"
      },
      "rating": 4,
      "comment": "Très bon jeu.",
      "createdAt": "2024-01-14T09:20:00.000Z"
    }
  ]
}
```

**Erreurs:**
- 404: Si le jeu n'existe pas

#### PUT /api/reviews/:id
Modifier son propre avis (authentification requise).

**Headers:**
```
Authorization: Bearer <token>
```

**Body (tous les champs optionnels):**
```json
{
  "rating": 4,
  "comment": "Après réflexion, 4 étoiles c'est plus juste."
}
```

**Réponse (200):**
```json
{
  "message": "Review updated successfully",
  "review": { ... }
}
```

**Erreurs:**
- 403: Si l'utilisateur n'est pas l'auteur de l'avis
- 404: Si l'avis n'existe pas

#### DELETE /api/reviews/:id
Supprimer son propre avis (authentification requise).

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
{
  "message": "Review deleted successfully"
}
```

**Erreurs:**
- 403: Si l'utilisateur n'est pas l'auteur de l'avis
- 404: Si l'avis n'existe pas

### Logique métier

- Un utilisateur ne peut laisser qu'un seul avis par jeu (contrainte unique en base)
- Seul l'auteur d'un avis peut le modifier ou le supprimer
- La moyenne des ratings est calculée automatiquement lors de la récupération des avis
- Les avis sont triés par date de création (plus récent en premier)
