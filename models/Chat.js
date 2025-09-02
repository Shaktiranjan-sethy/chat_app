import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  room: String,
  username: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

export const Chat = mongoose.model("Chat", chatSchema);
