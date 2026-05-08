import express from 'express';
import { getDashboardStats, getCommunityHealth } from '../controllers/analytics.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate, requireRole('MODERATOR', 'ADMIN'));
router.get('/dashboard', getDashboardStats);
router.get('/community-health', getCommunityHealth);

export default router;
