import "dotenv/config";
import express from 'express'
import cors from 'cors'
import helmet from 'helmet' ;
import rateLimit from 'express-rate-limit' ;
import passport from 'passport' ;
import { createServer } from 'http' ;
import logger from './config/logger.js' ;
import './config/passport.js'; 
import authRoutes from './routes/auth.route.js';
import postRoutes from './routes/post.route.js';
import moderationRoutes from './routes/moderation.route.js';
import userRoutes from './routes/user.route.js';
import analyticsRoutes from './routes/analytics.route.js';
import communityRoutes from './routes/community.route.js';
import prisma from "./config/prisma.js";

const app = express();
const httpServer = createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Health check
app.get('/health', async (req, res) => {
  try {
    const c = await prisma.user.count();
    res.json({
      ok: true, database: `connected (User Count: ${c})`, timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/communities', communityRoutes);

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

export default app;
