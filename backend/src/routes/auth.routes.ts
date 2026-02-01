/**
 * Authentication Routes
 * User registration, login, and token management
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, APIError } from '../middleware/error.middleware';
import { authenticateToken, generateToken, generateRefreshToken } from '../middleware/auth.middleware';
import { validateUserRegistration, validateUserLogin } from '../middleware/validation.middleware';
import { User } from '../models';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validateUserRegistration,
  asyncHandler(async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      throw new APIError(
        existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken',
        409
      );
    }

    // Create user
    const user = new User({
      username,
      email,
      password,
      role: 'user'
    });

    await user.save();

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '24h'
        }
      }
    });
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return tokens
 * @access  Public
 */
router.post(
  '/login',
  validateUserLogin,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new APIError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      throw new APIError('Account is disabled', 403);
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new APIError('Invalid credentials', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '24h'
        }
      }
    });
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Protected
 */
router.get(
  '/me',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        id: req.user?._id,
        username: req.user?.username,
        email: req.user?.email,
        role: req.user?.role,
        lastLogin: req.user?.lastLogin,
        createdAt: req.user?.createdAt
      }
    });
  })
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Protected
 */
router.put(
  '/profile',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { username, email } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      throw new APIError('User not found', 404);
    }

    // Check for conflicts
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        throw new APIError('Username already taken', 409);
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        throw new APIError('Email already registered', 409);
      }
      user.email = email;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  })
);

/**
 * @route   PUT /api/auth/password
 * @desc    Change password
 * @access  Protected
 */
router.put(
  '/password',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!currentPassword || !newPassword) {
      throw new APIError('Current and new password required', 400);
    }

    if (newPassword.length < 6) {
      throw new APIError('Password must be at least 6 characters', 400);
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new APIError('User not found', 404);
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new APIError('Current password is incorrect', 401);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  })
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Protected
 */
router.post(
  '/logout',
  authenticateToken,
  (_req: Request, res: Response) => {
    // In a more complete implementation, you would:
    // - Add the token to a blacklist
    // - Clear refresh token from database
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
);

export default router;
