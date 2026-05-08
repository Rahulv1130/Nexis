import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

/**
 * Generates a signed JWT token for authenticated users.
 *
 * @param {string} userId - Unique ID of the authenticated user.
 * @returns {string} Signed JWT token.
 */
const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

/**
 * Registers a new user account.
 *
 * Validates user input, checks for existing email/username,
 * hashes the password using bcrypt, creates the user in the database,
 * and returns a JWT token along with safe user details.
 *
 * @async
 * @function register
 *
 * @param {import('express').Request} req - Express request object containing email, username, and password.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 *
 * @returns {Promise<void>} JSON response with JWT token and created user.
 */
const register = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    if (existing) return res.status(409).json({ error: 'Email or username already taken' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, username, passwordHash, avatar:'https://api.dicebear.com/7.x/avataaars/svg' },
      select: { id: true, email: true, username: true, role: true, trustScore: true, createdAt: true }
    });

    res.status(201).json({ token: generateToken(user.id), user });
  } catch (err) { next(err); }
};


/**
 * Authenticates an existing user.
 *
 * Validates credentials, compares hashed passwords using bcrypt,
 * checks whether the account is banned, and returns a JWT token
 * with safe user information on successful login.
 *
 * @async
 * @function login
 *
 * @param {import('express').Request} req - Express request object containing email and password.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 *
 * @returns {Promise<void>} JSON response with JWT token and authenticated user.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.isBanned) return res.status(403).json({ error: 'Account is banned' });

    const { passwordHash, ...safeUser } = user;
    res.json({ token: generateToken(user.id), user: safeUser });
  } catch (err) { next(err); }
};


/**
 * Handles OAuth authentication callback.
 *
 * Generates a JWT token for the authenticated OAuth user
 * and redirects the user back to the frontend application
 * with the token attached as a query parameter.
 *
 * @function oauthCallback
 *
 * @param {import('express').Request} req - Express request object containing authenticated OAuth user.
 * @param {import('express').Response} res - Express response object.
 *
 * @returns {void} Redirects user to frontend callback route.
 */
const oauthCallback = (req, res) => {
  const token = generateToken(req.user.id);
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
};


/**
 * Returns the currently authenticated user's profile.
 *
 * Removes sensitive fields such as password hash
 * before sending the user object to the client.
 *
 * @async
 * @function getMe
 *
 * @param {import('express').Request} req - Express request object containing authenticated user.
 * @param {import('express').Response} res - Express response object.
 *
 * @returns {Promise<void>} JSON response with authenticated user details.
 */
const getMe = async (req, res) => {
  const { passwordHash, ...safeUser } = req.user;
  res.json(safeUser);
};

export { register, login, oauthCallback, getMe };