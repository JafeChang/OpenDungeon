import { getDatabase } from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// Role definitions
export const ROLES = {
  GUEST: 'guest',
  PLAYER: 'player',
  ADMIN: 'admin'
};

/**
 * Check if IP is in admin whitelist (local network)
 */
export function isAdminIP(ip) {
  if (!ip) return false;

  // Check for localhost
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return true;
  }

  // Check for 192.168.*.*
  if (ip.startsWith('192.168.')) {
    return true;
  }

  // Check for Tailscale IP ranges (100.x.x.x, fd7a:115c:a1e0::/48)
  if (ip.startsWith('100.') || ip.startsWith('fd7a:115c:a1e0:')) {
    return true;
  }

  return false;
}

/**
 * Get default role based on request IP
 */
export function getDefaultRole(req) {
  const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0];
  return isAdminIP(ip) ? ROLES.ADMIN : ROLES.PLAYER;
}

/**
 * Register a new user
 */
export function register(username, email, password, req = null) {
  const db = getDatabase();

  // Check if username already exists
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existingUser) {
    throw new Error('Username or email already exists');
  }

  // Hash password
  const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);

  // Determine role based on IP
  const role = getDefaultRole(req);

  // Create user
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const stmt = db.prepare(`
    INSERT INTO users (id, username, email, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  stmt.run(userId, username, email, hashedPassword, role);

  // Return user without password
  return getUserById(userId);
}

/**
 * Login user
 */
export function login(username, password) {
  const db = getDatabase();

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    throw new Error('Invalid username or password');
  }

  // Verify password
  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid username or password');
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.created_at
    }
  };
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Get user by ID
 */
export function getUserById(userId) {
  const db = getDatabase();
  const user = db.prepare('SELECT id, username, email, role, avatar, created_at FROM users WHERE id = ?').get(userId);
  return user;
}

/**
 * Get user by username
 */
export function getUserByUsername(username) {
  const db = getDatabase();
  const user = db.prepare('SELECT id, username, email, avatar, created_at FROM users WHERE username = ?').get(username);
  return user;
}

/**
 * Update user profile
 */
export function updateUser(userId, updates) {
  const db = getDatabase();
  const allowedFields = ['username', 'email', 'avatar'];
  const updatesList = [];
  const values = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (allowedFields.includes(key)) {
      updatesList.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (updatesList.length === 0) {
    return getUserById(userId);
  }

  values.push(userId);

  const stmt = db.prepare(`
    UPDATE users
    SET ${updatesList.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);
  return getUserById(userId);
}

/**
 * Change password
 */
export function changePassword(userId, currentPassword, newPassword) {
  const db = getDatabase();

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isValid = bcrypt.compareSync(currentPassword, user.password_hash);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const hashedPassword = bcrypt.hashSync(newPassword, SALT_ROUNDS);

  // Update password
  const stmt = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
  stmt.run(hashedPassword, userId);

  return { success: true };
}

export default {
  register,
  login,
  verifyToken,
  getUserById,
  getUserByUsername,
  updateUser,
  changePassword,
  ROLES,
  isAdminIP,
  getDefaultRole
};

/**
 * Permission checks
 */
export function hasPermission(user, permission) {
  const role = user?.role || ROLES.GUEST;

  const permissions = {
    [ROLES.GUEST]: ['view_rooms', 'join_room_as_spectator'],
    [ROLES.PLAYER]: ['view_rooms', 'join_room_as_spectator', 'join_room_as_player', 'create_room', 'create_story_template', 'chat', 'use_cards', 'generate_dungeon'],
    [ROLES.ADMIN]: ['view_rooms', 'join_room_as_spectator', 'join_room_as_player', 'create_room', 'create_story_template', 'chat', 'use_cards', 'generate_dungeon', 'manage_users', 'manage_mods', 'view_all_rooms', 'delete_room', 'ban_user']
  };

  return permissions[role]?.includes(permission) || false;
}

/**
 * Check if user has at least guest permissions
 */
export function isGuest(user) {
  return true; // Everyone has guest permissions
}

/**
 * Check if user has at least player permissions
 */
export function isPlayer(user) {
  const role = user?.role || ROLES.GUEST;
  return role === ROLES.PLAYER || role === ROLES.ADMIN;
}

/**
 * Check if user is admin
 */
export function isAdmin(user) {
  return user?.role === ROLES.ADMIN;
}
