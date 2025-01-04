import express from 'express';
import Chat from '../models/Chat.js';
import User from '../models/User.js';

const router = express.Router();

// Fetch chats
router.get('/chats/:userId/:contactId', async (req, res) => {
  const { userId, contactId } = req.params;

  try {
    const chats = await Chat.find({
      $or: [
        { sender: userId, receiver: contactId },
        { sender: contactId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search user by username
router.get('/search/:username', async (req, res) => {
  try {
    const currentUserId = req.query.currentUserId;
    const users = await User.find({
      username: { $regex: req.params.username, $options: 'i' },
      _id: { $ne: currentUserId }
    }).select('username');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add this new route
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('username');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add delete message route
router.delete('/message/:messageId', async (req, res) => {
  try {
    const message = await Chat.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    if (message.sender.toString() !== req.query.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await Chat.findByIdAndDelete(req.params.messageId);
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add this new route to get chat history
router.get('/chat-history/:userId', async (req, res) => {
  try {
    // Find all chats where the user is either sender or receiver
    const chats = await Chat.find({
      $or: [
        { sender: req.params.userId },
        { receiver: req.params.userId }
      ]
    }).populate('sender receiver', 'username');

    // Extract unique users from the chats
    const uniqueUsers = new Set();
    const users = [];

    chats.forEach(chat => {
      const otherUser = chat.sender._id.toString() === req.params.userId 
        ? chat.receiver 
        : chat.sender;
      
      if (!uniqueUsers.has(otherUser._id.toString())) {
        uniqueUsers.add(otherUser._id.toString());
        users.push(otherUser);
      }
    });

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/message/:messageId/reaction', async (req, res) => {
  const { messageId } = req.params;
  const { userId, emoji } = req.body;

  try {
    const message = await Chat.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const existingReaction = message.reactions.find(
      (reaction) => reaction.userId.toString() === userId
    );

    if (existingReaction) {
      // Update the reaction if it already exists
      existingReaction.emoji = emoji;
    } else {
      // Add a new reaction
      message.reactions.push({ userId, emoji });
    }

    await message.save();
    res.status(200).json({ message: 'Reaction added/updated successfully', reactions: message.reactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete('/message/:messageId/reaction', async (req, res) => {
  const { messageId } = req.params;
  const { userId } = req.query;

  try {
    const message = await Chat.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    message.reactions = message.reactions.filter(
      (reaction) => reaction.userId.toString() !== userId
    );

    await message.save();
    res.status(200).json({ message: 'Reaction removed successfully', reactions: message.reactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;
