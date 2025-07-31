import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import WatchRoom from './components/WatchRoom';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-gray-900 text-white">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:roomId" element={<WatchRoom />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 