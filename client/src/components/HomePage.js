import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomId.trim() && username.trim()) {
      navigate(`/room/${roomId.trim()}`);
    }
  };

  const generateRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(randomId);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Watch Party</h1>
          <p className="text-gray-300">Watch videos together with friends in real-time sync</p>
        </div>

        <form onSubmit={handleJoinRoom} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="roomId" className="block text-sm font-medium text-gray-300 mb-2">
              Room ID
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={generateRoomId}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors duration-200"
              >
                Generate
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Join Room
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Share the room ID with friends to watch together!
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 