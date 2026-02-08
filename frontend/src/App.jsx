import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';
import Settings from './pages/Settings';
import ModManager from './pages/ModManager';
import DeckManager from './pages/DeckManager';
import DungeonGenerator from './pages/DungeonGenerator';
import LoginPage from './pages/LoginPage';

// Protected Route component
function ProtectedRoute({ children, requireAuth = true }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Guest users (not logged in) can access lobby but with limited features
  const isGuest = !isAuthenticated;

  if (requireAuth && isGuest) {
    return <Navigate to="/login" replace />;
  }

  // Pass guest status to children
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-900">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
              <ProtectedRoute requireAuth={false}>
                <Lobby />
              </ProtectedRoute>
            } />
            <Route path="/game/:roomId" element={
              <ProtectedRoute requireAuth={true}>
                <GameRoom />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute requireAuth={true}>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/mods" element={
              <ProtectedRoute requireAuth={true}>
                <ModManager />
              </ProtectedRoute>
            } />
            <Route path="/decks" element={
              <ProtectedRoute requireAuth={false}>
                <DeckManager />
              </ProtectedRoute>
            } />
            <Route path="/dungeon" element={
              <ProtectedRoute requireAuth={false}>
                <DungeonGenerator />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
