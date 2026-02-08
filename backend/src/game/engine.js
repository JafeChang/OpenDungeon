import { getDatabase } from '../config/database.js';
import { generateDMResponse } from '../api/llm.js';

/**
 * Process a player action and generate DM response
 */
export async function processPlayerAction(roomId, playerId, action) {
  const db = getDatabase();

  // Get room state
  const room = getRoomState(db, roomId);
  if (!room) {
    throw new Error('Room not found');
  }

  // Get players in room
  const players = getPlayersInRoom(db, roomId);

  // Get recent messages for context
  const recentMessages = getRecentMessages(db, roomId, 10);

  // Build context for LLM
  const context = {
    roomState: room.world_state ? JSON.parse(room.world_state) : {},
    recentMessages,
    characters: buildCharacterContext(players)
  };

  // Generate DM response
  const dmResponse = await generateDMResponse(action, context);

  // Apply events to character sheets
  const updatedCharacters = applyEvents(dmResponse.events, players, roomId, db);

  // Save DM message to database
  saveMessage(db, {
    id: dmResponse.id,
    roomId,
    senderId: null, // DM messages have no sender
    content: dmResponse.narrative,
    type: 'narrative',
    metadata: JSON.stringify({
      events: dmResponse.events,
      diceRollRequest: dmResponse.diceRollRequest
    })
  });

  // Update room timestamp
  updateRoomTimestamp(db, roomId);

  return {
    dmResponse,
    updatedCharacters
  };
}

/**
 * Get room state from database
 */
function getRoomState(db, roomId) {
  const stmt = db.prepare('SELECT * FROM rooms WHERE id = ?');
  return stmt.get(roomId);
}

/**
 * Get all players in a room
 */
function getPlayersInRoom(db, roomId) {
  const stmt = db.prepare('SELECT * FROM players WHERE room_id = ?');
  return stmt.all(roomId);
}

/**
 * Get recent messages for context
 */
function getRecentMessages(db, roomId, limit = 10) {
  const stmt = db.prepare(`
    SELECT * FROM messages
    WHERE room_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  const messages = stmt.all(roomId, limit);
  return messages.reverse(); // Return in chronological order
}

/**
 * Build character context for LLM
 */
function buildCharacterContext(players) {
  const characters = {};
  players.forEach(player => {
    const characterSheet = player.character_sheet
      ? JSON.parse(player.character_sheet)
      : createDefaultCharacterSheet(player.name);

    characters[player.id] = {
      ...characterSheet,
      isAI: !!player.is_ai,
      persona: player.persona_prompt
    };
  });
  return characters;
}

/**
 * Create a default character sheet for new players
 */
function createDefaultCharacterSheet(name) {
  return {
    name,
    level: 1,
    class: 'Adventurer',
    race: 'Human',
    hp: { current: 10, max: 10, temp: 0 },
    stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
    proficiency_bonus: 2,
    armor_class: 10,
    initiative: 0,
    speed: 30,
    skills: {},
    inventory: [],
    position: { location: 'Unknown', x: 0, y: 0 },
    conditions: []
  };
}

/**
 * Apply DM events to character sheets
 */
function applyEvents(events, players, roomId, db) {
  const updatedCharacters = [];

  if (!events || events.length === 0) {
    return updatedCharacters;
  }

  events.forEach(event => {
    if (event.target === 'all') {
      // Apply to all players
      players.forEach(player => {
        applyEventToCharacter(event, player, db);
        updatedCharacters.push(player.id);
      });
    } else {
      // Apply to specific player
      const player = players.find(p => p.id === event.target);
      if (player) {
        applyEventToCharacter(event, player, db);
        updatedCharacters.push(player.id);
      }
    }
  });

  return updatedCharacters;
}

/**
 * Apply a single event to a character
 */
function applyEventToCharacter(event, player, db) {
  let characterSheet = player.character_sheet
    ? JSON.parse(player.character_sheet)
    : createDefaultCharacterSheet(player.name);

  switch (event.type) {
    case 'hp_change':
      characterSheet.hp.current += event.value;
      // Clamp HP between 0 and max
      characterSheet.hp.current = Math.max(0, Math.min(characterSheet.hp.current, characterSheet.hp.max + characterSheet.hp.temp));
      break;

    case 'condition_add':
      if (!characterSheet.conditions.includes(event.value)) {
        characterSheet.conditions.push(event.value);
      }
      break;

    case 'condition_remove':
      characterSheet.conditions = characterSheet.conditions.filter(c => c !== event.value);
      break;

    case 'item_add':
      characterSheet.inventory.push(event.value);
      break;

    case 'item_remove':
      characterSheet.inventory = characterSheet.inventory.filter(
        item => item.name !== event.value.name
      );
      break;

    default:
      console.warn(`Unknown event type: ${event.type}`);
  }

  // Save updated character sheet
  const stmt = db.prepare('UPDATE players SET character_sheet = ? WHERE id = ?');
  stmt.run(JSON.stringify(characterSheet), player.id);
}

/**
 * Save a message to database
 */
function saveMessage(db, message) {
  const stmt = db.prepare(`
    INSERT INTO messages (id, room_id, sender_id, content, type, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    message.id,
    message.roomId,
    message.senderId,
    message.content,
    message.type,
    message.metadata
  );
}

/**
 * Update room timestamp
 */
function updateRoomTimestamp(db, roomId) {
  const stmt = db.prepare('UPDATE rooms SET updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(roomId);
}

/**
 * Create a new room
 */
export function createRoom(name) {
  const db = getDatabase();
  const id = generateId();

  const stmt = db.prepare(`
    INSERT INTO rooms (id, name, status, world_state)
    VALUES (?, ?, 'active', '{}')
  `);

  stmt.run(id, name);

  return { id, name };
}

/**
 * Add a player to a room
 */
export function addPlayerToRoom(roomId, playerName, isAI = false, personaPrompt = null) {
  const db = getDatabase();
  const id = generateId();

  const characterSheet = JSON.stringify(createDefaultCharacterSheet(playerName));

  const stmt = db.prepare(`
    INSERT INTO players (id, room_id, name, is_ai, character_sheet, persona_prompt, type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, roomId, playerName, isAI ? 1 : 0, characterSheet, personaPrompt, isAI ? 'ai' : 'human');

  return { id, roomId, playerName, isAI };
}

/**
 * Get room by ID
 */
export function getRoom(roomId) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM rooms WHERE id = ?');
  return stmt.get(roomId);
}

/**
 * Get all messages for a room
 */
export function getRoomMessages(roomId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT m.*, p.name as sender_name
    FROM messages m
    LEFT JOIN players p ON m.sender_id = p.id
    WHERE m.room_id = ?
    ORDER BY m.timestamp ASC
  `);
  return stmt.all(roomId);
}

/**
 * Generate unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export default {
  processPlayerAction,
  createRoom,
  addPlayerToRoom,
  getRoom,
  getRoomMessages
};
