-- AI Dungeon Master Database Schema
-- D&D 5e TTRPG Platform

-- Rooms: Game sessions/campaigns
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- active, paused, archived
  world_state TEXT, -- JSON string containing current game state
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Players: Human and AI players in rooms
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_ai BOOLEAN DEFAULT 0,
  character_sheet TEXT, -- JSON string with D&D 5e character data
  persona_prompt TEXT, -- For AI players: personality description
  type TEXT DEFAULT 'human', -- human, ai
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Messages: All in-game messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  sender_id TEXT, -- NULL for DM (system) messages
  content TEXT NOT NULL,
  type TEXT DEFAULT 'narrative', -- narrative, speech, roll, system
  metadata TEXT, -- JSON string with dice results, state changes, etc.
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES players(id) ON DELETE SET NULL
);

-- Settings: LLM and system configuration
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_players_room_id ON players(room_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
