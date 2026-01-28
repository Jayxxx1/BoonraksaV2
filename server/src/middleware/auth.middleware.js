import jwt from 'jsonwebtoken';
import { asyncHandler } from './error.middleware.js';
import prisma from '../prisma/client.js';
import config from '../config/config.js';

/**
 * Protect middleware: Ensures the user is logged in
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'You are not logged in. Please log in to get access.'
    });
  }

  // 1. Verify token
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // 2. Check if user still exists
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // 3. Grant access to protected route
    req.user = currentUser;
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid or expired token. Please log in again.'
    });
  }
});

/**
 * RestrictTo middleware: Restricts access to specific roles
 * @param {...string} roles - Allowed roles (e.g., 'ADMIN', 'SALES')
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    console.log(`[AUTH] Checking Role: ${req.user.role}, Allowed: ${roles}`); // Debug Log
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};
