import prisma from '../config/prisma.js';

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (role) where.role = role;
    if (search) where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, email: true, username: true, role: true, trustScore: true, isBanned: true, bannedUntil: true, warningCount: true, createdAt: true, _count: { select: { posts: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ]);

    res.json({ users, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ['USER', 'MODERATOR', 'ADMIN'];
    if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, username: true, email: true, role: true }
    });

    res.json(user);
  } catch (err) { next(err); }
};

const unbanUser = async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isBanned: false, bannedUntil: null },
      select: { id: true, username: true, isBanned: true }
    });
    res.json(user);
  } catch (err) { next(err); }
};

export { getUsers, updateUserRole, unbanUser };
