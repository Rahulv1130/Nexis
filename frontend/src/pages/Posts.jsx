import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsAPI, communitiesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDistanceToNow } from 'date-fns';
import { FaExclamationTriangle } from 'react-icons/fa';
import { ImSpinner2 } from "react-icons/im";
import { CiSquarePlus } from "react-icons/ci";
import PostCard from '../components/PostCard.jsx';

const StatusBadge = ({ status }) => <span className={`badge-${status?.toLowerCase()}`}>{status}</span>;

export default function PostsPage() {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const queryClient = useQueryClient();

  const { data: communities } = useQuery({
    queryKey: ['communities'],
    queryFn: () => communitiesAPI.getAll().then(r => r.data)
  });

  const { data, isLoading } = useQuery({
    queryKey: ['posts', statusFilter],
    queryFn: () => postsAPI.getAll({ status: statusFilter || undefined, limit: 50 }).then(r => r.data)
  });

  const { mutate: reportPost } = useMutation({
    mutationFn: ({ id }) => postsAPI.report(id, 'Inappropriate content'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] })
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !communityId) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await postsAPI.create({ content, communityId });
      setSubmitResult(res.data);
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (err) {
      setSubmitResult({ error: err.response?.data?.error || 'Failed to post' });
    } finally {
      setSubmitting(false);
    }
  };

  const posts = data?.posts || [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-white">Posts</h1>

      {/* Create post */}
      {/* <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3">Create a Post</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <select value={communityId} onChange={e => setCommunityId(e.target.value)} required className="w-full bg-surface border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent">
            <option value="">Select community...</option>
            {communities?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write something..." rows={3} required className="w-full bg-surface border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent resize-none" />
          <div className="flex items-center justify-between">
            <button type="submit" disabled={submitting} className="btn-primary text-sm flex items-center gap-2">
              {submitting ? <ImSpinner2 size={14} className="animate-spin" /> : <CiSquarePlus size={25} />}
              {submitting ? 'Posting...' : 'Post'}
            </button>
            {submitResult && !submitResult.error && (
              <div className="text-xs flex items-center gap-2">
                <StatusBadge status={submitResult.moderation?.autoStatus} />
                <span className="text-gray-400">AI Score: {((submitResult.moderation?.score || 0) * 100).toFixed(0)}%</span>
              </div>
            )}
            {submitResult?.error && <p className="text-xs text-red-400">{submitResult.error}</p>}
          </div>
        </form>
      </div> */}

      {/* Filter */}
      {['MODERATOR', 'ADMIN'].includes(user?.role) && (
        <div className="flex gap-2">
          {['', 'PENDING', 'APPROVED', 'FLAGGED', 'REMOVED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-accent text-white' : 'bg-surface-secondary text-gray-400 hover:text-white'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      )}

      {/* Posts list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><ImSpinner2 size={24} className="animate-spin text-accent-light" /></div>
      ) : (
        <div className='flex flex-col items-center'>
          <PostCard posts={posts} user={user} />
        </div>
      )}
    </div>
  );
}