import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../services/api.js';
import { ImSpinner2 } from "react-icons/im";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';

export default function AnalyticsPage() {
  const { data: dashboard, isLoading: loadingDash } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsAPI.getDashboard().then(r => r.data)
  });

  const { data: health, isLoading: loadingHealth } = useQuery({
    queryKey: ['communityHealth'],
    queryFn: () => analyticsAPI.getCommunityHealth().then(r => r.data)
  });

  const violationData = dashboard?.topViolations?.map(v => ({
    name: v.type?.replace('_', ' '),
    count: v.count
  })) || [];

  const healthData = health?.map(c => ({
    community: c.name,
    health: c.healthScore,
    toxicity: (c.avgToxicityScore * 100).toFixed(1)
  })) || [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-white">Analytics</h1>

      {loadingDash ? (
        <div className="flex justify-center py-12"><ImSpinner2 size={24} className="animate-spin text-accent-light" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Violations bar */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-4">Violations by Type</h3>
            {violationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={violationData} layout="vertical" >
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip cursor={false} contentStyle={{ background: '#1a1d27', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-500 text-sm py-8 text-center">No violation data yet.</p>}
          </div>

          {/* Moderation breakdown */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-4">Moderation Overview</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Posts', value: dashboard?.overview?.totalPosts || 0, color: 'bg-accent' },
                { label: 'Approved', value: dashboard?.overview?.totalPosts - (dashboard?.overview?.removedPosts || 0), color: 'bg-green-500' },
                { label: 'Flagged', value: dashboard?.overview?.flaggedPosts || 0, color: 'bg-orange-500' },
                { label: 'Removed', value: dashboard?.overview?.removedPosts || 0, color: 'bg-red-500' },
                { label: 'Pending Review', value: dashboard?.overview?.pendingPosts || 0, color: 'bg-yellow-500' },
              ].map(({ label, value, color }) => {
                const total = dashboard?.overview?.totalPosts || 1;
                const pct = Math.min(100, (value / total * 100));
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{label}</span>
                      <span className="text-white font-medium">{value}</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full">
                      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Automation Rate</span>
                <span className="text-accent-light font-semibold">{dashboard?.moderation?.automationRate || 0}%</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-400">Approval Rate</span>
                <span className="text-green-400 font-semibold">{dashboard?.overview?.approvalRate || 100}%</span>
              </div>
            </div>
          </div>

          {/* Community health */}
          <div className="card lg:col-span-2">
            <h3 className="text-sm font-semibold text-white mb-4">Community Health Scores</h3>
            {loadingHealth ? (
              <div className="flex justify-center py-8"><ImSpinner2 size={20} className="animate-spin text-accent-light" /></div>
            ) : healthData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {health?.map(c => (
                  <div key={c.id} className="bg-surface rounded-xl p-4 border border-gray-700/50">
                    <h4 className="text-sm font-medium text-white mb-3">{c.name}</h4>
                    <div className="flex items-end gap-2 mb-3">
                      <span className={`text-3xl font-bold ${c.healthScore > 70 ? 'text-green-400' : c.healthScore > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {c.healthScore?.toFixed(0)}
                      </span>
                      <span className="text-gray-500 text-sm mb-1">/100</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full mb-3">
                      <div
                        className={`h-2 rounded-full ${c.healthScore > 70 ? 'bg-green-500' : c.healthScore > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${c.healthScore}%` }}
                      />
                    </div>
                    <div className="space-y-1 text-xs text-gray-400">
                      <div className="flex justify-between"><span>Total Posts</span><span className="text-white">{c.totalPosts}</span></div>
                      <div className="flex justify-between"><span>Removed</span><span className="text-red-400">{c.removedPosts}</span></div>
                      <div className="flex justify-between"><span>Avg Toxicity</span><span className="text-orange-400">{(c.avgToxicityScore * 100).toFixed(1)}%</span></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">No community data yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}