import express from 'express';
import { moderatePost, getFlaggedPosts, bulkModerate, getModerationHistory } from '../controllers/moderation.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole('MODERATOR', 'ADMIN'));

router.get('/queue', getFlaggedPosts);
router.get('/history', getModerationHistory);
router.post('/bulk', bulkModerate);
router.post('/:id/action', moderatePost);

export default router;
