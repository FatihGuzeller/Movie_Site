const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Store active rooms and their states
const rooms = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room event
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    
    // Initialize room if it doesn't exist
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
    
    console.log(`User ${socket.id} joined room ${roomId}`);
    console.log(`Room ${roomId} now has ${room.users.size} users`);
    
    // Send current room state to the new user
    socket.emit('roomState', {
      currentTime: room.currentTime,
      isPlaying: room.isPlaying,
      videoUrl: room.videoUrl
    });
    
    // Notify other users in the room
    socket.to(roomId).emit('userJoined', socket.id);
  });

  // Play event
  socket.on('play', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      room.isPlaying = true;
      socket.to(roomId).emit('play');
      console.log(`Play command sent to room ${roomId}`);
    }
  });

  // Pause event
  socket.on('pause', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      room.isPlaying = false;
      socket.to(roomId).emit('pause');
      console.log(`Pause command sent to room ${roomId}`);
    }
  });

  // Sync time event
  socket.on('syncTime', (data) => {
    const { roomId, currentTime } = data;
    const room = rooms.get(roomId);
    if (room) {
      room.currentTime = currentTime;
      socket.to(roomId).emit('syncTime', { currentTime });
      console.log(`Time sync: ${currentTime}s in room ${roomId}`);
    }
  });

  // Set video URL
  socket.on('setVideoUrl', (data) => {
    const { roomId, videoUrl } = data;
    const room = rooms.get(roomId);
    if (room) {
      room.videoUrl = videoUrl;
      room.currentTime = 0;
      room.isPlaying = false;
      io.to(roomId).emit('videoUrlChanged', { videoUrl });
      console.log(`Video URL set for room ${roomId}: ${videoUrl}`);
    }
  });

  // Chat message event
  socket.on('message', (data) => {
    console.log('Received message data:', data);
    const { roomId, message, username } = data;
    
    // Validate the message data
    if (!roomId || !message || !username) {
      console.log('Invalid message data received:', data);
      return;
    }
    
    const messageData = {
      message: message.trim(),
      username: username.trim() || 'Anonymous',
      timestamp: new Date().toLocaleTimeString()
    };
    
    console.log(`Broadcasting message in room ${roomId}:`, messageData);
    
    // Emit to all users in the room (including sender)
    io.to(roomId).emit('message', messageData);
    console.log(`Message broadcasted to room ${roomId}: ${username}: ${message}`);
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove user from all rooms they were in
    rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        socket.to(roomId).emit('userLeft', socket.id);
        
        // Clean up empty rooms
        if (room.users.size === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (no users left)`);
        } else {
          console.log(`Room ${roomId} now has ${room.users.size} users`);
        }
      }
    });
  });
});

// Basic health check endpoint
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
  console.log(`Health check available at http://localhost:${PORT}/health`);
}); 