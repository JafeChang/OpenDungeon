import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Simple UUID generator
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export default function Lobby() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [playerName, setPlayerName] = useState(user?.username || '');
  const [roomName, setRoomName] = useState('');
  const [language, setLanguage] = useState('zh');
  const [rooms, setRooms] = useState([]);

  // Fetch rooms for guest viewing
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/api/rooms`, { headers });
      setRooms(response.data.rooms);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || !roomName.trim()) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(`${API_URL}/api/rooms`,
        { name: roomName.trim(), language },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const roomId = response.data.room.id;
      localStorage.setItem('playerName', playerName);
      localStorage.setItem('roomName', roomName);
      localStorage.setItem('roomLanguage', language);

      navigate(`/game/${roomId}`);
    } catch (error) {
      console.error('Failed to create room:', error);
      const errorMsg = error.response?.data?.error || 'Failed to create room';

      if (errorMsg.includes('Authentication')) {
        alert('请先登录以创建房间');
        navigate('/login');
      } else if (errorMsg.includes('Insufficient permissions')) {
        alert('权限不足：需要登录后才能创建房间');
      } else {
        alert(errorMsg);
      }
    }
  };

  const handleJoinRoom = (roomId) => {
    if (!isAuthenticated) {
      alert('请先登录以加入房间');
      navigate('/login');
      return;
    }

    localStorage.setItem('playerName', playerName);
    navigate(`/game/${roomId}`);
  };

  const handleCreateRoomAsGuest = () => {
    alert('访客模式不支持创建房间。请先注册或登录。');
    navigate('/login');
  };

  const canCreateRoom = isAuthenticated && (user?.role === 'admin' || user?.role === 'player');
  const canJoinAsPlayer = isAuthenticated;
  const canJoinAsSpectator = true; // Everyone can spectate

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-dnd-purple-dark to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-dnd-purple">
              AI Dungeon Master
            </h1>
            <p className="text-gray-400">D&D 5e Tabletop RPG Platform</p>
            {!isAuthenticated && (
              <p className="text-sm text-yellow-400 mt-1">
                🎭 访客模式 - 可以浏览房间，登录后即可游玩
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="text-right">
                  <p className="text-white font-medium">{user.username}</p>
                  <p className="text-sm text-gray-400">
                    {user?.role === 'admin' && '👑 管理员'}
                    {user?.role === 'player' && '⚔️ 玩家'}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 bg-dnd-purple hover:bg-dnd-purple-dark text-white font-semibold rounded-lg transition-colors"
              >
                Login / Register
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Create Room */}
          <div>
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-4">创建房间</h2>

              <form onSubmit={handleCreateRoom}>
                <div className="space-y-4">
                  <div>
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

                  <div>
                    <label htmlFor="roomName" className="block text-sm font-medium text-gray-300 mb-2">
                      房间名称
                    </label>
                    <input
                      type="text"
                      id="roomName"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="例如：地下城探险"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-dnd-purple focus:border-transparent text-white placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-2">
                      DM 语言 / DM Language
                    </label>
                    <select
                      id="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-dnd-purple focus:border-transparent text-white"
                    >
                      <option value="zh">🇨🇳 中文</option>
                      <option value="en">🇺🇸 English</option>
                      <option value="ja">🇯🇵 日本語</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      选择 AI 地下城主使用的语言
                    </p>
                  </div>

                  {canCreateRoom ? (
                    <button
                      type="submit"
                      className="w-full py-3 bg-dnd-purple hover:bg-dnd-purple-dark text-white font-semibold rounded-lg transition-colors"
                    >
                      🏰 创建房间
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreateRoomAsGuest}
                      className="w-full py-3 bg-gray-600 text-gray-400 font-semibold rounded-lg cursor-not-allowed"
                    >
                      🔒 登录后创建房间
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-300">
                  {canCreateRoom ? (
                    <>
                      ✅ 你可以创建和加入房间
                    </>
                  ) : (
                    <>
                      ⚠️ 访客模式：仅可浏览房间，登录后可创建房间和游玩
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Role Guide */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg mt-6">
              <h3 className="text-lg font-semibold text-white mb-3">用户角色说明</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-2xl">👁️</span>
                  <div>
                    <p className="font-medium">访客 (Guest)</p>
                    <p className="text-xs text-gray-400">浏览房间列表，观看游戏</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-2xl">⚔️</span>
                  <div>
                    <p className="font-medium">玩家 (Player)</p>
                    <p className="text-xs text-gray-400">创建房间，加入游戏，使用所有功能</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-2xl">👑</span>
                  <div>
                    <p className="font-medium">管理员 (Admin)</p>
                    <p className="text-xs text-gray-400">所有权限 + 管理用户和房间</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Room List */}
          <div>
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-4">
                游戏房间
                {rooms.length > 0 && (
                  <span className="ml-2 text-sm text-gray-400">({rooms.length})</span>
                )}
              </h2>

              {rooms.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-3">🏰</div>
                  <p>暂无活跃房间</p>
                  <p className="text-sm mt-2">
                    {canCreateRoom ? '创建一个房间开始冒险吧！' : '登录后即可创建房间'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-white">{room.name}</h3>
                            <span className="text-xs px-2 py-1 bg-gray-600 rounded-full">
                              {room.language === 'zh' ? '🇨🇳 中文' : room.language === 'ja' ? '🇯🇵 日本語' : '🇺🇸 English'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">
                            ID: {room.id}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            创建于 {new Date(room.created_at).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        {canJoinAsPlayer ? (
                          <button
                            onClick={() => handleJoinRoom(room.id)}
                            className="px-4 py-2 bg-dnd-purple hover:bg-dnd-purple-dark text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            加入
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              alert('访客模式只能观看，登录后可加入游戏');
                              navigate('/login');
                            }}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-300 rounded-lg text-sm font-medium transition-colors"
                          >
                            观看
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <button
            onClick={() => navigate('/dungeon')}
            className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 text-left transition-colors"
          >
            <div className="text-3xl mb-2">🏰</div>
            <h3 className="text-lg font-semibold text-white">地下城生成器</h3>
            <p className="text-sm text-gray-400">程序化生成冒险地图</p>
          </button>

          <button
            onClick={() => navigate('/decks')}
            className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 text-left transition-colors"
          >
            <div className="text-3xl mb-2">🎴</div>
            <h3 className="text-lg font-semibold text-white">卡组管理器</h3>
            <p className="text-sm text-gray-400">管理游戏卡片和卡组</p>
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/mods')}
              className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 text-left transition-colors"
            >
              <div className="text-3xl mb-2">🧩</div>
              <h3 className="text-lg font-semibold text-white">模组管理</h3>
              <p className="text-sm text-gray-400">管理和安装模组</p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
