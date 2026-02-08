import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import ModLoader from './core/ModLoader.js';
import CardSystem from './core/CardSystem.js';
import DungeonGenerator from './core/DungeonGenerator.js';
import * as ModAPI from './api/mods.js';
import * as ContentAPI from './api/content.js';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Mod Loader
try {
  await ModLoader.initialize();
} catch (error) {
  console.warn('Mod loading failed (non-critical):', error.message);
}

// Initialize Card System
CardSystem.createPrebuiltDecks();

// Initialize Dungeon Generator themes
DungeonGenerator.registerDungeonTheme('generic', {
  name: 'Generic Dungeon',
  description: 'Standard dungeon theme',
  roomTypes: ['combat', 'treasure', 'puzzle', 'rest'],
  atmosphere: 'dark',
  lighting: 'torches'
});

DungeonGenerator.registerDungeonTheme('goblin_caves', {
  name: 'Goblin Caves',
  description: 'Natural caves inhabited by goblins',
  roomTypes: ['combat', 'treasure', 'rest'],
  atmosphere: 'cramped',
  lighting: 'dim'
});

DungeonGenerator.registerDungeonTheme('ancient_tomb', {
  name: 'Ancient Tomb',
  description: 'Undead-infested tomb',
  roomTypes: ['combat', 'puzzle', 'treasure', 'special'],
  atmosphere: 'eerie',
  lighting: 'magical'
});

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AI Dungeon Master Backend is running',
    version: '1.0.0'
  });
});

// Settings API routes
app.get('/api/settings', (req, res) => {
  res.json({
    api_url: 'https://api.openai.com/v1',
    model: 'gpt-4',
    temperature: '0.7',
    max_tokens: '2000'
  });
});

app.post('/api/settings', (req, res) => {
  res.json({ success: true, message: 'Settings updated (demo mode)' });
});

// Room API routes (simplified - no database)
app.post('/api/rooms', (req, res) => {
  const { name } = req.body;
  const room = {
    id: Date.now().toString(36),
    name: name || 'New Room',
    status: 'active',
    created_at: new Date().toISOString()
  };
  res.json(room);
});

app.get('/api/rooms/:roomId/messages', (req, res) => {
  res.json([]);
});

// Mod management routes
app.get('/api/mods', (req, res) => {
  try {
    const mods = ModAPI.getAllMods();
    res.json(mods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/mods/:modId', (req, res) => {
  try {
    const { modId } = req.params;
    const mod = ModAPI.getMod(modId);
    if (!mod) {
      return res.status(404).json({ error: 'Mod not found' });
    }
    res.json(mod);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/mods/:modId/enable', (req, res) => {
  try {
    const { modId } = req.params;
    ModAPI.enableMod(modId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/mods/:modId/disable', (req, res) => {
  try {
    const { modId } = req.params;
    ModAPI.disableMod(modId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// System status route
app.get('/api/system/status', (req, res) => {
  try {
    const status = ModAPI.getSystemStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// i18n routes
app.get('/api/i18n/locales', (req, res) => {
  try {
    const locales = ModAPI.getAvailableLocales();
    res.json(locales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruleset routes
app.get('/api/rulesets', (req, res) => {
  try {
    const rulesets = ModAPI.getAvailableRulesets();
    res.json(rulesets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Data routes
app.get('/api/data/stats', (req, res) => {
  try {
    const stats = ModAPI.getDataStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/data/:type/search', (req, res) => {
  try {
    const { type } = req.params;
    const { q } = req.query;
    const results = ModAPI.searchData(type, q);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/data/:type/:id', (req, res) => {
  try {
    const { type, id } = req.params;
    const item = ModAPI.getDataItem(type, id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Card System routes
app.get('/api/cards/types', (req, res) => {
  try {
    const types = ContentAPI.getCardTypes();
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cards/decks', (req, res) => {
  try {
    const decks = ContentAPI.getAllDecks();
    res.json(decks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cards/decks/:deckId/create', (req, res) => {
  try {
    const { deckId } = req.params;
    const { ownerId } = req.body;
    const instance = ContentAPI.createDeckInstance(deckId, ownerId);
    res.json(instance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cards/decks/:instanceId/draw', (req, res) => {
  try {
    const { instanceId } = req.params;
    const { count = 1 } = req.body;
    const cards = ContentAPI.drawCard(instanceId, count);
    res.json({ cards });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cards/search', (req, res) => {
  try {
    const { type, q } = req.query;
    if (!type || !q) {
      return res.status(400).json({ error: 'Missing type or query' });
    }
    const cards = ContentAPI.searchCards(type, q);
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dungeon Generator routes
app.post('/api/dungeons/generate', (req, res) => {
  try {
    const dungeon = ContentAPI.generateDungeon(req.body);
    res.json(dungeon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dungeons/room-types', (req, res) => {
  try {
    const types = ContentAPI.getRoomTypes();
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dungeons/themes', (req, res) => {
  try {
    const themes = ContentAPI.getDungeonThemes();
    res.json(themes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.currentRoom = null;

  socket.on('join_room', ({ roomId, playerName }) => {
    socket.currentRoom = roomId;
    socket.join(roomId);
    console.log(`${playerName} joined room: ${roomId}`);

    socket.to(roomId).emit('player_joined', {
      playerId: socket.id,
      playerName: playerName,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('leave_room', () => {
    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
      socket.to(socket.currentRoom).emit('player_left', {
        playerId: socket.id,
        timestamp: new Date().toISOString()
      });
      socket.currentRoom = null;
    }
  });

  socket.on('send_message', async (data) => {
    const { roomId, playerId, playerName, content } = data;

    console.log(`Message from ${playerName} in room ${roomId}:`, content);

    // Broadcast player message
    const messageId = Date.now().toString(36);
    io.to(roomId).emit('new_message', {
      id: messageId,
      roomId,
      senderId: playerId,
      senderName: playerName,
      content,
      type: 'speech',
      timestamp: new Date().toISOString()
    });

    // Simulated DM response (demo mode)
    setTimeout(() => {
      io.to(roomId).emit('new_message', {
        id: Date.now().toString(36),
        roomId,
        senderId: null,
        senderName: 'DM',
        content: `[Demo] ${playerName} 行动后...（配置 LLM 后将获得真实响应）`,
        type: 'narrative',
        timestamp: new Date().toISOString()
      });
    }, 1000);
  });

  socket.on('roll_dice', (data) => {
    const { roomId, playerName, roll } = data;
    console.log(`Dice roll from ${playerName}:`, roll);

    io.to(roomId).emit('dice_result', {
      playerId: data.playerId,
      playerName,
      roll,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    if (socket.currentRoom) {
      socket.to(socket.currentRoom).emit('player_left', {
        playerId: socket.id,
        timestamp: new Date().toISOString()
      });
    }
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎮 AI Dungeon Master Backend running on port ${PORT}`);
  console.log(`📡 Socket.io server ready for connections`);
  console.log(`🌐 API available at http://localhost:${PORT}`);
  console.log(`\n⚠️  Demo mode: Database disabled, some features limited`);
});

export { io };
