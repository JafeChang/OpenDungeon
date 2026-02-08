import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Dungeon Master Backend is running' });
});

// Mock data APIs
app.get('/api/mods', (req, res) => {
  res.json([]);
});

app.get('/api/cards/decks', (req, res) => {
  res.json([
    {
      id: 'starter_equipment',
      name: '初学者装备',
      description: '基本冒险装备',
      cards: [
        { type: 'items', id: 'item_sword', name: '长剑' },
        { type: 'items', id: 'item_potion', name: '生命药水' }
      ]
    }
  ]);
});

app.get('/api/cards/types', (req, res) => {
  res.json([
    { type: 'item', name: 'Item' },
    { type: 'spell', name: 'Spell' },
    { type: 'monster', name: 'Monster' }
  ]);
});

app.post('/api/dungeons/generate', (req, res) => {
  const dungeon = {
    id: Date.now().toString(),
    name: req.body.name || 'Generated Dungeon',
    level: req.body.level || 1,
    floors: [
      {
        id: 'floor_1',
        floorNumber: 1,
        rooms: [
          { id: 'room1', type: 'combat', x: 5, y: 5, width: 4, height: 4, description: 'A combat room' },
          { id: 'room2', type: 'treasure', x: 12, y: 5, width: 3, height: 3, description: 'A treasure room' }
        ]
      }
    ]
  };
  res.json(dungeon);
});

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_room', ({ roomId, playerName }) => {
    socket.join(roomId);
    console.log(`${playerName} joined room: ${roomId}`);
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
        id: Date.now().toString(),
        senderName: 'DM',
        content: `[演示模式] ${playerName} 的行动：${content}`,
        type: 'narrative',
        timestamp: new Date().toISOString()
      });
    }, 1000);
  });
});

const PORT = 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎮 AI Dungeon Master Backend running on port ${PORT}`);
  console.log(`📡 Socket.io server ready`);
  console.log(`🌐 API: http://localhost:${PORT}`);
  console.log(`\n⚠️  演示模式 - 仅测试基础功能\n`);
});
