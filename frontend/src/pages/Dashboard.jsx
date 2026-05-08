import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { FaShieldAlt, FaRegCheckCircle, FaUsers } from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";
import { GoXCircle, GoZap } from "react-icons/go";
import { IoMdTrendingUp } from "react-icons/io";

const StatCard = ({ icon: Icon, label, value, sub, color = 'accent' }) => {
  const colors = { accent: 'text-accent-light bg-accent/20', green: 'text-green-400 bg-green-500/20', orange: 'text-orange-400 bg-orange-500/20', red: 'text-red-400 bg-red-500/20' };
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

const VIOLATION_COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899'];

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsAPI.getDashboard().then(r => r.data),
    enabled: ['MODERATOR', 'ADMIN'].includes(user?.role),
    refetchInterval: 30000
  });

  const trend = data?.dailyTrend?.map(d => ({
    date: format(new Date(d.date), 'MMM d'),
    posts: d.count,
    removed: d.removed,
    flagged: d.flagged
  })) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Welcome back, {user?.username}</p>
      </div>

      {['MODERATOR', 'ADMIN'].includes(user?.role) && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-surface-tertiary" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={FaShieldAlt} label="Total Posts" value={data?.overview?.totalPosts?.toLocaleString() || 0} sub="All time" />
                <StatCard icon={FiAlertTriangle} label="Pending Review" value={data?.overview?.pendingPosts || 0} color="orange" sub={`${data?.overview?.flaggedPosts || 0} flagged`} />
                <StatCard icon={GoXCircle} label="Removed Today" value={data?.overview?.removedPosts || 0} color="red" />
                <StatCard icon={GoZap} label="Auto-moderated" value={`${data?.moderation?.automationRate || 0}%`} color="green" sub="AI accuracy" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Trend chart */}
                <div className="card lg:col-span-2">
                  <h3 className="text-sm font-semibold text-white mb-4">7-Day Post Activity</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={trend}>
                      <defs>
                        <linearGradient id="posts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="removed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="posts" stroke="#6366f1" fill="url(#posts)" strokeWidth={2} name="Posts" />
                      <Area type="monotone" dataKey="removed" stroke="#ef4444" fill="url(#removed)" strokeWidth={2} name="Removed" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Violations pie */}
                <div className="card">
                  <h3 className="text-sm font-semibold text-white mb-4">Top Violations</h3>
                  {data?.topViolations?.length > 0 ? (
                    <>
                      <PieChart width={180} height={140}>
                        <Pie data={data.topViolations} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                          {data.topViolations.map((_, i) => <Cell key={i} fill={VIOLATION_COLORS[i % VIOLATION_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                      <div className="space-y-1.5 mt-2">
                        {data.topViolations.map((v, i) => (
                          <div key={v.type} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ background: VIOLATION_COLORS[i] }} />
                              <span className="text-gray-400">{v.type?.replace('_', ' ')}</span>
                            </div>
                            <span className="text-white font-medium">{v.count}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <p className="text-gray-500 text-sm">No violations data yet.</p>}
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={FaUsers} label="Total Users" value={data?.overview?.totalUsers || 0} />
                <StatCard icon={GoXCircle} label="Banned Users" value={data?.overview?.bannedUsers || 0} color="red" />
                <StatCard icon={FaRegCheckCircle} label="Approval Rate" value={`${data?.overview?.approvalRate || 100}%`} color="green" />
                <StatCard icon={IoMdTrendingUp} label="Posts (7 days)" value={data?.overview?.postsLast7d || 0} />
              </div>
            </>
          )}
        </>
      )}

      {user?.role === 'USER' && (
        <div className="card text-center py-10">
          <FaShieldAlt size={40} className="text-accent-light mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-white">Welcome to ModAI</h2>
          <p className="text-gray-400 text-sm mt-1">You can browse and report posts in the Posts section.</p>
        </div>
      )}
    </div>
  );
}