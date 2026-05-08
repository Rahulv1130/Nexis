import prisma from '../config/prisma.js';

const getCommunities = async (req, res, next) => {
  try {
    const communities = await prisma.community.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' }
    });
    res.json(communities);
  } catch (err) { next(err); }
};

const createCommunity = async (req, res, next) => {
  try {
    const { name, description, rules } = req.body;
    if (!name) return res.status(400).json({ error: 'Community name required' });

    const community = await prisma.community.create({
      data: { name, description, rules: rules || [] }
    });
    res.status(201).json(community);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Community name already exists' });
    next(err);
  }
};

const updateCommunity = async (req, res, next) => {
  try {
    const community = await prisma.community.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(community);
  } catch (err) { next(err); }
};

export { getCommunities, createCommunity, updateCommunity };
