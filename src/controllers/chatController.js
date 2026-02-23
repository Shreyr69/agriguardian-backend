const ChatConversation = require('../models/ChatConversation');
const ChatMessage = require('../models/ChatMessage');
const logger = require('../utils/logger');

/**
 * Create a new conversation
 */
exports.createConversation = async (req, res) => {
    try {
        const userId = req.userId;
        const { title, crop_context, location, language } = req.body;

        const conversation = await ChatConversation.create({
            user_id: userId,
            title: title || 'New Conversation',
            crop_context,
            location: location || 'Punjab, India',
            language: language || 'en'
        });

        res.status(201).json({
            success: true,
            conversation: conversation.toJSON()
        });
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create conversation'
        });
    }
};

/**
 * Get all conversations for a user
 */
exports.getUserConversations = async (req, res) => {
    try {
        const userId = req.userId;
        const { limit = 20, skip = 0 } = req.query;

        const conversations = await ChatConversation.find({
            user_id: userId,
            is_active: true
        })
            .sort({ pinned: -1, last_message_at: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await ChatConversation.countDocuments({
            user_id: userId,
            is_active: true
        });

        res.json({
            success: true,
            conversations: conversations.map(conv => conv.toJSON()),
            total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch conversations'
        });
    }
};

/**
 * Get a single conversation with messages
 */
exports.getConversation = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const conversation = await ChatConversation.findOne({
            _id: id,
            user_id: userId
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }

        const messages = await ChatMessage.find({ conversation_id: id })
            .sort({ created_at: 1 });

        res.json({
            success: true,
            conversation: conversation.toJSON(),
            messages: messages.map(msg => msg.toJSON())
        });
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch conversation'
        });
    }
};

/**
 * Update conversation title or context
 */
exports.updateConversation = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { title, crop_context, location, pinned } = req.body;

        const conversation = await ChatConversation.findOneAndUpdate(
            { _id: id, user_id: userId },
            {
                $set: {
                    ...(title && { title }),
                    ...(crop_context !== undefined && { crop_context }),
                    ...(location && { location }),
                    ...(pinned !== undefined && { pinned })
                }
            },
            { new: true }
        );

        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }

        res.json({
            success: true,
            conversation: conversation.toJSON()
        });
    } catch (error) {
        console.error('Error updating conversation:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update conversation'
        });
    }
};

/**
 * Delete conversation (soft delete)
 */
exports.deleteConversation = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const conversation = await ChatConversation.findOneAndUpdate(
            { _id: id, user_id: userId },
            { $set: { is_active: false } },
            { new: true }
        );

        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }

        res.json({
            success: true,
            message: 'Conversation deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete conversation'
        });
    }
};

/**
 * Save a message to a conversation
 */
exports.saveMessage = async (req, res) => {
    try {
        const userId = req.userId;
        const { conversation_id } = req.params;
        const { role, content, metadata } = req.body;

        // Verify conversation ownership
        const conversation = await ChatConversation.findOne({
            _id: conversation_id,
            user_id: userId
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }

        // Create message
        const message = await ChatMessage.create({
            conversation_id,
            user_id: userId,
            role,
            content,
            metadata: metadata || {}
        });

        // Update conversation
        await ChatConversation.findByIdAndUpdate(conversation_id, {
            $set: { last_message_at: new Date() },
            $inc: { message_count: 1 }
        });

        res.status(201).json({
            success: true,
            message
        });
    } catch (error) {
        logger.error('Error saving message:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to save message'
        });
    }
};
