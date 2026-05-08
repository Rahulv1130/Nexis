import prisma from '../config/prisma.js';
import { analyzeUserBehavior } from '../services/ai.service.js';
import logger from '../config/logger.js';

const moderatePost = async (req, res, next) => {
  try {
    const { action, reason } = req.body;
    const { id } = req.params;

    const validActions = ['APPROVE', 'FLAG', 'REMOVE', 'WARN_USER', 'BAN_USER'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      include: { author: true }
    });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Determine new post status
    const statusMap = {
      APPROVE: 'APPROVED',
      FLAG: 'FLAGGED',
      REMOVE: 'REMOVED',
      WARN_USER: post.status,
      BAN_USER: 'REMOVED'
    };

    const [updatedPost, log] = await prisma.$transaction(async (tx) => {
      const updated = await tx.post.update({
        where: { id },
        data: { status: statusMap[action] }
      });

      const modLog = await tx.moderationLog.create({
        data: {
          action,
          reason,
          aiAssisted: false,
          postId: id,
          moderatorId: req.user.id
        }
      });

      // Handle user actions
      if (action === 'WARN_USER') {
        await tx.user.update({
          where: { id: post.authorId },
          data: { warningCount: { increment: 1 }, trustScore: { decrement: 10 } }
        });
      }

      if (action === 'BAN_USER') {
        await tx.user.update({
          where: { id: post.authorId },
          data: {
            isBanned: true,
            bannedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            trustScore: 0
          }
        });
      }

      return [updated, modLog];
    });

    logger.info(`Post ${id} moderated: ${action} by ${req.user.username}`);
    res.json({ post: updatedPost, log });
  } catch (err) { next(err); }
};

const getFlaggedPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sortBy = 'score' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orderBy = sortBy === 'score'
      ? { aiScore: 'desc' }
      : { createdAt: 'desc' };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { status: { in: ['FLAGGED', 'PENDING'] } },
        include: {
          author: { select: { id: true, username: true, avatar: true, trustScore: true, warningCount: true } },
          community: { select: { id: true, name: true } },
          _count: { select: { reports: true } }
        },
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      prisma.post.count({ where: { status: { in: ['FLAGGED', 'PENDING'] } } })
    ]);

    res.json({ posts, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

const bulkModerate = async (req, res, next) => {
  try {
    const { postIds, action, reason } = req.body;
    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ error: 'postIds array required' });
    }

    const statusMap = { APPROVE: 'APPROVED', FLAG: 'FLAGGED', REMOVE: 'REMOVED' };
    if (!statusMap[action]) return res.status(400).json({ error: 'Invalid bulk action' });

    await prisma.$transaction([
      prisma.post.updateMany({ where: { id: { in: postIds } }, data: { status: statusMap[action] } }),
      ...postIds.map(postId => prisma.moderationLog.create({
        data: { action, reason, aiAssisted: false, postId, moderatorId: req.user.id }
      }))
    ]);

    res.json({ message: `${postIds.length} posts ${action.toLowerCase()}d`, count: postIds.length });
  } catch (err) { next(err); }
};

const getModerationHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.moderationLog.findMany({
        include: {
          post: { select: { id: true, content: true, status: true } },
          moderator: { select: { id: true, username: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.moderationLog.count()
    ]);

    res.json({ logs, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

export { moderatePost, getFlaggedPosts, bulkModerate, getModerationHistory };
