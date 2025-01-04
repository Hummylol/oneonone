import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    replyTo: {
      messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
      message: { type: String },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String } // Store the emoji or reaction symbol
      }
    ]
  },
  { timestamps: true }
);
export default mongoose.model('Chat', ChatSchema);