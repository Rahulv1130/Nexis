import prisma from '../config/prisma.js';

const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalPosts, pendingPosts, flaggedPosts, removedPosts,
      postsLast24h, postsLast7d,
      totalUsers, bannedUsers,
      autoModerated, manualModerated,
      topViolations
    ] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: 'PENDING' } }),
      prisma.post.count({ where: { status: 'FLAGGED' } }),
      prisma.post.count({ where: { status: 'REMOVED' } }),
      prisma.post.count({ where: { createdAt: { gte: last24h } } }),
      prisma.post.count({ where: { createdAt: { gte: last7d } } }),
      prisma.user.count(),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.post.count({ where: { autoModerated: true } }),
      prisma.post.count({ where: { autoModerated: false, status: { not: 'PENDING' } } }),
      prisma.post.groupBy({
        by: ['violationType'],
        where: { violationType: { not: null } },
        _count: { violationType: true },
        orderBy: { _count: { violationType: 'desc' } },
        take: 5
      })
    ]);

    // Weekly post trend (last 7 days)
    const dailyTrend = await prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT(*)::int as count,
             COUNT(*) FILTER (WHERE status = 'REMOVED')::int as removed,
             COUNT(*) FILTER (WHERE status = 'FLAGGED')::int as flagged
      FROM "Post"
      WHERE "createdAt" >= ${last7d}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    const approvalRate = totalPosts > 0
      ? ((totalPosts - removedPosts) / totalPosts * 100).toFixed(1)
      : 100;

    res.json({
      overview: {
        totalPosts, pendingPosts, flaggedPosts, removedPosts,
        postsLast24h, postsLast7d, totalUsers, bannedUsers,
        approvalRate: parseFloat(approvalRate)
      },
      moderation: {
        autoModerated, manualModerated,
        automationRate: (totalPosts > 0 ? (autoModerated / totalPosts * 100).toFixed(1) : 0)
      },
      topViolations: topViolations.map(v => ({ type: v.violationType, count: v._count.violationType })),
      dailyTrend
    });
  } catch (err) { next(err); }
};

const getCommunityHealth = async (req, res, next) => {
  try {
    const communities = await prisma.community.findMany({
      include: {
        _count: { select: { posts: true } },
        posts: {
          select: { status: true, aiScore: true },
          take: 1000,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    const health = communities.map(c => {
      const posts = c.posts;
      const removed = posts.filter(p => p.status === 'REMOVED').length;
      const flagged = posts.filter(p => p.status === 'FLAGGED').length;
      const avgScore = posts.reduce((sum, p) => sum + (p.aiScore || 0), 0) / (posts.length || 1);
      const healthScore = Math.max(0, 100 - (removed * 5) - (flagged * 2) - (avgScore * 30));

      return {
        id: c.id,
        name: c.name,
        totalPosts: c._count.posts,
        removedPosts: removed,
        flaggedPosts: flagged,
        avgToxicityScore: parseFloat(avgScore.toFixed(3)),
        healthScore: parseFloat(healthScore.toFixed(1))
      };
    });

    res.json(health);
  } catch (err) { next(err); }
};

export { getDashboardStats, getCommunityHealth };
