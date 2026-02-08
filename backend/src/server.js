import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Dungeon Master Backend is running' });
});

// Settings
app.get('/api/settings', (req, res) => {
  res.json({ api_url: 'https://api.openai.com/v1', model: 'gpt-4' });
});

// Rooms
app.post('/api/rooms', (req, res) => {
  const room = { id: Date.now().toString(36), name: req.body.name || 'Room' };
  res.json(room);
});

// Mods
app.get('/api/mods', (req, res) => res.json([]));

// Cards
app.get('/api/cards/decks', (req, res) => {
  res.json([{
    id: 'starter_equipment',
    name: '初学者装备',
    cards: [{ type: 'items', id: 'sword', name: '长剑' }]
  }]);
});

// Dungeon themes
app.get('/api/dungeons/themes', (req, res) => {
  res.json([
    { id: 'generic', name: '通用地下城', description: '标准的地下城探险' },
    { id: 'goblin_caves', name: '哥布林洞穴', description: '充满哥布林和陷阱的洞穴系统' },
    { id: 'ancient_tomb', name: '古代陵墓', description: '古老的陵墓，充满不死生物和谜题' },
    { id: 'dragon_lair', name: '龙之巢穴', description: '巨龙的居住地，充满财宝和危险' },
    { id: 'forgotten_temple', name: '遗忘神庙', description: '被遗忘的神庙，充满古代魔法' }
  ]);
});

// Dungeon generation
app.post('/api/dungeons/generate', (req, res) => {
  const { name = '未命名地下城', floors = 3, roomsPerFloor = 10, theme = 'generic', level = 1 } = req.body;

  const dungeon = {
    id: Date.now().toString(),
    name,
    level,
    theme,
    floors: []
  };

  // 生成楼层
  for (let i = 0; i < floors; i++) {
    const floorRooms = [];
    const roomTypes = ['combat', 'treasure', 'puzzle', 'rest', 'special'];

    // 生成房间
    for (let j = 0; j < Math.min(roomsPerFloor, 15); j++) {
      const type = roomTypes[Math.floor(Math.random() * roomTypes.length)];
      floorRooms.push({
        id: `floor-${i + 1}-room-${j + 1}`,
        type,
        x: Math.floor(Math.random() * 15),
        y: Math.floor(Math.random() * 15),
        width: Math.floor(Math.random() * 3) + 2,
        height: Math.floor(Math.random() * 3) + 2,
        description: getRoomDescription(type, theme),
        contents: generateRoomContents(type, level)
      });
    }

    // 添加房间连接
    floorRooms.forEach((room, idx) => {
      if (idx < floorRooms.length - 1) {
        room.connections = [{
          to: floorRooms[idx + 1].id,
          type: 'corridor'
        }];
      }
    });

    dungeon.floors.push({
      id: `floor-${i + 1}`,
      floorNumber: i + 1,
      rooms: floorRooms
    });
  }

  res.json(dungeon);
});

function getRoomDescription(type, theme) {
  const descriptions = {
    combat: theme === 'ancient_tomb' ? '古老的墓室，空气中弥漫着死亡气息' : '充满敌意的房间',
    treasure: theme === 'dragon_lair' ? '巨龙财宝的一部分' : '隐藏的宝箱',
    puzzle: '古老的谜题等待着解答',
    rest: '暂时安全的休息区',
    special: theme === 'forgotten_temple' ? '散发着魔法光芒的祭坛' : '特殊的房间'
  };
  return descriptions[type] || '神秘房间';
}

function generateRoomContents(type, level) {
  if (type === 'combat') {
    return [
      { type: 'monster', name: level > 10 ? '远古巨龙' : '哥布林战士', cr: Math.ceil(level / 2) }
    ];
  }
  if (type === 'treasure') {
    return [
      { type: 'treasure', name: '金币', value: level * 10 },
      { type: 'treasure', name: '魔法药水', rarity: 'common' }
    ];
  }
  return [];
}

// Socket.io
io.on('connection', (socket) => {
  socket.on('join_room', ({ roomId, playerName }) => {
    socket.join(roomId);
  });

  socket.on('send_message', (data) => {
    const { roomId, playerName, content } = data;
    io.to(roomId).emit('new_message', {
      id: Date.now().toString(),
      senderName: playerName,
      content,
      type: 'speech',
      timestamp: new Date().toISOString()
    });
    
    // Demo DM response
    setTimeout(() => {
      io.to(roomId).emit('new_message', {
        senderName: 'DM',
        content: `[演示] ${playerName}: ${content}`,
        type: 'narrative',
        timestamp: new Date().toISOString()
      });
    }, 1000);
  });
});

const PORT = 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Backend running on port ${PORT}`);
});

export { io };
