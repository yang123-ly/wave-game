import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import JumpGamePage from './pages/JumpGamePage';
import WaveGamePage from './pages/WaveGamePage';
import ProfilePage from './pages/ProfilePage';
import ResultPage from './pages/ResultPage';
import LeaderboardPage from './pages/LeaderboardPage';
import PetsPage from './pages/PetsPage';
import PetDetailPage from './pages/PetDetailPage';
import BoardConfigPage from './pages/BoardConfigPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/lobby" element={<ProtectedRoute><LobbyPage /></ProtectedRoute>} />
      <Route path="/game/:roomId" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
      <Route path="/jump/:roomId" element={<ProtectedRoute><JumpGamePage /></ProtectedRoute>} />
      <Route path="/wave/:roomId" element={<ProtectedRoute><WaveGamePage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/result/:sessionId" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
      <Route path="/pets" element={<ProtectedRoute><PetsPage /></ProtectedRoute>} />
      <Route path="/pets/:id" element={<ProtectedRoute><PetDetailPage /></ProtectedRoute>} />
      <Route path="/config" element={<ProtectedRoute><BoardConfigPage /></ProtectedRoute>} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="app">
        <AppRoutes />
      </div>
    </AuthProvider>
  );
};

export default App;
