import { verifyToken, getUserById, hasPermission, ROLES } from '../api/auth.js';

/**
 * Authentication middleware
 */
export function authenticate(req, res, next) {
  try {
    // Get token from header or query
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Get user
    const user = getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role || ROLES.GUEST;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

    if (token) {
      const decoded = verifyToken(token);
      const user = getUserById(decoded.userId);
      if (user) {
        req.user = user;
        req.userId = user.id;
        req.userRole = user.role || ROLES.GUEST;
      }
    }

    // Set guest role if no user
    if (!req.user) {
      req.userRole = ROLES.GUEST;
    }
  } catch (error) {
    // Continue without authentication
    req.userRole = ROLES.GUEST;
  }

  next();
}

/**
 * Require specific permission
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: permission,
        yourRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Require minimum role (guest < player < admin)
 */
export function requireRole(minRole) {
  const roleHierarchy = {
    [ROLES.GUEST]: 0,
    [ROLES.PLAYER]: 1,
    [ROLES.ADMIN]: 2
  };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userLevel = roleHierarchy[req.user.role] || 0;
    const requiredLevel = roleHierarchy[minRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: minRole,
        yourRole: req.user.role
      });
    }

    next();
  };
}

export default {
  authenticate,
  optionalAuth,
  requirePermission,
  requireRole
};
