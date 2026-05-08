import prisma from '../config/prisma.js';
import { moderatePost } from '../services/ai.service.js';
import logger from '../config/logger.js';
import { uploadToCloudinary } from '../helpers/uploadHelper.js';

const createPost = async (req, res, next) => {
  try {
    const { content, communityId } = req.body;
    if (!content || !communityId) return res.status(400).json({ error: 'Content and communityId required' });

    const community = await prisma.community.findUnique({ where: { id: communityId } });
    if (!community) return res.status(404).json({ error: 'Community not found' });

    let imageUrl = null;

    // Upload image if provided
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        'Nebula_Assignment_Posts'
      );

      imageUrl = result.secure_url;
    }

    // Run AI moderation
    const { analysis, autoStatus, autoModerated } = await moderatePost(
      content, imageUrl, community.rules
    );

    const post = await prisma.post.create({
      data: {
        content,
        imageUrl,
        status: autoStatus,
        aiScore: analysis.toxicityScore,
        aiAnalysis: analysis,
        violationType: analysis.violationType || null,
        autoModerated,
        authorId: req.user.id,
        communityId
      },
      include: { author: { select: { id: true, username: true, avatar: true, trustScore: true } }, community: true }
    });

    // If auto-removed, log it
    if (autoStatus === 'REMOVED') {
      logger.info(`Post ${post.id} auto-removed. Score: ${analysis.toxicityScore}`);
    }

    res.status(201).json({ post, moderation: { autoStatus, autoModerated, score: analysis.toxicityScore } });
  } catch (err) { next(err); }
};

const getPosts = async (req, res, next) => {
  try {
    const { status, communityId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (communityId) where.communityId = communityId;

    // Regular users only see approved posts
    if (req.user.role === 'USER') where.status = 'APPROVED';

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: { select: { id: true, username: true, avatar: true, trustScore: true } },
          community: { select: { id: true, name: true } },
          _count: { select: { reports: true, moderations: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.post.count({ where })
    ]);

    res.json({ posts, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

const getPost = async (req, res, next) => {
  try {
    const post = await prisma.post.findMany({
      where: { authorId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, username: true, avatar: true, trustScore: true } },
        community: true,
        moderations: {
          include: { moderator: { select: { id: true, username: true } } },
          orderBy: { createdAt: 'desc' }
        },
        reports: { include: { user: { select: { id: true, username: true } } } }
      }
    });

    res.json(post);
  } catch (err) { next(err); }
};

const reportPost = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const { id } = req.params;

    const report = await prisma.report.upsert({
      where: { postId_userId: { postId: id, userId: req.user.id } },
      update: { reason },
      create: { postId: id, userId: req.user.id, reason }
    });

    // Auto-flag if 3+ reports
    const reportCount = await prisma.report.count({ where: { postId: id } });
    if (reportCount >= 3) {
      await prisma.post.update({
        where: { id },
        data: { status: 'FLAGGED' }
      });
    }

    res.status(201).json({ report, message: 'Post reported successfully' });
  } catch (err) { next(err); }
};

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'Nebula_Assignment_Avatars');

    const updatedUser = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        avatar: result.secure_url,
      },
    });

    res.json(updatedUser);


  }
  catch(err) {
    console.error(err);
    res.status(500).json({
      error: 'Upload failed'
    });
  }
}

export { createPost, getPosts, getPost, reportPost, uploadAvatar};
