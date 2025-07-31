# Setup Guide for Watch Party App

## Prerequisites

You need to install Node.js and npm first. Here's how:

### Installing Node.js

1. **Download Node.js**:
   - Go to https://nodejs.org/
   - Download the LTS (Long Term Support) version
   - Choose the Windows installer (.msi file)

2. **Install Node.js**:
   - Run the downloaded .msi file
   - Follow the installation wizard
   - Make sure to check "Add to PATH" during installation
   - Complete the installation

3. **Verify Installation**:
   - Open a new Command Prompt or PowerShell
   - Run: `node --version`
   - Run: `npm --version`
   - Both commands should show version numbers

### Alternative: Using Chocolatey (if you have it)

If you have Chocolatey package manager installed:
```powershell
choco install nodejs
```

## Installing the Watch Party App

Once Node.js is installed, follow these steps:

1. **Open Command Prompt or PowerShell** in the project directory

2. **Install all dependencies**:
   ```bash
   npm run install-all
   ```

3. **Start the application**:
   ```bash
   npm run dev
   ```

## Manual Installation Steps

If the above doesn't work, install dependencies manually:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

## Running the Application

### Development Mode (Recommended)
```bash
npm run dev
```

This starts both:
- Backend server on http://localhost:5000
- Frontend React app on http://localhost:3000

### Running Separately

**Backend only**:
```bash
npm run server
```

**Frontend only**:
```bash
npm run client
```

## Testing the Application

1. **Open your browser** and go to `http://localhost:3000`

2. **Create a room**:
   - Enter your name
   - Generate or enter a room ID
   - Click "Join Room"

3. **Test with multiple users**:
   - Open another browser tab/window
   - Go to the same room ID
   - Add a video URL (MP4 format)
   - Test synchronized playback

## Sample Video URLs for Testing

You can use these sample video URLs for testing:
- https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4
- https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4

## Troubleshooting

### "npm is not recognized"
- Make sure Node.js is installed correctly
- Restart your command prompt/PowerShell
- Check if Node.js is in your PATH

### "Port already in use"
- Close other applications using ports 3000 or 5000
- Or change ports in the configuration files

### Socket connection issues
- Make sure both server and client are running
- Check browser console for errors
- Verify firewall settings

### Video not playing
- Use MP4 format videos
- Check if the video URL is accessible
- Try different video URLs

## File Structure Created

```
Film_Sitesi/
├── package.json              # Root package.json
├── README.md                 # Main documentation
├── SETUP.md                  # This setup guide
├── client/                   # React frontend
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── HomePage.js
│   │   │   └── WatchRoom.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── tailwind.config.js
│   └── postcss.config.js
└── server/                   # Node.js backend
    ├── package.json
    └── server.js
```

## Next Steps

After successful installation:
1. Read the main README.md for detailed usage instructions
2. Test the application with friends
3. Explore the code to understand how it works
4. Consider adding new features like YouTube integration

## Support

If you encounter issues:
1. Check this setup guide
2. Read the main README.md
3. Check browser console for errors
4. Verify Node.js installation with `node --version` 