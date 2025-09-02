const db = require('../models');
const { Op } = require('sequelize');

// Obter todos os posts do fórum
exports.getForumPosts = async (req, res) => {
    try {
        const { filter } = req.query;

        let order = [];
        switch (filter) {
            case 'recent':
                order = [['Data_Criacao', 'DESC']];
                break;
            case 'popular':
            case 'top':
                // ✅ Corrigido: usar alias da tabela para evitar ambiguidade
                order = [[db.sequelize.literal('"forum"."Upvotes" - "forum"."Downvotes"'), 'DESC']];
                break;
            default:
                order = [['Data_Criacao', 'DESC']];
        }

        // Buscar posts
        const posts = await db.Forum.findAll({
            where: { Visivel: true },
            order,
            include: [{
                model: db.ForumComentario,
                as: 'comentarios',
                attributes: [],
                required: false
            }],
            attributes: {
                include: [
                    [
                        db.sequelize.fn(
                            'COUNT',
                            db.sequelize.col('comentarios.ID_Comentario')
                        ),
                        'commentCount'
                    ]
                ]
            },
            // ✅ Corrigido: precisa incluir todas as colunas do Forum usadas
            group: [
                'forum.ID_Forum',
                'forum.Titulo',
                'forum.Descricao',
                'forum.Autor_ID',
                'forum.Autor_Tipo',
                'forum.Data_Criacao',
                'forum.Upvotes',
                'forum.Downvotes',
                'forum.Visivel'
            ]
        });

        // Montar resposta final com detalhes extras
        const postsWithDetails = await Promise.all(posts.map(async (post) => {
            // Contagem de comentários
            const commentCount = await db.ForumComentario.count({
                where: { ID_Forum: post.ID_Forum }
            });

            // Verificar voto do usuário
            const vote = await db.ForumVoto.findOne({
                where: {
                    ID_Forum: post.ID_Forum,
                    Autor_ID: req.user.id,
                    Autor_Tipo: req.user.role
                }
            });

            // Nome do autor
            let autorNome = 'Utilizador';
            try {
                if (post.Autor_Tipo === 'formando') {
                    const autor = await db.Formando.findByPk(post.Autor_ID);
                    autorNome = autor ? autor.Nome : autorNome;
                } else if (post.Autor_Tipo === 'formador') {
                    const autor = await db.Formador.findByPk(post.Autor_ID);
                    autorNome = autor ? autor.Nome : autorNome;
                } else if (post.Autor_Tipo === 'gestor') {
                    const autor = await db.Gestor.findByPk(post.Autor_ID);
                    autorNome = autor ? autor.Nome : autorNome;
                }
            } catch (err) {
                console.error('Erro ao buscar autor:', err);
            }

            return {
                id: post.ID_Forum,
                title: post.Titulo,
                content: post.Descricao,
                author: autorNome,
                authorId: post.Autor_ID,
                createdAt: post.Data_Criacao,
                upvotes: post.Upvotes,
                downvotes: post.Downvotes,
                score: post.Upvotes - post.Downvotes,
                commentCount,
                userVote: vote ? vote.Tipo : null
            };
        }));

        // ✅ fallback para ordenação manual (caso o SQL não funcione em todos DBs)
        if (filter === 'popular' || filter === 'top') {
            postsWithDetails.sort((a, b) => b.score - a.score);
        }

        res.json(postsWithDetails);
    } catch (error) {
        console.error('Erro ao obter posts do fórum:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Obter comentários de um post específico
// Obter comentários de um post específico (com estrutura hierárquica)
exports.getPostComments = async (req, res) => {
    try {
        const { postId } = req.params;

        const comentarios = await db.ForumComentario.findAll({
            where: { ID_Forum: postId },
            order: [['Data_Criacao', 'ASC']]
        });

        // Construir estrutura hierárquica
        const buildCommentTree = (comments) => {
            const commentMap = {};
            const commentTree = [];

            // Primeiro mapeia todos os comentários
            comments.forEach(comment => {
                commentMap[comment.ID_Comentario] = {
                    ...comment.toJSON(),
                    replies: []
                };
            });

            // Constrói a árvore
            comments.forEach(comment => {
                if (comment.ID_Comentario_Pai) {
                    const parent = commentMap[comment.ID_Comentario_Pai];
                    if (parent) {
                        parent.replies.push(commentMap[comment.ID_Comentario]);
                    }
                } else {
                    commentTree.push(commentMap[comment.ID_Comentario]);
                }
            });

            return commentTree;
        };

        const comentariosCompletos = await Promise.all(
            buildCommentTree(comentarios).map(async (comentario) => {
                let autorNome = 'Utilizador';

                try {
                    if (comentario.Autor_Tipo === 'formando') {
                        const autor = await db.Formando.findByPk(comentario.Autor_ID);
                        autorNome = autor ? autor.Nome : autorNome;
                    } else if (comentario.Autor_Tipo === 'formador') {
                        const autor = await db.Formador.findByPk(comentario.Autor_ID);
                        autorNome = autor ? autor.Nome : autorNome;
                    } else if (comentario.Autor_Tipo === 'gestor') {
                        const autor = await db.Gestor.findByPk(comentario.Autor_ID);
                        autorNome = autor ? autor.Nome : autorNome;
                    }
                } catch (err) {
                    console.error('Erro ao buscar autor do comentário:', err);
                }

                return {
                    id: comentario.ID_Comentario,
                    content: comentario.Conteudo,
                    author: autorNome,
                    authorId: comentario.Autor_ID,
                    createdAt: comentario.Data_Criacao,
                    upvotes: comentario.Upvotes,
                    downvotes: comentario.Downvotes,
                    replies: comentario.replies
                };
            })
        );

        res.json(comentariosCompletos);
    } catch (error) {
        console.error('Erro ao obter comentários do post:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Criar post
exports.createForumPost = async (req, res) => {
    try {
        const { title, content } = req.body;

        const novoPost = await db.Forum.create({
            Titulo: title,
            Descricao: content,
            Autor_ID: req.user.id,
            Autor_Tipo: req.user.role,
            Upvotes: 0,
            Downvotes: 0,
            Visivel: true
        });

        let autor;
        switch (req.user.role) {
            case 'formando': autor = await db.Formando.findByPk(req.user.id); break;
            case 'formador': autor = await db.Formador.findByPk(req.user.id); break;
            case 'gestor': autor = await db.Gestor.findByPk(req.user.id); break;
        }

        res.status(201).json({
            message: 'Post criado com sucesso',
            post: {
                id: novoPost.ID_Forum,
                title: novoPost.Titulo,
                content: novoPost.Descricao,
                author: autor ? autor.Nome : 'Utilizador',
                authorId: novoPost.Autor_ID,
                createdAt: novoPost.Data_Criacao,
                upvotes: 0,
                downvotes: 0,
                score: 0,
                commentCount: 0,
                userVote: null
            }
        });
    } catch (error) {
        console.error('Erro ao criar post:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Votar em post
exports.votePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { voteType } = req.body;

        const post = await db.Forum.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado' });
        }

        const existingVote = await db.ForumVoto.findOne({
            where: {
                ID_Forum: postId,
                Autor_ID: req.user.id,
                Autor_Tipo: req.user.role
            }
        });

        let userVote = null;

        if (existingVote) {
            if (existingVote.Tipo === voteType) {
                // Remove o voto se for o mesmo tipo
                await existingVote.destroy();
                if (voteType === 'up') {
                    post.Upvotes -= 1;
                } else {
                    post.Downvotes -= 1;
                }
            } else {
                // Altera o voto se for tipo diferente
                existingVote.Tipo = voteType;
                await existingVote.save();
                if (voteType === 'up') {
                    post.Upvotes += 1;
                    post.Downvotes -= 1;
                } else {
                    post.Downvotes += 1;
                    post.Upvotes -= 1;
                }
                userVote = voteType;
            }
        } else {
            // Adiciona novo voto
            await db.ForumVoto.create({
                ID_Forum: postId,
                Autor_ID: req.user.id,
                Autor_Tipo: req.user.role,
                Tipo: voteType
            });
            if (voteType === 'up') {
                post.Upvotes += 1;
            } else {
                post.Downvotes += 1;
            }
            userVote = voteType;
        }

        await post.save();

        res.json({
            message: 'Voto registrado com sucesso',
            upvotes: post.Upvotes,
            downvotes: post.Downvotes,
            score: post.Upvotes - post.Downvotes,
            userVote: userVote // Esta é a correção principal
        });
    } catch (error) {
        console.error('Erro ao votar no post:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Votar em comentário (esqueleto pronto)
// Votar em comentário
exports.voteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { voteType } = req.body;

        const comment = await db.ForumComentario.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comentário não encontrado' });
        }

        const existingVote = await db.ForumComentarioVoto.findOne({
            where: {
                ID_Comentario: commentId,
                Autor_ID: req.user.id,
                Autor_Tipo: req.user.role
            }
        });

        let userVote = null;

        if (existingVote) {
            if (existingVote.Tipo === voteType) {
                // Remove o voto se for o mesmo tipo
                await existingVote.destroy();
                if (voteType === 'up') {
                    comment.Upvotes -= 1;
                } else {
                    comment.Downvotes -= 1;
                }
            } else {
                // Altera o voto se for tipo diferente
                existingVote.Tipo = voteType;
                await existingVote.save();

                if (voteType === 'up') {
                    comment.Upvotes += 1;
                    comment.Downvotes -= 1;
                } else {
                    comment.Downvotes += 1;
                    comment.Upvotes -= 1;
                }
                userVote = voteType;
            }
        } else {
            // Adiciona novo voto
            await db.ForumComentarioVoto.create({
                ID_Comentario: commentId,
                Autor_ID: req.user.id,
                Autor_Tipo: req.user.role,
                Tipo: voteType
            });

            if (voteType === 'up') {
                comment.Upvotes += 1;
            } else {
                comment.Downvotes += 1;
            }
            userVote = voteType;
        }

        await comment.save();

        res.json({
            message: 'Voto registrado com sucesso',
            upvotes: comment.Upvotes,
            downvotes: comment.Downvotes,
            score: comment.Upvotes - comment.Downvotes,
            userVote: userVote
        });
    } catch (error) {
        console.error('Erro ao votar no comentário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Adicionar comentário
exports.addComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, parentId } = req.body;

        const post = await db.Forum.findByPk(postId);
        if (!post) return res.status(404).json({ message: 'Post não encontrado' });

        const novoComentario = await db.ForumComentario.create({
            ID_Forum: postId,
            Conteudo: content,
            Autor_ID: req.user.id,
            Autor_Tipo: req.user.role,
            ID_Comentario_Pai: parentId || null
        });

        let autor;
        switch (req.user.role) {
            case 'formando': autor = await db.Formando.findByPk(req.user.id); break;
            case 'formador': autor = await db.Formador.findByPk(req.user.id); break;
            case 'gestor': autor = await db.Gestor.findByPk(req.user.id); break;
        }

        res.status(201).json({
            message: 'Comentário adicionado com sucesso',
            comment: {
                id: novoComentario.ID_Comentario,
                content: novoComentario.Conteudo,
                author: autor ? autor.Nome : 'Utilizador',
                authorId: novoComentario.Autor_ID,
                createdAt: novoComentario.Data_Criacao
            }
        });
    } catch (error) {
        console.error('Erro ao adicionar comentário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Estatísticas do usuário
exports.getUserForumStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const userType = req.user.role;

        const postCount = await db.Forum.count({
            where: { Autor_ID: userId, Autor_Tipo: userType, Visivel: true }
        });

        const commentCount = await db.ForumComentario.count({
            where: { Autor_ID: userId, Autor_Tipo: userType }
        });

        const posts = await db.Forum.findAll({
            where: { Autor_ID: userId, Autor_Tipo: userType, Visivel: true },
            attributes: ['ID_Forum']
        });

        const postIds = posts.map(post => post.ID_Forum);
        const upvotesReceived = await db.ForumVoto.count({
            where: { ID_Forum: postIds, Tipo: 'up' }
        });

        res.json({ posts: postCount, comments: commentCount, upvotes: upvotesReceived });
    } catch (error) {
        console.error('Erro ao obter estatísticas do fórum:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};
