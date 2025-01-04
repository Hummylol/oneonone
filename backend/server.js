import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import Chat from './models/Chat.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'https://humaidchat.vercel.app'], // Allow both localhost and production URLs
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // If you need credentials (cookies, etc.) in your requests
  },
});

// Middleware
app.use(express.json());

// CORS middleware for express
app.use(cors({
  origin: ['http://localhost:5173', 'https://humaidchat.vercel.app'],
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // If using cookies or any credentials
}));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);



// Add this before your socket.io logic
const connectedUsers = new Set();

// Socket.IO logic
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId; // We'll pass this from the frontend

  if (userId) {
    connectedUsers.add(userId);
    console.log('Connected users:', connectedUsers.size);
  }

  socket.on('join_room', (userId) => {
    socket.join(userId);
  });

  socket.on('send_message', async (data) => {
    const { senderId, receiverId, text, replyTo } = data;

    try {
      const chatMessage = new Chat({
        sender: senderId,
        receiver: receiverId,
        message: text,
        replyTo: replyTo
      });
      const savedMessage = await chatMessage.save();

      // Structure the message exactly as it will be used in the frontend
      const messageToSend = {
        _id: savedMessage._id,
        sender: senderId,
        receiver: receiverId,
        message: text, // Changed from 'text' to 'message' to match frontend
        replyTo: replyTo,
        createdAt: savedMessage.createdAt
      };

      io.to(receiverId).emit('receive_message', messageToSend);
      io.to(senderId).emit('receive_message', messageToSend);
    } catch (err) {
      console.error('Error saving message:', err.message);
    }
  });

  // Add delete message socket event
  socket.on('delete_message', async (data) => {
    const { messageId, userId, receiverId } = data;

    try {
      await Chat.findByIdAndDelete(messageId);

      // Emit delete event to both users
      io.to(receiverId).emit('message_deleted', messageId);
      io.to(userId).emit('message_deleted', messageId);
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  });

  socket.on('disconnect', () => {
    if (userId) {
      connectedUsers.delete(userId);
      console.log('Connected users:', connectedUsers.size);
    }
  });
  socket.on('add_reaction', async (data) => {
    const { messageId, userId, emoji } = data;

    try {
      const message = await Chat.findById(messageId);

      if (!message) return;

      const existingReaction = message.reactions.find(
        (reaction) => reaction.userId.toString() === userId
      );

      if (existingReaction) {
        existingReaction.emoji = emoji; // Update reaction
      } else {
        message.reactions.push({ userId, emoji }); // Add new reaction
      }

      await message.save();

      io.to(message.receiver.toString()).emit('reaction_updated', { messageId, reactions: message.reactions });
      io.to(message.sender.toString()).emit('reaction_updated', { messageId, reactions: message.reactions });
    } catch (err) {
      console.error('Error adding reaction:', err.message);
    }
  });

  socket.on('remove_reaction', async (data) => {
    const { messageId, userId } = data;

    try {
      const message = await Chat.findById(messageId);

      if (!message) return;

      message.reactions = message.reactions.filter(
        (reaction) => reaction.userId.toString() !== userId
      );

      await message.save();

      io.to(message.receiver.toString()).emit('reaction_updated', { messageId, reactions: message.reactions });
      io.to(message.sender.toString()).emit('reaction_updated', { messageId, reactions: message.reactions });
    } catch (err) {
      console.error('Error removing reaction:', err.message);
    }
  });

});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
