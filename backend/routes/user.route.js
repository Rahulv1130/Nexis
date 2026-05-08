import express from 'express';
import { getUsers, updateUserRole, unbanUser } from '../controllers/user.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate, requireRole('ADMIN'));
router.get('/', getUsers);
router.patch('/:id/role', updateUserRole);
router.patch('/:id/unban', unbanUser);

export default router;
