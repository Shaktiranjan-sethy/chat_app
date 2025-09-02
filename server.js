import express from 'express';
import http from 'http'
import { Server } from 'socket.io'
import mongoose from "mongoose";
import {Chat} from './models/Chat.js'

const app = express();
const server = http.createServer(app);
const io = new Server(server);

mongoose.connect("mongodb://127.0.0.1:27017/chatapp")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error(err));

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("🔗 User connected:", socket.id);

  // Join a room
  socket.on("joinRoom", async ({ username, room }) => {
    socket.join(room);
    socket.username = username;
    socket.room = room;

    // Notify others
    socket.to(room).emit("notification", `🔵 ${username} joined ${room}`);

    // Load last 10 chats from DB
    const chats = await Chat.find({ room }).sort({ createdAt: -1 }).limit(10);
    socket.emit("loadMessages", chats.reverse());
  });

  // Handle message
  socket.on("chatMessage", async (msg) => {
    const chat = new Chat({ room: socket.room, username: socket.username, message: msg });
    await chat.save();

    io.to(socket.room).emit("chatMessage", {
      username: socket.username,
      message: msg,
      createdAt: chat.createdAt
    });
  });

  // Typing indicator
  socket.on("typing", () => {
   // console.log( `${socket.username} is typing...`);
    socket.to(socket.room).emit("typing", `${socket.username} is typing...`);
  });

  // Stop typing
  socket.on("stopTyping", () => {
    socket.to(socket.room).emit("stopTyping");
  });

  // Disconnect
  socket.on("disconnect", () => {
    if (socket.username && socket.room) {
      io.to(socket.room).emit("notification", `🔴 ${socket.username} left ${socket.room}`);
    }
  });
});

server.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));
