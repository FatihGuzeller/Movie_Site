require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        users: new Set(),
        currentTime: 0,
        isPlaying: false,
        videoUrl: null
      });
    }

    const room = rooms.get(roomId);
    room.users.add(socket.id);

    socket.emit('roomState', {
      currentTime: room.currentTime,
      isPlaying: room.isPlaying,
      videoUrl: room.videoUrl
    });

    socket.to(roomId).emit('userJoined', socket.id);
  });

  socket.on('play', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      room.isPlaying = true;
      socket.to(roomId).emit('play');
    }
  });

  socket.on('pause', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      room.isPlaying = false;
      socket.to(roomId).emit('pause');
    }
  });

  socket.on('syncTime', ({ roomId, currentTime }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.currentTime = currentTime;
      socket.to(roomId).emit('syncTime', { currentTime });
    }
  });

  socket.on('setVideoUrl', ({ roomId, videoUrl }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.videoUrl = videoUrl;
      room.currentTime = 0;
      room.isPlaying = false;
      io.to(roomId).emit('videoUrlChanged', { videoUrl });
    }
  });

  socket.on('message', ({ roomId, message, username }) => {
    if (!roomId || !message || !username) return;

    const messageData = {
      message: message.trim(),
      username: username.trim() || 'Anonymous',
      timestamp: new Date().toLocaleTimeString()
    };

    io.to(roomId).emit('message', messageData);
  });

  socket.on('disconnect', () => {
    rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        socket.to(roomId).emit('userLeft', socket.id);
        if (room.users.size === 0) rooms.delete(roomId);
      }
    });
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    activeRooms: rooms.size,
    totalUsers: Array.from(rooms.values()).reduce((sum, room) => sum + room.users.size, 0)
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
