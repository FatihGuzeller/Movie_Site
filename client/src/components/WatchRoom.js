import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Hls from 'hls.js';

const WatchRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playerType, setPlayerType] = useState('none'); // 'video', 'youtube', 'none'
  const [youtubeVideoId, setYoutubeVideoId] = useState('');
  
  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const hlsRef = useRef(null);
  const isUserAction = useRef(false);
  const controlsTimeoutRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    // Get username from localStorage or prompt
    const savedUsername = localStorage.getItem('watchPartyUsername');
    if (savedUsername) {
      setUsername(savedUsername);
    } else {
      const name = prompt('Enter your name:') || 'Anonymous';
      setUsername(name);
      localStorage.setItem('watchPartyUsername', name);
    }

    // Connect to Socket.IO server
    const newSocket = io(process.env.REACT_APP_SOCKET_URL);
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('joinRoom', roomId);
      console.log('Connected to server and joined room:', roomId);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('roomState', (state) => {
      setVideoUrl(state.videoUrl || '');
      setIsPlaying(state.isPlaying);
      if (state.currentTime > 0) {
        setCurrentTime(state.currentTime);
        if (videoRef.current) {
          videoRef.current.currentTime = state.currentTime;
        }
      }
      if (state.videoUrl) {
        processVideoUrl(state.videoUrl);
      }
    });

    newSocket.on('play', () => {
      if (videoRef.current && playerType === 'video') {
        videoRef.current.play();
        setIsPlaying(true);
      }
    });

    newSocket.on('pause', () => {
      if (videoRef.current && playerType === 'video') {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    });

    newSocket.on('syncTime', (data) => {
      if (videoRef.current && !isUserAction.current && playerType === 'video') {
        videoRef.current.currentTime = data.currentTime;
        setCurrentTime(data.currentTime);
      }
    });

    newSocket.on('videoUrlChanged', (data) => {
      setVideoUrl(data.videoUrl);
      setCurrentTime(0);
      setIsPlaying(false);
      setVideoError('');
      processVideoUrl(data.videoUrl);
    });

    newSocket.on('message', (messageData) => {
      console.log('Received message:', messageData);
      
      // Add message to state
      setMessages(prev => [...prev, messageData]);
    });

    newSocket.on('userJoined', (userId) => {
      setUserCount(prev => prev + 1);
      console.log('User joined:', userId);
    });

    newSocket.on('userLeft', (userId) => {
      setUserCount(prev => Math.max(1, prev - 1));
      console.log('User left:', userId);
    });

    return () => {
      newSocket.disconnect();
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [roomId, playerType]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const extractYoutubeVideoId = (url) => {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    return match ? match[1] : null;
  };

  const isDirectVideoUrl = (url) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mkv', '.m3u8', '.avi', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  const processVideoUrl = (url) => {
    if (!url) {
      setPlayerType('none');
      return;
    }

    setIsLoading(true);
    setVideoError('');

    // Check if it's a YouTube URL
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = extractYoutubeVideoId(url);
      if (videoId) {
        setYoutubeVideoId(videoId);
        setPlayerType('youtube');
        setIsLoading(false);
        return;
      } else {
        setVideoError('Invalid YouTube URL');
        setPlayerType('none');
        setIsLoading(false);
        return;
      }
    }

    // Check if it's a direct video URL
    if (isDirectVideoUrl(url)) {
      setPlayerType('video');
      loadVideo(url);
      return;
    }

    // If it's neither YouTube nor direct video, show error
    setVideoError('Unsupported or invalid video URL');
    setPlayerType('none');
    setIsLoading(false);
  };

  const loadVideo = (url) => {
    if (!url) return;
    
    setIsLoading(true);
    setVideoError('');
    
    // Destroy existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;
    if (!video) return;

    // Check if it's an HLS stream
    if (url.includes('.m3u8') && Hls.isSupported()) {
      hlsRef.current = new Hls();
      hlsRef.current.loadSource(url);
      hlsRef.current.attachMedia(video);
      
      hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => {
          // Auto-play failed, but video is loaded
          setIsLoading(false);
        });
      });
      
      hlsRef.current.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
        setVideoError('Failed to load HLS stream');
        setIsLoading(false);
      });
    } else {
      // Regular video
      video.src = url;
      video.load();
      
      video.onloadeddata = () => {
        setIsLoading(false);
      };
      
      video.onerror = () => {
        setVideoError('Failed to load video');
        setIsLoading(false);
      };
    }
  };

  const handlePlay = () => {
    if (socket && videoRef.current && playerType === 'video') {
      isUserAction.current = true;
      videoRef.current.play();
      setIsPlaying(true);
      socket.emit('play', roomId);
      setTimeout(() => {
        isUserAction.current = false;
      }, 100);
    }
  };

  const handlePause = () => {
    if (socket && videoRef.current && playerType === 'video') {
      isUserAction.current = true;
      videoRef.current.pause();
      setIsPlaying(false);
      socket.emit('pause', roomId);
      setTimeout(() => {
        isUserAction.current = false;
      }, 100);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !isUserAction.current && playerType === 'video') {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      if (socket && Math.abs(time - currentTime) > 1) {
        socket.emit('syncTime', { roomId, currentTime: time });
      }
    }
  };

  const handleSeek = (e) => {
    if (socket && videoRef.current && playerType === 'video') {
      isUserAction.current = true;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      socket.emit('syncTime', { roomId, currentTime: newTime });
      setTimeout(() => {
        isUserAction.current = false;
      }, 100);
    }
  };

  const handleVideoUrlChange = (e) => {
    const url = e.target.value;
    setVideoUrl(url);
  };

  const handleVideoUrlSubmit = (e) => {
    e.preventDefault();
    if (videoUrl.trim() && socket) {
      socket.emit('setVideoUrl', { roomId, videoUrl: videoUrl.trim() });
      processVideoUrl(videoUrl.trim());
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      const messageData = {
        roomId,
        message: newMessage.trim(),
        username
      };
      
      console.log('Sending message:', messageData);
      socket.emit('message', messageData);
      
      // Clear input immediately
      setNewMessage('');
      
      // Add message to local state for immediate feedback
      const localMessage = {
        message: newMessage.trim(),
        username,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, localMessage]);
    }
  };

  const sendTestMessage = () => {
    if (socket) {
      const testMessage = {
        roomId,
        message: `Test message at ${new Date().toLocaleTimeString()}`,
        username
      };
      
      console.log('Sending test message:', testMessage);
      socket.emit('message', testMessage);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!duration) return 0;
    return (currentTime / duration) * 100;
  };

  const renderPlayer = () => {
    if (playerType === 'youtube') {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&origin=${window.location.origin}`}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video player"
        />
      );
    } else if (playerType === 'video') {
      return (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onPlay={handlePlay}
          onPause={handlePause}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
            }
          }}
          onError={() => {
            setVideoError('Failed to load video');
            setIsLoading(false);
          }}
        >
          Your browser does not support the video tag.
        </video>
      );
    } else {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <div className="text-center">
            <div className="text-gray-400 text-lg mb-4">
              {videoError || 'Enter a video URL to start watching'}
            </div>
            <div className="text-gray-500 text-sm">
              Supported formats: YouTube, MP4, WebM, OGG, MKV, HLS (.m3u8)
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-6">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-1 sm:space-x-2 text-gray-300 hover:text-white transition-colors duration-200 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-700/50"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Back to Home</span>
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <h1 className="text-lg sm:text-xl font-bold text-white">Room: {roomId}</h1>
                <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 bg-gray-700/50 rounded-full">
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} shadow-sm`}></div>
                  <span className="text-xs sm:text-sm text-gray-300">
                    {userCount} user{userCount !== 1 ? 's' : ''} online
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* Video Section */}
        <div className="flex-1 flex flex-col min-h-0 order-1 lg:order-1">
          {/* Video URL Input */}
          <div className="bg-gray-800/60 backdrop-blur-sm border-b border-gray-700/50 shadow-sm">
            <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
              <form onSubmit={handleVideoUrlSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-y-2 sm:gap-y-0 gap-x-0 sm:gap-x-3">
                <div className="flex-1 relative">
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={handleVideoUrlChange}
                    placeholder="Enter YouTube URL or direct video URL (MP4, WebM, OGG, MKV, HLS .m3u8)"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700/80 border border-gray-600/50 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm text-sm sm:text-base"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg sm:rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap text-sm sm:text-base"
                >
                  Load Video
                </button>
              </form>
              {videoError && (
                <div className="mt-2 sm:mt-3 px-3 sm:px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs sm:text-sm">
                  {videoError}
                </div>
              )}
            </div>
          </div>

          {/* Video Player Container */}
          <div className="flex-1 relative bg-black rounded-none sm:rounded-lg m-2 sm:m-4 shadow-2xl overflow-hidden" ref={videoContainerRef} onMouseMove={handleMouseMove} onClick={() => setShowControls(true)}>
            {renderPlayer()}

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                  <div className="loading-spinner"></div>
                  <div className="text-white text-base sm:text-lg font-medium">Loading video...</div>
                </div>
              </div>
            )}

            {/* Video Controls Overlay - Only for direct video files */}
            {playerType === 'video' && (
              <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 sm:p-6 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {/* Progress Bar */}
                <div 
                  className="w-full h-2 sm:h-3 bg-gray-700/50 rounded-full cursor-pointer mb-3 sm:mb-4 progress-bar backdrop-blur-sm"
                  onClick={handleSeek}
                >
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-100 progress-fill shadow-sm"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 sm:space-x-6">
                    <button
                      onClick={isPlaying ? handlePause : handlePlay}
                      className="text-white hover:text-blue-400 transition-colors duration-200 transform hover:scale-110"
                    >
                      {isPlaying ? (
                        <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <span className="text-white text-sm sm:text-lg font-medium">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* YouTube Player Info */}
            {playerType === 'youtube' && (
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-black/80 backdrop-blur-sm text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-lg">
                YouTube Video
              </div>
            )}
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-full lg:w-96 bg-gray-800/80 backdrop-blur-sm border-t lg:border-t-0 lg:border-l border-gray-700/50 flex flex-col shadow-xl order-2 lg:order-2">
          <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-gray-700/50 flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <h3 className="text-lg sm:text-xl font-bold text-white">Chat</h3>
              <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 bg-gray-700/50 rounded-full">
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} shadow-sm`}></div>
                <span className="text-xs text-gray-300">Live</span>
              </div>
            </div>
          </div>

          {/* Debug Info - Remove in production */}
          <div className="px-3 sm:px-6 py-2 sm:py-3 bg-gray-900/50 border-b border-gray-700/50 text-xs text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Socket:</span>
              <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Messages:</span>
              <span className="text-blue-400">{messages.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Username:</span>
              <span className="text-purple-400 truncate ml-2">{username}</span>
            </div>
            <button 
              onClick={sendTestMessage}
              className="w-full mt-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600/80 hover:bg-blue-700/80 text-white text-xs rounded-lg hover:shadow-md transition-all duration-200"
            >
              Send Test Message
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col">
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 chat-scrollbar"
              >
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-6 sm:py-8">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gray-700/50 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="text-gray-400 font-medium text-sm sm:text-base">No messages yet</div>
                    <div className="text-gray-500 text-xs sm:text-sm">Start the conversation!</div>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div key={index} className="bg-gray-700/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-600/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm font-semibold text-blue-400 truncate">
                          {msg.username}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full flex-shrink-0">
                          {msg.timestamp}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-200 leading-relaxed break-words">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={sendMessage} className="p-3 sm:p-6 border-t border-gray-700/50 bg-gray-800/30">
                <div className="flex items-center gap-x-2 sm:gap-x-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700/80 border border-gray-600/50 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm text-sm sm:text-base"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg sm:rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none whitespace-nowrap text-sm sm:text-base"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchRoom; 
