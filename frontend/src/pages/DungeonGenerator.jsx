import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function DungeonGeneratorPage() {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [dungeon, setDungeon] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // 生成选项
  const [options, setOptions] = useState({
    name: '',
    level: 1,
    floors: 3,
    roomsPerFloor: 10,
    theme: 'generic',
    size: 'medium'
  });

  const [themes, setThemes] = useState([]);

  // 加载主题
  useEffect(() => {
    axios.get(`${API_URL}/api/dungeons/themes`)
      .then(res => setThemes(res.data))
      .catch(console.error);
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await axios.post(`${API_URL}/api/dungeons/generate`, options);
      setDungeon(response.data);
      setSelectedFloor(0);
    } catch (error) {
      console.error('Failed to generate dungeon:', error);
      alert('生成失败: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    if (!dungeon) return;

    const dataStr = JSON.stringify(dungeon, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${dungeon.name.replace(/\s+/g, '_')}.json`;
    link.click();
  };

  const renderFloorMap = (floor) => {
    if (!floor || !floor.rooms) return null;

    const gridSize = 20; // 20x20 网格
    const cellSize = 20; // 每个格子的像素大小

    return (
      <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
        <svg
          width={gridSize * cellSize}
          height={gridSize * cellSize}
          className="border border-gray-700"
        >
          {/* 绘制房间 */}
          {floor.rooms.map((room) => (
            <g key={room.id}>
              {/* 房间背景 */}
              <rect
                x={room.x * cellSize}
                y={room.y * cellSize}
                width={room.width * cellSize}
                height={room.height * cellSize}
                fill={getRoomTypeColor(room.type)}
                stroke="#4B5563"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80"
                onClick={() => setSelectedRoom(room)}
              />

              {/* 房间标签 */}
              <text
                x={(room.x + room.width / 2) * cellSize}
                y={(room.y + room.height / 2) * cellSize}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-white pointer-events-none"
              >
                {room.type.substring(0, 3).toUpperCase()}
              </text>

              {/* 连接线 */}
              {room.connections?.map((conn, index) => {
                const fromRoom = floor.rooms.find(r => r.id === room.id);
                const toRoom = floor.rooms.find(r => r.id === conn.to);
                if (!fromRoom || !toRoom) return null;

                const x1 = (fromRoom.x + fromRoom.width / 2) * cellSize;
                const y1 = (fromRoom.y + fromRoom.height / 2) * cellSize;
                const x2 = (toRoom.x + toRoom.width / 2) * cellSize;
                const y2 = (toRoom.y + toRoom.height / 2) * cellSize;

                return (
                  <line
                    key={index}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#9CA3AF"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                );
              })}
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const getRoomTypeColor = (type) => {
    const colors = {
      combat: '#EF4444',
      treasure: '#F59E0B',
      puzzle: '#8B5CF6',
      rest: '#10B981',
      special: '#EC4899'
    };
    return colors[type] || '#6B7280';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white mb-2"
          >
            ← 返回大厅
          </button>
          <h1 className="text-3xl font-bold">地下城生成器</h1>
          <p className="text-gray-400 mt-1">程序化生成自定义地下城</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {!dungeon ? (
          /* 配置面板 */
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">地下城配置</h2>

              <div className="space-y-4">
                {/* 名称 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    地下城名称
                  </label>
                  <input
                    type="text"
                    value={options.name}
                    onChange={(e) => setOptions({ ...options, name: e.target.value })}
                    placeholder="例如：暗黑深渊"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                  />
                </div>

                {/* 等级 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    冒险等级: {options.level}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={options.level}
                    onChange={(e) => setOptions({ ...options, level: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* 楼层数 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    楼层数: {options.floors}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={options.floors}
                    onChange={(e) => setOptions({ ...options, floors: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* 每层房间数 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    每层房间数: {options.roomsPerFloor}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={options.roomsPerFloor}
                    onChange={(e) => setOptions({ ...options, roomsPerFloor: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* 主题 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    地下城主题
                  </label>
                  <select
                    value={options.theme}
                    onChange={(e) => setOptions({ ...options, theme: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                  >
                    <option value="generic">通用地下城</option>
                    <option value="goblin_caves">哥布林洞穴</option>
                    <option value="ancient_tomb">古代陵墓</option>
                  </select>
                </div>

                {/* 大小 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    地下城大小
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['small', 'medium', 'large', 'huge'].map((size) => (
                      <button
                        key={size}
                        onClick={() => setOptions({ ...options, size })}
                        className={`py-2 rounded-lg ${
                          options.size === size
                            ? 'bg-dnd-purple'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        {size === 'small' && '小'}
                        {size === 'medium' && '中'}
                        {size === 'large' && '大'}
                        {size === 'huge' && '超大'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 生成按钮 */}
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full py-4 bg-dnd-purple hover:bg-dnd-purple-dark disabled:bg-gray-600 rounded-lg text-lg font-semibold"
                >
                  {generating ? '生成中...' : '🏰 生成地下城'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 地下城展示 */
          <div>
            {/* 地下城信息 */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">{dungeon.name}</h2>
                  <p className="text-gray-400 mt-1">
                    等级 {dungeon.level} • {dungeon.floors.length} 层 • {dungeon.theme}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDungeon(null)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    重新生成
                  </button>
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-dnd-purple hover:bg-dnd-purple-dark rounded-lg"
                  >
                    导出 JSON
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 楼层列表 */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-xl font-semibold mb-4">楼层</h3>
                <div className="space-y-2">
                  {dungeon.floors.map((floor, index) => (
                    <div
                      key={floor.id}
                      onClick={() => setSelectedFloor(index)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedFloor === index
                          ? 'bg-dnd-purple'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <div className="font-semibold">第 {floor.floorNumber} 层</div>
                      <div className="text-sm text-gray-300">
                        {floor.rooms?.length || 0} 个房间
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 地图 */}
              <div className="lg:col-span-2">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">
                      第 {dungeon.floors[selectedFloor]?.floorNumber} 层地图
                    </h3>
                    <div className="flex gap-2 text-sm">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-red-500 rounded"></span> 战斗
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-yellow-500 rounded"></span> 宝藏
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-purple-500 rounded"></span> 谜题
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-green-500 rounded"></span> 休息
                      </span>
                    </div>
                  </div>

                  {renderFloorMap(dungeon.floors[selectedFloor])}
                </div>

                {/* 房间详情 */}
                {selectedRoom && (
                  <div className="bg-gray-800 rounded-lg p-4 mt-4">
                    <h3 className="text-xl font-semibold mb-3">
                      {selectedRoom.type.charAt(0).toUpperCase() + selectedRoom.type.slice(1)} 房间
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">位置:</span>{' '}
                        {selectedRoom.x}, {selectedRoom.y}
                      </div>
                      <div>
                        <span className="text-gray-400">大小:</span>{' '}
                        {selectedRoom.width} x {selectedRoom.height}
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400">描述:</span>{' '}
                        {selectedRoom.description}
                      </div>
                      {selectedRoom.contents && selectedRoom.contents.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-gray-400">内容:</span>
                          <ul className="list-disc list-inside mt-1">
                            {selectedRoom.contents.map((item, index) => (
                              <li key={index}>
                                {item.type === 'monster' && `🐺 ${item.name}`}
                                {item.type === 'treasure' && '💎 宝物'}
                                {item.type === 'puzzle' && '🧩 谜题'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedRoom(null)}
                      className="mt-3 text-sm text-dnd-purple hover:underline"
                    >
                      关闭详情
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
