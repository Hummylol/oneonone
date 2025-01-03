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
    origin: ['http://localhost:5173', 'https://humaidchat.vercel.app/'], // Replace with your frontend URL
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit the process if DB connection fails
  });

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);

// Debug: List all routes for easier debugging
app._router.stack.forEach(function (r) {
  if (r.route && r.route.path) {
    console.log(r.route.path);
  }
});

// Add this before your socket.io logic
const connectedUsers = new Map(); // Using Map for efficient userId lookup

// Socket.IO logic
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    connectedUsers.set(userId, socket.id);
    console.log('Connected users:', connectedUsers.size);
  }

  socket.on('join_room', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`${userId} joined room`);
    }
  });

  socket.on('send_message', async (data) => {
    const { senderId, receiverId, text } = data;

    if (!senderId || !receiverId || !text) {
      console.error('Invalid message data:', data);
      return;
    }

    try {
      // Save message to DB
      const chatMessage = new Chat({
        sender: senderId,
        receiver: receiverId,
        message: text,
      });

      const savedMessage = await chatMessage.save();

      const messageToSend = {
        _id: savedMessage._id,
        sender: senderId,
        receiver: receiverId,
        text: savedMessage.message,
        createdAt: savedMessage.createdAt,
      };

      // Send the message to both users
      const receiverSocketId = connectedUsers.get(receiverId);
      const senderSocketId = connectedUsers.get(senderId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', messageToSend);
      }
      if (senderSocketId) {
        io.to(senderSocketId).emit('receive_message', messageToSend);
      }

      console.log('Message sent:', messageToSend);
    } catch (err) {
      console.error('Error saving message:', err.message);
    }
  });

  socket.on('disconnect', () => {
    if (userId) {
      connectedUsers.delete(userId);
      console.log('Disconnected users:', connectedUsers.size);
    }
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
