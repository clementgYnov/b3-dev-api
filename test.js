const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Configuration de base
const BASE_URL = 'http://localhost:3000';
const api = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true, // Ne pas throw d'erreur pour les codes 4xx/5xx
});

// Codes couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m',
};

// Variables globales pour stocker les données
let user1Token = '';
let user2Token = '';
let user1Id = '';
let user2Id = '';
let game1Id = '';
let game2Id = '';

// Fonction pour afficher les résultats
function logTest(name, passed, details = '') {
  const icon = passed ? '✓' : '✗';
  const color = passed ? colors.green : colors.red;
  console.log(`${color}${icon} ${name}${colors.reset}${details ? colors.gray + ' - ' + details + colors.reset : ''}`);
}

function logSection(name) {
  console.log(`\n${colors.blue}═══ ${name} ═══${colors.reset}\n`);
}


// Tests de la Phase 1 - Authentification
async function testAuth() {
  logSection('PHASE 1 - AUTHENTIFICATION');

  // Test 1: Register user 1
  try {
    const res = await api.post('/api/auth/register', {
      username: 'testuser1',
      email: 'test1@example.com',
      password: 'password123',
      bio: 'Premier utilisateur de test',
    });
    const passed = res.status === 201 && res.data.token;
    logTest('POST /api/auth/register - User 1', passed, `Status: ${res.status}`);
    if (passed) {
      user1Token = res.data.token;
      user1Id = res.data.user.id;
    }
  } catch (error) {
    logTest('POST /api/auth/register - User 1', false, error.message);
  }

  // Test 2: Register user 2
  try {
    const res = await api.post('/api/auth/register', {
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'password456',
      bio: 'Deuxième utilisateur de test',
    });
    const passed = res.status === 201 && res.data.token;
    logTest('POST /api/auth/register - User 2', passed, `Status: ${res.status}`);
    if (passed) {
      user2Token = res.data.token;
      user2Id = res.data.user.id;
    }
  } catch (error) {
    logTest('POST /api/auth/register - User 2', false, error.message);
  }

  // Test 3: Register avec email dupliqué
  try {
    const res = await api.post('/api/auth/register', {
      username: 'testuser3',
      email: 'test1@example.com',
      password: 'password123',
    });
    const passed = res.status === 400;
    logTest('POST /api/auth/register - Email dupliqué (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('POST /api/auth/register - Email dupliqué', false, error.message);
  }

  // Test 4: Login user 1
  try {
    const res = await api.post('/api/auth/login', {
      email: 'test1@example.com',
      password: 'password123',
    });
    const passed = res.status === 200 && res.data.token;
    logTest('POST /api/auth/login - User 1', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('POST /api/auth/login - User 1', false, error.message);
  }

  // Test 5: Login avec mauvais password
  try {
    const res = await api.post('/api/auth/login', {
      email: 'test1@example.com',
      password: 'wrongpassword',
    });
    const passed = res.status === 401;
    logTest('POST /api/auth/login - Mauvais password (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('POST /api/auth/login - Mauvais password', false, error.message);
  }

  // Test 6: GET /api/auth/me avec token
  try {
    const res = await api.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const passed = res.status === 200 && res.data.user.username === 'testuser1';
    logTest('GET /api/auth/me - Avec token', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('GET /api/auth/me - Avec token', false, error.message);
  }

  // Test 7: GET /api/auth/me sans token
  try {
    const res = await api.get('/api/auth/me');
    const passed = res.status === 401;
    logTest('GET /api/auth/me - Sans token (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('GET /api/auth/me - Sans token', false, error.message);
  }
}

// Tests de la Phase 2 - CRUD Jeux
async function testGames() {
  logSection('PHASE 2 - CRUD JEUX');

  // Test 1: Créer un jeu (user 1)
  try {
    const res = await api.post(
      '/api/games',
      {
        title: 'The Last of Us Part II',
        platform: 'PS5',
        genre: 'Action',
        releaseYear: 2020,
        status: 'available',
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );
    const passed = res.status === 201 && res.data.game;
    logTest('POST /api/games - Créer jeu 1 (User 1)', passed, `Status: ${res.status}`);
    if (passed) {
      game1Id = res.data.game._id;
    }
  } catch (error) {
    logTest('POST /api/games - Créer jeu 1', false, error.message);
  }

  // Test 2: Créer un jeu (user 2)
  try {
    const res = await api.post(
      '/api/games',
      {
        title: 'God of War Ragnarök',
        platform: 'PS5',
        genre: 'Action',
        releaseYear: 2022,
        status: 'playing',
      },
      {
        headers: { Authorization: `Bearer ${user2Token}` },
      }
    );
    const passed = res.status === 201 && res.data.game;
    logTest('POST /api/games - Créer jeu 2 (User 2)', passed, `Status: ${res.status}`);
    if (passed) {
      game2Id = res.data.game._id;
    }
  } catch (error) {
    logTest('POST /api/games - Créer jeu 2', false, error.message);
  }

  // Test 3: Créer un jeu (user 1) - Xbox
  try {
    const res = await api.post(
      '/api/games',
      {
        title: 'Halo Infinite',
        platform: 'Xbox',
        genre: 'FPS',
        releaseYear: 2021,
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );
    const passed = res.status === 201;
    logTest('POST /api/games - Créer jeu 3 (User 1)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('POST /api/games - Créer jeu 3', false, error.message);
  }

  // Test 4: Créer un jeu sans token
  try {
    const res = await api.post('/api/games', {
      title: 'Test Game',
      platform: 'PC',
      genre: 'RPG',
      releaseYear: 2023,
    });
    const passed = res.status === 401;
    logTest('POST /api/games - Sans token (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('POST /api/games - Sans token', false, error.message);
  }

  // Test 5: Créer un jeu avec données invalides
  try {
    const res = await api.post(
      '/api/games',
      {
        title: 'Test Game',
        platform: 'PC',
        // genre manquant
        releaseYear: 2023,
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );
    const passed = res.status === 400;
    logTest('POST /api/games - Données invalides (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('POST /api/games - Données invalides', false, error.message);
  }

  // Test 6: Lister tous les jeux
  try {
    const res = await api.get('/api/games');
    const passed = res.status === 200 && res.data.games && res.data.games.length >= 3;
    logTest('GET /api/games - Lister tous les jeux', passed, `Status: ${res.status}, Count: ${res.data.games?.length || 0}`);
  } catch (error) {
    logTest('GET /api/games - Lister tous', false, error.message);
  }

  // Test 7: Filtrer par platform
  try {
    const res = await api.get('/api/games?platform=PS5');
    const passed = res.status === 200 && res.data.games.every((g) => g.platform === 'PS5');
    logTest('GET /api/games?platform=PS5 - Filtrer par plateforme', passed, `Status: ${res.status}, Count: ${res.data.games?.length || 0}`);
  } catch (error) {
    logTest('GET /api/games?platform=PS5', false, error.message);
  }

  // Test 8: Filtrer par status
  try {
    const res = await api.get('/api/games?status=available');
    const passed = res.status === 200 && res.data.games.every((g) => g.status === 'available');
    logTest('GET /api/games?status=available - Filtrer par statut', passed, `Status: ${res.status}, Count: ${res.data.games?.length || 0}`);
  } catch (error) {
    logTest('GET /api/games?status=available', false, error.message);
  }

  // Test 9: Filtrer par genre
  try {
    const res = await api.get('/api/games?genre=Action');
    const passed = res.status === 200 && res.data.games.every((g) => g.genre === 'Action');
    logTest('GET /api/games?genre=Action - Filtrer par genre', passed, `Status: ${res.status}, Count: ${res.data.games?.length || 0}`);
  } catch (error) {
    logTest('GET /api/games?genre=Action', false, error.message);
  }

  // Test 10: Obtenir détails d'un jeu
  try {
    const res = await api.get(`/api/games/${game1Id}`);
    const passed = res.status === 200 && res.data.game && res.data.game.ownerId.username === 'testuser1';
    logTest('GET /api/games/:id - Détails du jeu', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('GET /api/games/:id - Détails', false, error.message);
  }

  // Test 11: Obtenir jeu inexistant
  try {
    const res = await api.get('/api/games/000000000000000000000000');
    const passed = res.status === 404;
    logTest('GET /api/games/:id - Jeu inexistant (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('GET /api/games/:id - Inexistant', false, error.message);
  }

  // Test 12: Modifier son propre jeu
  try {
    const res = await api.put(
      `/api/games/${game1Id}`,
      {
        title: 'The Last of Us Part II - Remastered',
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );
    const passed = res.status === 200 && res.data.game.title.includes('Remastered');
    logTest('PUT /api/games/:id - Modifier son propre jeu', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('PUT /api/games/:id - Modifier', false, error.message);
  }

  // Test 13: Modifier le jeu de quelqu'un d'autre
  try {
    const res = await api.put(
      `/api/games/${game1Id}`,
      {
        title: 'Hack attempt',
      },
      {
        headers: { Authorization: `Bearer ${user2Token}` },
      }
    );
    const passed = res.status === 403;
    logTest('PUT /api/games/:id - Modifier jeu d\'autrui (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('PUT /api/games/:id - Jeu d\'autrui', false, error.message);
  }

  // Test 14: Modifier sans token
  try {
    const res = await api.put(`/api/games/${game1Id}`, {
      title: 'Hack attempt',
    });
    const passed = res.status === 401;
    logTest('PUT /api/games/:id - Sans token (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('PUT /api/games/:id - Sans token', false, error.message);
  }

  // Test 15: Supprimer le jeu de quelqu'un d'autre
  try {
    const res = await api.delete(`/api/games/${game1Id}`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    const passed = res.status === 403;
    logTest('DELETE /api/games/:id - Supprimer jeu d\'autrui (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('DELETE /api/games/:id - Jeu d\'autrui', false, error.message);
  }

  // Test 16: Supprimer son propre jeu
  try {
    const res = await api.delete(`/api/games/${game2Id}`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    const passed = res.status === 200;
    logTest('DELETE /api/games/:id - Supprimer son propre jeu', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('DELETE /api/games/:id - Supprimer', false, error.message);
  }

  // Test 17: Supprimer sans token
  try {
    const res = await api.delete(`/api/games/${game1Id}`);
    const passed = res.status === 401;
    logTest('DELETE /api/games/:id - Sans token (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('DELETE /api/games/:id - Sans token', false, error.message);
  }
}

// Tests de la Phase 3 - Système de prêt
async function testBorrow() {
  logSection('PHASE 3 - SYSTÈME DE PRÊT');

  // Test 1: Emprunter un jeu disponible
  try {
    const res = await api.post(
      `/api/games/${game1Id}/borrow`,
      {},
      {
        headers: { Authorization: `Bearer ${user2Token}` },
      }
    );
    const passed = res.status === 200 && res.data.game.status === 'borrowed';
    logTest('POST /api/games/:id/borrow - Emprunter jeu disponible', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('POST /api/games/:id/borrow - Emprunter', false, error.message);
  }

  // Test 2: Emprunter un jeu déjà emprunté
  try {
    const res = await api.post(
      `/api/games/${game1Id}/borrow`,
      {},
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );
    const passed = res.status === 400;
    logTest('POST /api/games/:id/borrow - Jeu déjà emprunté (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('POST /api/games/:id/borrow - Déjà emprunté', false, error.message);
  }

  // Test 3: Emprunter son propre jeu
  // D'abord créer un nouveau jeu pour user1
  let testGameId = '';
  try {
    const createRes = await api.post(
      '/api/games',
      {
        title: 'Test Borrow Own Game',
        platform: 'PC',
        genre: 'Test',
        releaseYear: 2023,
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );
    if (createRes.status === 201) {
      testGameId = createRes.data.game._id;

      const res = await api.post(
        `/api/games/${testGameId}/borrow`,
        {},
        {
          headers: { Authorization: `Bearer ${user1Token}` },
        }
      );
      const passed = res.status === 400;
      logTest('POST /api/games/:id/borrow - Emprunter son propre jeu (devrait échouer)', passed, `Status: ${res.status}`);
    }
  } catch (error) {
    logTest('POST /api/games/:id/borrow - Propre jeu', false, error.message);
  }

  // Test 4: Emprunter sans token
  try {
    const res = await api.post(`/api/games/${testGameId}/borrow`, {});
    const passed = res.status === 401;
    logTest('POST /api/games/:id/borrow - Sans token (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('POST /api/games/:id/borrow - Sans token', false, error.message);
  }

  // Test 5: Emprunter jeu inexistant
  try {
    const res = await api.post(
      '/api/games/000000000000000000000000/borrow',
      {},
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );
    const passed = res.status === 404;
    logTest('POST /api/games/:id/borrow - Jeu inexistant (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('POST /api/games/:id/borrow - Inexistant', false, error.message);
  }

  // Test 6: Retourner un jeu (emprunteur)
  try {
    const res = await api.post(
      `/api/games/${game1Id}/return`,
      {},
      {
        headers: { Authorization: `Bearer ${user2Token}` },
      }
    );
    const passed = res.status === 200 && res.data.game.status === 'available';
    logTest('POST /api/games/:id/return - Retourner jeu (emprunteur)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('POST /api/games/:id/return - Retourner', false, error.message);
  }

  // Test 7: Retourner un jeu non emprunté
  try {
    const res = await api.post(
      `/api/games/${game1Id}/return`,
      {},
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );
    const passed = res.status === 400;
    logTest('POST /api/games/:id/return - Jeu non emprunté (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('POST /api/games/:id/return - Non emprunté', false, error.message);
  }

  // Test 8: Emprunter puis retourner (propriétaire qui retourne)
  try {
    // User2 emprunte
    await api.post(
      `/api/games/${game1Id}/borrow`,
      {},
      {
        headers: { Authorization: `Bearer ${user2Token}` },
      }
    );

    // User1 (propriétaire) retourne
    const res = await api.post(
      `/api/games/${game1Id}/return`,
      {},
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );
    const passed = res.status === 200 && res.data.game.status === 'available';
    logTest('POST /api/games/:id/return - Retourner jeu (propriétaire)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('POST /api/games/:id/return - Propriétaire', false, error.message);
  }

  // Test 9: Retourner sans autorisation (ni propriétaire ni emprunteur)
  try {
    // User1 emprunte le jeu de testGameId (qui appartient aussi à user1, donc ce test ne marche pas)
    // On va créer un nouveau jeu pour user2
    const createRes = await api.post(
      '/api/games',
      {
        title: 'Test Return Unauthorized',
        platform: 'PC',
        genre: 'Test',
        releaseYear: 2023,
      },
      {
        headers: { Authorization: `Bearer ${user2Token}` },
      }
    );

    if (createRes.status === 201) {
      const gameId = createRes.data.game._id;

      // User1 emprunte
      await api.post(
        `/api/games/${gameId}/borrow`,
        {},
        {
          headers: { Authorization: `Bearer ${user1Token}` },
        }
      );

      // User1 retourne (emprunteur - devrait passer)
      // Pour ce test, il faudrait un 3ème utilisateur qui tente de retourner
      // On va juste créer un utilisateur temporaire
      const user3Res = await api.post('/api/auth/register', {
        username: 'testuser3',
        email: 'test3@example.com',
        password: 'password789',
      });

      if (user3Res.status === 201) {
        const user3Token = user3Res.data.token;

        const res = await api.post(
          `/api/games/${gameId}/return`,
          {},
          {
            headers: { Authorization: `Bearer ${user3Token}` },
          }
        );
        const passed = res.status === 403;
        logTest('POST /api/games/:id/return - Sans autorisation (devrait échouer)', passed, `Status: ${res.status}`);

        // Nettoyer : retourner le jeu emprunté par user1 pour ne pas fausser les tests suivants
        await api.post(
          `/api/games/${gameId}/return`,
          {},
          {
            headers: { Authorization: `Bearer ${user1Token}` },
          }
        );
      }
    }
  } catch (error) {
    logTest('POST /api/games/:id/return - Sans autorisation', false, error.message);
  }

  // Test 10: Lister les jeux empruntés par un utilisateur
  try {
    // D'abord, user2 emprunte un jeu
    await api.post(
      `/api/games/${game1Id}/borrow`,
      {},
      {
        headers: { Authorization: `Bearer ${user2Token}` },
      }
    );

    const res = await api.get(`/api/users/${user2Id}/borrowed`);
    const passed = res.status === 200 && res.data.games && res.data.games.length > 0;
    logTest('GET /api/users/:id/borrowed - Lister jeux empruntés', passed, `Status: ${res.status}, Count: ${res.data.games?.length || 0}`);
  } catch (error) {
    logTest('GET /api/users/:id/borrowed', false, error.message);
  }

  // Test 11: Lister les jeux empruntés (utilisateur sans emprunt)
  try {
    const res = await api.get(`/api/users/${user1Id}/borrowed`);
    const passed = res.status === 200 && res.data.games.length === 0;
    logTest('GET /api/users/:id/borrowed - Utilisateur sans emprunt', passed, `Status: ${res.status}, Count: ${res.data.games?.length || 0}`);
  } catch (error) {
    logTest('GET /api/users/:id/borrowed - Sans emprunt', false, error.message);
  }
}

// Tests de la Phase 4 - Avis
async function testReviews() {
  logSection('PHASE 4 - AVIS');

  let review1Id = '';
  let review2Id = '';

  // Test 1: Créer un avis pour un jeu
  try {
    const res = await api.post(
      `/api/games/${game1Id}/reviews`,
      {
        rating: 5,
        comment: 'Excellent jeu ! Une expérience inoubliable.',
      },
      {
        headers: { Authorization: `Bearer ${user2Token}` },
      }
    );
    const passed = res.status === 201 && res.data.review;
    logTest('POST /api/games/:gameId/reviews - Créer un avis', passed, `Status: ${res.status}`);
    if (passed) {
      review1Id = res.data.review._id;
    }
  } catch (error) {
    logTest('POST /api/games/:gameId/reviews - Créer avis', false, error.message);
  }

  // Test 2: Créer un second avis (user1 pour game1)
  try {
    const res = await api.post(
      `/api/games/${game1Id}/reviews`,
      {
        rating: 4,
        comment: 'Très bon jeu, mais quelques bugs.',
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );
    const passed = res.status === 201;
    logTest('POST /api/games/:gameId/reviews - Créer second avis', passed, `Status: ${res.status}`);
    if (passed) {
      review2Id = res.data.review._id;
    }
  } catch (error) {
    logTest('POST /api/games/:gameId/reviews - Second avis', false, error.message);
  }

  // Test 3: Tenter de créer un avis en double
  try {
    const res = await api.post(
      `/api/games/${game1Id}/reviews`,
      {
        rating: 3,
        comment: 'Tentative de doublon',
      },
      {
        headers: { Authorization: `Bearer ${user2Token}` },
      }
    );
    const passed = res.status === 400;
    logTest('POST /api/games/:gameId/reviews - Avis en double (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('POST /api/games/:gameId/reviews - Double', false, error.message);
  }

  // Test 4: Créer un avis sans token
  try {
    const res = await api.post(`/api/games/${game1Id}/reviews`, {
      rating: 5,
      comment: 'Test sans auth',
    });
    const passed = res.status === 401;
    logTest('POST /api/games/:gameId/reviews - Sans token (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('POST /api/games/:gameId/reviews - Sans token', false, error.message);
  }

  // Test 5: Créer un avis avec rating invalide
  try {
    // D'abord créer un nouveau jeu pour tester
    const gameRes = await api.post(
      '/api/games',
      {
        title: 'Test Review Game',
        platform: 'PC',
        genre: 'Test',
        releaseYear: 2023,
      },
      {
        headers: { Authorization: `Bearer ${user2Token}` },
      }
    );

    if (gameRes.status === 201) {
      const res = await api.post(
        `/api/games/${gameRes.data.game._id}/reviews`,
        {
          rating: 6, // Rating invalide (> 5)
          comment: 'Test rating invalide',
        },
        {
          headers: { Authorization: `Bearer ${user1Token}` },
        }
      );
      const passed = res.status === 400;
      logTest('POST /api/games/:gameId/reviews - Rating invalide (devrait échouer)', passed, `Status: ${res.status}`);
    }
  } catch (error) {
    logTest('POST /api/games/:gameId/reviews - Rating invalide', false, error.message);
  }

  // Test 6: Créer un avis pour un jeu inexistant
  try {
    const res = await api.post(
      '/api/games/000000000000000000000000/reviews',
      {
        rating: 5,
        comment: 'Test jeu inexistant',
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );
    const passed = res.status === 404;
    logTest('POST /api/games/:gameId/reviews - Jeu inexistant (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('POST /api/games/:gameId/reviews - Inexistant', false, error.message);
  }

  // Test 7: Lister les avis d'un jeu
  try {
    const res = await api.get(`/api/games/${game1Id}/reviews`);
    const passed = res.status === 200 && res.data.reviews && res.data.reviews.length >= 2 && res.data.averageRating;
    logTest('GET /api/games/:gameId/reviews - Lister les avis', passed, `Status: ${res.status}, Count: ${res.data.reviews?.length || 0}, Avg: ${res.data.averageRating}`);
  } catch (error) {
    logTest('GET /api/games/:gameId/reviews - Lister', false, error.message);
  }

  // Test 8: Lister les avis d'un jeu sans avis
  try {
    // Créer un nouveau jeu sans avis
    const gameRes = await api.post(
      '/api/games',
      {
        title: 'Game Without Reviews',
        platform: 'PC',
        genre: 'Test',
        releaseYear: 2023,
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );

    if (gameRes.status === 201) {
      const res = await api.get(`/api/games/${gameRes.data.game._id}/reviews`);
      const passed = res.status === 200 && res.data.reviews.length === 0 && res.data.averageRating === 0;
      logTest('GET /api/games/:gameId/reviews - Jeu sans avis', passed, `Status: ${res.status}, Count: ${res.data.reviews?.length || 0}`);
    }
  } catch (error) {
    logTest('GET /api/games/:gameId/reviews - Sans avis', false, error.message);
  }

  // Test 9: Modifier son propre avis
  try {
    const res = await api.put(
      `/api/reviews/${review1Id}`,
      {
        rating: 4,
        comment: 'Après réflexion, 4 étoiles c\'est plus juste.',
      },
      {
        headers: { Authorization: `Bearer ${user2Token}` },
      }
    );
    const passed = res.status === 200 && res.data.review.rating === 4;
    logTest('PUT /api/reviews/:id - Modifier son avis', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('PUT /api/reviews/:id - Modifier', false, error.message);
  }

  // Test 10: Modifier l'avis de quelqu'un d'autre
  try {
    const res = await api.put(
      `/api/reviews/${review1Id}`,
      {
        rating: 1,
        comment: 'Hack attempt',
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );
    const passed = res.status === 403;
    logTest('PUT /api/reviews/:id - Modifier avis d\'autrui (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('PUT /api/reviews/:id - Avis d\'autrui', false, error.message);
  }

  // Test 11: Modifier un avis sans token
  try {
    const res = await api.put(`/api/reviews/${review1Id}`, {
      rating: 1,
    });
    const passed = res.status === 401;
    logTest('PUT /api/reviews/:id - Sans token (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('PUT /api/reviews/:id - Sans token', false, error.message);
  }

  // Test 12: Supprimer l'avis de quelqu'un d'autre
  try {
    const res = await api.delete(`/api/reviews/${review1Id}`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const passed = res.status === 403;
    logTest('DELETE /api/reviews/:id - Supprimer avis d\'autrui (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('DELETE /api/reviews/:id - Avis d\'autrui', false, error.message);
  }

  // Test 13: Supprimer son propre avis
  try {
    const res = await api.delete(`/api/reviews/${review2Id}`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const passed = res.status === 200;
    logTest('DELETE /api/reviews/:id - Supprimer son avis', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('DELETE /api/reviews/:id - Supprimer', false, error.message);
  }

  // Test 14: Supprimer un avis sans token
  try {
    const res = await api.delete(`/api/reviews/${review1Id}`);
    const passed = res.status === 401;
    logTest('DELETE /api/reviews/:id - Sans token (devrait échouer)', passed, `Status: ${res.status}`);
  } catch (error) {
    logTest('DELETE /api/reviews/:id - Sans token', false, error.message);
  }
}

// Fonction principale
async function runTests() {
  console.log(`${colors.yellow}\n╔════════════════════════════════════╗`);
  console.log('║  TESTS API GAMESHARE - PHASES 1-4  ║');
  console.log(`╚════════════════════════════════════╝${colors.reset}\n`);
  console.log(`${colors.gray}Base URL: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.gray}Assurez-vous que le serveur est démarré (npm run dev)${colors.reset}\n`);

  try {

    await testAuth();
    await testGames();
    await testBorrow();
    await testReviews();

    console.log(`\n${colors.yellow}═══════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}Tests terminés!${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}Erreur lors des tests:${colors.reset}`, error.message);
  } finally {
    // Fermer la connexion à la base de données
    await mongoose.connection.close();
  }
}

// Lancer les tests
runTests();
