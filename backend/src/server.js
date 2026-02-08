import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { initializeDatabase } from './config/database.js';
import { generateDMResponse, getCurrentLLMConfig, setLLMConfig } from './api/llm.js';
import { register, login, getUserById, updateUser, changePassword } from './api/auth.js';
import { authenticate, optionalAuth, requireRole } from './middleware/auth.js';
import { getDatabase } from './config/database.js';

const app = express();
const httpServer = createServer(app);

// Trust proxy for getting correct IP
app.set('trust proxy', true);

// Initialize database
initializeDatabase();

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

// ===== Authentication Routes =====

// Register
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = register(username, email, password, req);
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = login(username, password);
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Update user profile
app.put('/api/auth/me', authenticate, (req, res) => {
  try {
    const user = updateUser(req.userId, req.body);
    res.json({ user, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Change password
app.post('/api/auth/change-password', authenticate, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    changePassword(req.userId, currentPassword, newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ===== Rooms API =====

// Get all rooms (guest can view)
app.get('/api/rooms', optionalAuth, (req, res) => {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, name, status, language, created_at, updated_at
    FROM rooms
    WHERE status = 'active'
    ORDER BY updated_at DESC
  `);
  const rooms = stmt.all();
  res.json({ rooms });
});

// Get room by ID
app.get('/api/rooms/:roomId', optionalAuth, (req, res) => {
  const { roomId } = req.params;
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, name, status, language, created_at, updated_at
    FROM rooms
    WHERE id = ? AND status = 'active'
  `);
  const room = stmt.get(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.json({ room });
});

// Update room language
app.patch('/api/rooms/:roomId', authenticate, requireRole('player'), (req, res) => {
  try {
    const { roomId } = req.params;
    const { language } = req.body;

    if (!language || !['en', 'zh', 'ja'].includes(language)) {
      return res.status(400).json({ error: 'Invalid language. Must be one of: en, zh, ja' });
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE rooms
      SET language = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(language, roomId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ message: 'Room language updated', language });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Create room (player and above)
app.post('/api/rooms', authenticate, requireRole('player'), (req, res) => {
  try {
    const { name, language = 'en' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    const db = getDatabase();
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stmt = db.prepare(`
      INSERT INTO rooms (id, name, status, language, created_at, updated_at)
      VALUES (?, ?, 'active', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    stmt.run(roomId, name.trim(), language);

    res.status(201).json({
      message: 'Room created successfully',
      room: { id: roomId, name: name.trim(), language }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Delete room (admin only)
app.delete('/api/rooms/:roomId', authenticate, requireRole('admin'), (req, res) => {
  try {
    const { roomId } = req.params;
    const db = getDatabase();

    const stmt = db.prepare('DELETE FROM rooms WHERE id = ?');
    const result = stmt.run(roomId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// Settings (GET - all authenticated users can view)
app.get('/api/settings', authenticate, (req, res) => {
  const config = getCurrentLLMConfig();
  res.json({
    api_url: config.api_url || 'https://api.openai.com/v1',
    model: config.model || 'gpt-4',
    temperature: config.temperature || '0.7',
    max_tokens: config.max_tokens || '2000'
  });
});

// Update settings (POST - admin only)
app.post('/api/settings', authenticate, requireRole('admin'), (req, res) => {
  try {
    const { api_url, api_key, model, temperature, max_tokens } = req.body;
    const updates = {};

    if (api_url) updates.api_url = api_url;
    if (api_key) updates.api_key = api_key;
    if (model) updates.model = model;
    if (temperature) updates.temperature = temperature;
    if (max_tokens) updates.max_tokens = max_tokens;

    setLLMConfig(updates);
    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get room messages history
app.get('/api/rooms/:roomId/messages', optionalAuth, (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const db = getDatabase();

    const stmt = db.prepare(`
      SELECT m.id, m.sender_id as senderId, p.name as senderName, m.content, m.type, m.metadata, m.timestamp
      FROM messages m
      LEFT JOIN players p ON m.sender_id = p.id
      WHERE m.room_id = ?
      ORDER BY m.timestamp ASC
      LIMIT ?
    `);

    const messages = stmt.all(roomId, limit);

    // Parse metadata JSON if exists
    const parsedMessages = messages.map(msg => ({
      ...msg,
      ...(msg.metadata && { metadata: JSON.parse(msg.metadata) }),
      // Remove metadata after parsing to avoid duplication
      metadata: undefined
    }));

    res.json({ messages: parsedMessages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Save message to database (for AI responses)
app.post('/api/rooms/:roomId/messages', authenticate, (req, res) => {
  try {
    const { roomId } = req.params;
    const { id, content, type } = req.body;
    const db = getDatabase();

    if (!id || !content || !type) {
      return res.status(400).json({ error: 'id, content, and type are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO messages (id, room_id, sender_id, content, type, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, roomId, null, content, type, new Date().toISOString());

    res.json({ success: true });
  } catch (error) {
    console.error('Save message error:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// AI DM Chat
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context = {} } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await generateDMResponse(message, context);
    res.json(response);
  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({
      error: 'Failed to generate AI response',
      message: error.message,
      hint: 'Please check your API credentials in settings'
    });
  }
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

    // Create or get player record
    try {
      const db = getDatabase();

      // Check if player already exists in this room
      const existingPlayer = db.prepare(`
        SELECT id FROM players WHERE room_id = ? AND name = ?
      `).get(roomId, playerName);

      let playerId;
      if (existingPlayer) {
        playerId = existingPlayer.id;
      } else {
        // Create new player record
        playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        db.prepare(`
          INSERT INTO players (id, room_id, name, type)
          VALUES (?, ?, ?, ?)
        `).run(playerId, roomId, playerName, 'human');
      }

      // Store player info in socket for later use
      socket.playerId = playerId;
      socket.playerName = playerName;
      socket.roomId = roomId;
    } catch (error) {
      console.error('Error creating player record:', error);
    }
  });

  socket.on('send_message', (data) => {
    const { roomId, playerName, content } = data;
    const messageId = Date.now().toString();
    const timestamp = new Date().toISOString();

    const messageData = {
      id: messageId,
      senderName: playerName,
      content,
      type: 'speech',
      timestamp
    };

    // Broadcast to room
    io.to(roomId).emit('new_message', messageData);

    // Save to database
    try {
      const db = getDatabase();

      // Get player ID
      const player = db.prepare(`
        SELECT id FROM players WHERE room_id = ? AND name = ?
      `).get(roomId, playerName);

      if (player) {
        const stmt = db.prepare(`
          INSERT INTO messages (id, room_id, sender_id, content, type, timestamp)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run(messageId, roomId, player.id, content, 'speech', timestamp);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('dm_response', (data) => {
    const { roomId, message } = data);
    // Broadcast to other players in room (not sender)
    socket.to(roomId).emit('dm_response', { message });
  });
});

const PORT = 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Backend running on port ${PORT}`);
});

export { io };
