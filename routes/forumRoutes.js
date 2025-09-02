const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const auth = require('../middlewares/authMiddleware');

// Todas as rotas requerem autenticação
router.use(auth);

// Rotas para posts do fórum
router.get('/posts', forumController.getForumPosts);
router.get('/posts/:postId/comments', forumController.getPostComments); // Nova rota
router.post('/comments/:commentId/vote', forumController.voteComment);
router.post('/posts', forumController.createForumPost);
router.post('/posts/:postId/vote', forumController.votePost);
router.post('/posts/:postId/comments', forumController.addComment);


// Estatísticas do usuário no fórum
router.get('/user/stats', forumController.getUserForumStats);

module.exports = router;