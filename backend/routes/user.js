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

export default router;
