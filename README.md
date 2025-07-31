# Watch Party App

A simple watch party website where multiple users can join a room and watch the same video together in real-time sync.

## Features

- **Real-time Video Synchronization**: All users in a room see the same video at the same time
- **Play/Pause Controls**: Synchronized play and pause across all users
- **Time Synchronization**: Automatic time sync when users seek or join
- **Live Chat**: Real-time chat functionality for room participants
- **Room Management**: Create or join rooms with unique IDs
- **User Tracking**: See how many users are currently in the room
- **Modern UI**: Beautiful interface built with Tailwind CSS

## Tech Stack

### Frontend
- React 18
- React Router DOM
- Socket.IO Client
- Tailwind CSS

### Backend
- Node.js
- Express
- Socket.IO
- CORS

## Project Structure

```
watch-party-app/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── HomePage.js
│   │   │   └── WatchRoom.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── server/                 # Node.js backend
│   ├── server.js
│   └── package.json
├── package.json
└── README.md
```

## Installation

1. **Install all dependencies**:
   ```bash
   npm run install-all
   ```

2. **Or install manually**:
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server && npm install
   
   # Install client dependencies
   cd ../client && npm install
   ```

## Running the Application

### Development Mode (Recommended)

Run both frontend and backend simultaneously:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

### Running Separately

**Backend only**:
```bash
npm run server
```

**Frontend only**:
```bash
npm run client
```

## Usage

1. **Open the application** in your browser at `http://localhost:3000`

2. **Create or Join a Room**:
   - Enter your name
   - Enter a room ID or generate one randomly
   - Click "Join Room"

3. **Share the Room ID** with friends to watch together

4. **Add a Video**:
   - Paste a video URL (MP4 format) in the video URL field
   - The video will be synchronized across all users

5. **Control Playback**:
   - Use the Play/Pause button to control video playback
   - All users will see the same synchronized playback

6. **Chat**: Use the chat panel on the right to communicate with other users

## Socket.IO Events

### Client to Server
- `joinRoom`: Join a specific room
- `play`: Broadcast play command to room
- `pause`: Broadcast pause command to room
- `syncTime`: Broadcast current video time to room
- `setVideoUrl`: Set video URL for the room
- `message`: Send chat message to room

### Server to Client
- `roomState`: Send current room state to new user
- `play`: Play video (received from other user)
- `pause`: Pause video (received from other user)
- `syncTime`: Sync video time (received from other user)
- `videoUrlChanged`: Video URL changed
- `message`: Receive chat message
- `userJoined`: User joined the room
- `userLeft`: User left the room

## Future Enhancements

- YouTube video integration
- User authentication and profiles
- Room password protection
- Video quality controls
- Screen sharing capabilities
- Mobile responsiveness improvements
- Video upload functionality
- Room persistence and history

## Troubleshooting

### Common Issues

1. **Socket connection failed**:
   - Make sure the backend server is running on port 5000
   - Check if the frontend is connecting to the correct server URL

2. **Video not playing**:
   - Ensure the video URL is accessible and in MP4 format
   - Check browser console for CORS errors

3. **Synchronization issues**:
   - Refresh the page if video sync is not working
   - Check network connectivity

### Development Tips

- Use browser developer tools to monitor Socket.IO connections
- Check server console for connection logs
- Test with multiple browser tabs to simulate multiple users

## License

MIT License - feel free to use this project for learning or development purposes. 