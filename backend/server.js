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
  methods: ['GET', 'POST','DELETE'],
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
    const { senderId, receiverId, text } = data;

    try {
      const chatMessage = new Chat({
        sender: senderId,
        receiver: receiverId,
        message: text,
      });
      const savedMessage = await chatMessage.save();

      // Send the complete message object including _id
      const messageToSend = {
        _id: savedMessage._id,
        sender: senderId,
        receiver: receiverId,
        text: savedMessage.message,
        createdAt: savedMessage.createdAt
      };

      io.to(receiverId).emit('receive_message', messageToSend);
      io.to(senderId).emit('receive_message', messageToSend);
    } catch (err) {
      console.error('Error saving message:', err.message);
    }
  });

  socket.on('disconnect', () => {
    if (userId) {
      connectedUsers.delete(userId);
      console.log('Connected users:', connectedUsers.size);
    }
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
