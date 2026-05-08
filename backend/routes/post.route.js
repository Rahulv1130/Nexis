import express from 'express';
import { createPost, getPosts, getPost, reportPost, uploadAvatar } from '../controllers/post.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/mutler.js';

const router = express.Router();

router.use(authenticate);
router.post('/', upload.single('image'), createPost);
router.get('/', getPosts);
router.get('/:id', getPost);
router.post('/:id/report', reportPost);
router.post('/avatar', upload.single('avatar'), uploadAvatar)

export default router;
