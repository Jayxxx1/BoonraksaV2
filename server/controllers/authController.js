import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../src/prisma/client.js';
import config from '../src/config/config.js';
import { asyncHandler } from '../src/middleware/error.middleware.js';

/**
 * Sign JWT Token
 */
const signToken = (id) => {
  return jwt.sign({ id }, config.JWT_SECRET, {
    expiresIn: '30d'
  });
};

/**
 * Login user
 */
export const login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  // 1. Check if username and password exist
  if (!username || !password) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide username and password'
    });
  }

  // 2. Check if user exists & password is correct
  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({
      status: 'fail',
      message: 'Incorrect username or password'
    });
  }

  // 3. If everything ok, send token to client
  const token = signToken(user.id);

  // Remove password from output
  user.password = undefined;

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
});

/**
 * Get current user profile
 */
export const getMe = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});
