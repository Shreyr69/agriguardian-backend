const CommunityPost = require('../models/CommunityPost');
const CommunityReply = require('../models/CommunityReply');
const UserLike = require('../models/UserLike');
const User = require('../models/User');

// GET /api/community/posts
exports.getAllPosts = async (req, res) => {
    try {
        const { crop_id, status } = req.query;

        const query = {};
        if (crop_id) query.crop_id = crop_id;
        if (status) query.status = status;

        const posts = await CommunityPost.find(query)
            .populate('user_id', 'name location')
            .populate('crop_id', 'name name_hi')
            .sort({ created_at: -1 })
            .limit(50);

        // Add reply count and user's like status for each post
        const postsWithExtras = await Promise.all(posts.map(async (post) => {
            const replyCount = await CommunityReply.countDocuments({ post_id: post._id });

            let hasLiked = false;
            if (req.userId) {
                const like = await UserLike.findOne({ user_id: req.userId, post_id: post._id });
                hasLiked = !!like;
            }

            return {
                ...post.toJSON(),
                reply_count: replyCount,
                has_liked: hasLiked
            };
        }));

        res.json(postsWithExtras);
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/community/posts (requires auth)
exports.createPost = async (req, res) => {
    try {
        const { crop_id, title, description, image_url, location } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const post = new CommunityPost({
            user_id: req.userId,
            crop_id: crop_id || null,
            title,
            description,
            image_url,
            location,
            status: 'open',
            upvotes: 0
        });

        await post.save();
        await post.populate('user_id', 'name location');
        await post.populate('crop_id', 'name name_hi');

        res.status(201).json(post);
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/community/posts/:id/like (requires auth)
exports.toggleLike = async (req, res) => {
    try {
        const postId = req.params.id;

        // Check if post exists
        const post = await CommunityPost.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Check if user already liked
        const existingLike = await UserLike.findOne({
            user_id: req.userId,
            post_id: postId
        });

        if (existingLike) {
            // Unlike
            await existingLike.deleteOne();
            post.upvotes = Math.max(0, post.upvotes - 1);
            await post.save();

            return res.json({ liked: false, upvotes: post.upvotes });
        } else {
            // Like
            const like = new UserLike({
                user_id: req.userId,
                post_id: postId
            });
            await like.save();

            post.upvotes += 1;
            await post.save();

            return res.json({ liked: true, upvotes: post.upvotes });
        }
    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/community/posts/:id/replies
exports.getReplies = async (req, res) => {
    try {
        const replies = await CommunityReply.find({ post_id: req.params.id })
            .populate('user_id', 'name location')
            .sort({ created_at: 1 });

        res.json(replies);
    } catch (error) {
        console.error('Get replies error:', error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/community/posts/:id/replies (requires auth)
exports.createReply = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Check if post exists
        const post = await CommunityPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const reply = new CommunityReply({
            post_id: req.params.id,
            user_id: req.userId,
            message
        });

        await reply.save();
        await reply.populate('user_id', 'name location');

        res.status(201).json(reply);
    } catch (error) {
        console.error('Create reply error:', error);
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/community/posts/:id (requires auth)
exports.deletePost = async (req, res) => {
    try {
        const post = await CommunityPost.findOne({
            _id: req.params.id,
            user_id: req.userId
        });

        if (!post) {
            return res.status(404).json({ error: 'Post not found or unauthorized' });
        }

        // Delete associated replies and likes
        await CommunityReply.deleteMany({ post_id: post._id });
        await UserLike.deleteMany({ post_id: post._id });
        await post.deleteOne();

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/community/posts/:postId/replies/:replyId (requires auth)
exports.deleteReply = async (req, res) => {
    try {
        const reply = await CommunityReply.findOne({
            _id: req.params.replyId,
            post_id: req.params.postId,
            user_id: req.userId
        });

        if (!reply) {
            return res.status(404).json({ error: 'Reply not found or unauthorized' });
        }

        await reply.deleteOne();
        res.json({ message: 'Reply deleted successfully' });
    } catch (error) {
        console.error('Delete reply error:', error);
        res.status(500).json({ error: error.message });
    }
};
