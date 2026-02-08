import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';
import Settings from './pages/Settings';
import ModManager from './pages/ModManager';
import DeckManager from './pages/DeckManager';
import DungeonGenerator from './pages/DungeonGenerator';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/game/:roomId" element={<GameRoom />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/mods" element={<ModManager />} />
          <Route path="/decks" element={<DeckManager />} />
          <Route path="/dungeon" element={<DungeonGenerator />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
