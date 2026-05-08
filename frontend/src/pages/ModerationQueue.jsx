import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moderationAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { FaCheckCircle, FaTimesCircle, FaFlag, FaExclamationTriangle, FaChevronDown } from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";

const SCORE_COLOR = (score) => {
  if (score >= 0.9) return 'text-red-400';
  if (score >= 0.7) return 'text-orange-400';
  if (score >= 0.4) return 'text-yellow-400';
  return 'text-green-400';
};

const StatusBadge = ({ status }) => <span className={`badge-${status?.toLowerCase()}`}>{status}</span>;

function PostCard({ post, onAction, isProcessing }) {
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);
  const score = post.aiScore || 0;
  const analysis = post.aiAnalysis || {};

  const handleAction = (action) => {
    onAction(post.id, action, reason);
    setShowReason(false);
    setReason('');
  };

  return (
    <div className="card space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full overflow-hidden">
            <img src={post.author?.avatar} className='h-full w-full object-cover'/>
          </div>
          <div>
            <span className="text-sm font-medium text-white">{post.author?.username}</span>
            <span className="text-xs text-gray-500 ml-2">Trust: {post.author?.trustScore?.toFixed(0)}</span>
          </div>
          <StatusBadge status={post.status} />
          {post.autoModerated && <span className="text-xs bg-accent/20 text-accent-light px-1.5 py-0.5 rounded font-mono">AI</span>}
        </div>
        <span className="text-xs text-gray-500 mr-5">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-200 leading-relaxed bg-surface rounded-lg p-3 border border-gray-700/50">
        {post.content}
      </p>
      {post.imageUrl && (
        <img src={post.imageUrl} alt="Post attachment" className="rounded-lg max-h-48 object-cover" />
      )}

      {/* AI Analysis */}
      <div className="bg-surface rounded-lg p-3 border border-gray-700/50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">AI Analysis</span>
          <span className={`text-sm font-bold font-mono ${SCORE_COLOR(score)}`}>
            Score: {(score * 100).toFixed(0)}%
          </span>
        </div>
        {analysis.reasoning && (
          <p className="text-xs text-gray-400 italic">{analysis.reasoning}</p>
        )}
        {analysis.violationType && (
          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
            {analysis.violationType?.replace('_', ' ')}
          </span>
        )}
        {analysis.categories && (
          <div className="grid grid-cols-3 gap-1">
            {Object.entries(analysis.categories).map(([key, val]) => (
              <div key={key} className="text-xs">
                <div className="flex justify-between text-gray-500 mb-0.5">
                  <span className="capitalize">{key.replace('_', ' ')}</span>
                  <span className={SCORE_COLOR(val)}>{(val * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-gray-700 rounded-full">
                  <div className="h-1 rounded-full bg-accent" style={{ width: `${val * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reports count */}
      {post._count?.reports > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-orange-400">
          <FaExclamationTriangle size={12} />
          {post._count.reports} user report{post._count.reports > 1 ? 's' : ''}
        </div>
      )}

      {/* Community */}
      <p className="text-xs text-gray-500">in <span className="text-gray-400">{post.community?.name} Community</span></p>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button onClick={() => handleAction('APPROVE')} disabled={isProcessing} className="flex items-center cursor-pointer gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-xs font-medium transition-all disabled:opacity-50">
          <FaCheckCircle size={13} /> Approve
        </button>
        <button onClick={() => handleAction('FLAG')} disabled={isProcessing} className="flex items-center cursor-pointer gap-1.5 px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-xs font-medium transition-all disabled:opacity-50">
          <FaFlag size={13} /> Flag
        </button>
        <button onClick={() => handleAction('REMOVE')} disabled={isProcessing} className="flex items-center cursor-pointer gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-all disabled:opacity-50">
          <FaTimesCircle size={13} /> Remove
        </button>
        <button onClick={() => handleAction('WARN_USER')} disabled={isProcessing} className="flex items-center cursor-pointer gap-1.5 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-xs font-medium transition-all disabled:opacity-50">
          <FaExclamationTriangle size={13} /> Warn User
        </button>
        <button onClick={() => setShowReason(!showReason)} className="flex items-center cursor-pointer gap-1 px-2 py-1.5 text-gray-400 hover:text-white rounded-lg text-xs transition-all">
          Add reason <FaChevronDown size={12} className={showReason ? 'rotate-180' : ''} />
        </button>
      </div>

      {showReason && (
        <input
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Optional: reason for action..."
          className="w-full bg-surface border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent"
        />
      )}

      {isProcessing && (
        <div className="flex items-center gap-2 text-xs text-accent-light">
          <ImSpinner2 size={12} className="animate-spin" /> Processing...
        </div>
      )}
    </div>
  );
}

export default function ModerationQueuePage() {
  const [sortBy, setSortBy] = useState('score');
  const [processingIds, setProcessingIds] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['modQueue', sortBy],
    queryFn: () => moderationAPI.getQueue({ sortBy }).then(r => r.data),
    refetchInterval: 15000
  });

  const { mutate: doAction } = useMutation({
    mutationFn: ({ id, action, reason }) => moderationAPI.action(id, action, reason),
    onMutate: ({ id }) => setProcessingIds(prev => new Set([...prev, id])),
    onSettled: (_, __, { id }) => {
      setProcessingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      queryClient.invalidateQueries({ queryKey: ['modQueue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  const { mutate: doBulk } = useMutation({
    mutationFn: ({ action }) => moderationAPI.bulk([...selectedIds], action),
    onSuccess: () => {
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['modQueue'] });
    }
  });

  const posts = data?.posts || [];
  const pending = data?.pagination?.total || 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Moderation Queue</h1>
          <p className="text-sm text-gray-400 mt-0.5">{pending} posts awaiting review</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-surface-secondary border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent">
            <option value="score">Sort by AI Score</option>
            <option value="date">Sort by Date</option>
          </select>
          <button onClick={() => refetch()} className="btn-ghost text-sm">Refresh</button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="card mb-4 flex items-center gap-3">
          <span className="text-sm text-gray-300">{selectedIds.size} selected</span>
          <button onClick={() => doBulk({ action: 'APPROVE' })} className="btn-primary text-xs py-1.5">Bulk Approve</button>
          <button onClick={() => doBulk({ action: 'REMOVE' })} className="btn-danger text-xs py-1.5">Bulk Remove</button>
          <button onClick={() => setSelectedIds(new Set())} className="btn-ghost text-xs py-1.5">Clear</button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <ImSpinner2 size={24} className="animate-spin text-accent-light" />
        </div>
      ) : posts.length === 0 ? (
        <div className="card text-center py-16">
          <FaCheckCircle size={40} className="text-green-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">Queue is clear!</h3>
          <p className="text-gray-400 text-sm mt-1">All posts have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="relative">
              <input
                type="checkbox"
                checked={selectedIds.has(post.id)}
                onChange={e => {
                  setSelectedIds(prev => {
                    const n = new Set(prev);
                    e.target.checked ? n.add(post.id) : n.delete(post.id);
                    return n;
                  });
                }}
                className="absolute top-4 right-4 z-10 w-4 h-4 accent-accent"
              />
              <PostCard
                post={post}
                onAction={(id, action, reason) => doAction({ id, action, reason })}
                isProcessing={processingIds.has(post.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}