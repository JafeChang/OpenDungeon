import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Simple UUID generator
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export default function Lobby() {
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!playerName.trim() || !roomName.trim()) return;

    const roomId = generateId();
    // Store player name in localStorage
    localStorage.setItem('playerName', playerName);
    localStorage.setItem('roomName', roomName);

    navigate(`/game/${roomId}`);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!playerName.trim() || !roomName.trim()) return;

    // Store player name
    localStorage.setItem('playerName', playerName);

    // In a real implementation, we'd have a room list to select from
    // For now, just show an alert
    alert('房间列表功能将在后续版本实现。请先创建一个房间。');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-dnd-purple mb-2">
            AI Dungeon Master
          </h1>
          <p className="text-gray-400">D&D 5e Tabletop RPG Platform</p>
        </div>

        {/* Player Name Input */}
        <div className="bg-gray-800 rounded-lg p-6 mb-4 shadow-lg">
          <label htmlFor="playerName" className="block text-sm font-medium text-gray-300 mb-2">
            角色名称
          </label>
          <input
            type="text"
            id="playerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="输入你的角色名称"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-dnd-purple focus:border-transparent text-white placeholder-gray-400"
          />
        </div>

        {/* Create Room */}
        <form onSubmit={handleCreateRoom} className="bg-gray-800 rounded-lg p-6 mb-4 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">创建新房间</h2>
          <div className="mb-4">
            <label htmlFor="roomName" className="block text-sm font-medium text-gray-300 mb-2">
              房间名称
            </label>
            <input
              type="text"
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="例如：迷雾森林冒险"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-dnd-purple focus:border-transparent text-white placeholder-gray-400"
            />
          </div>
          <button
            type="submit"
            disabled={!playerName.trim() || !roomName.trim()}
            className="w-full py-3 bg-dnd-purple hover:bg-dnd-purple-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            创建房间
          </button>
        </form>

        {/* Join Room */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">加入房间</h2>
          <button
            onClick={handleJoinRoom}
            disabled={!playerName.trim()}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            查看房间列表
          </button>
        </div>

        {/* Settings Link */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <a
            href="/settings"
            className="text-dnd-purple hover:text-dnd-purple-dark text-sm text-center py-2 bg-gray-800 rounded-lg"
          >
            ⚙️ AI 设置
          </a>
          <a
            href="/mods"
            className="text-dnd-purple hover:text-dnd-purple-dark text-sm text-center py-2 bg-gray-800 rounded-lg"
          >
            🧩 模组管理
          </a>
          <a
            href="/decks"
            className="text-dnd-purple hover:text-dnd-purple-dark text-sm text-center py-2 bg-gray-800 rounded-lg"
          >
            🃏 卡组管理
          </a>
          <a
            href="/dungeon"
            className="text-dnd-purple hover:text-dnd-purple-dark text-sm text-center py-2 bg-gray-800 rounded-lg"
          >
            🏰 生成地下城
          </a>
        </div>
      </div>
    </div>
  );
}
