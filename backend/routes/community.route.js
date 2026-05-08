import express from'express';
import { getCommunities, createCommunity, updateCommunity } from'../controllers/community.controller.js';
import { authenticate, requireRole } from'../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);
router.get('/', getCommunities);
router.post('/', requireRole('ADMIN'), createCommunity);
router.patch('/:id', requireRole('ADMIN'), updateCommunity);

export default router;
