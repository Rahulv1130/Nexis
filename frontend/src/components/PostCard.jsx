import React from 'react';
import { FiHeart, FiMessageSquare, FiShare2 } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';


const StatusBadge = ({ status, role }) => {
  if (role === 'USER' && status === 'APPROVED') return null;
  
  const statusColors = {
    PENDING: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    APPROVED: 'bg-green-500/10 text-green-500 border-green-500/20',
    FLAGGED: 'bg-yellow-500/10 text-tellow-500 border-yellow-500/20',
    REMOVED: 'bg-red-500/10 text-red-500 border-red-500/20'
  };

  if(role =='USER') status = 'Under Review';

  const colorClass = statusColors[status] || 'bg-yellow-500/10 text-tellow-500 border-yellow-500/20';



  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ml-auto border ${colorClass}`}>
      {status}
    </span>
  );
};

const PostHeader = ({ username, time, status, role, avatar, community }) => (
  <div className="flex items-center justify-between p-4 bg-slate-900/20">
    <div className="flex items-center gap-3 flex-1">
      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center overflow-hidden border border-slate-700/50">
        <img
          src={avatar}
          className="w-full h-full object-cover" 
        />
      </div>
      <div className="flex flex-col w-full">
        <div className="flex items-center">
          <span className="text-sm font-semibold text-slate-100">@{username}</span>
          <StatusBadge status={status} role={role} />
        </div>
        <div className='flex justify-between'>
            <span className="text-[12px] text-slate-500">
            {time ? formatDistanceToNow(new Date(time)) + ' ago' : 'Just now'}
            </span>
            <span className="text-[12px] text-slate-500">
            {`In ${community} Community`}
            </span>
        </div>
      </div>
    </div>
  </div>
);

const FeedCard = ({ children, className = "" }) => (
  <div className={`bg-[#1b1b23] border border-slate-800/50 rounded-2xl overflow-hidden transition-all duration-300 hover:border-indigo-500/30 group ${className}`}>
    {children}
  </div>
);



const PostCard = ({ posts, user }) => {

  return (
    <div className='w-fit'>
        {posts?.map((post, idx) => 
            <div className="w-full max-w-md m-5" key={idx}>
                <FeedCard>
                    <PostHeader 
                        username={post.author.username}
                        time={post.createdAt}
                        status={post.status}
                        role={user.role}
                        community={post.community.name}
                        avatar={post.author.avatar}
                    />

                    {/* Image of the POST */}
                    {!post.imageUrl ? null : 
                        <img 
                            src={post.imageUrl}
                            className='p-3'
                        />
                    }
                    
                    <div className="p-6">
                    <p className="text-sm text-slate-400 leading-relaxed">
                        {post.content}
                    </p>

                    {/* Reason for Removal */}
                    {post.status === 'REMOVED' && (
                      <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-wider text-red-400">
                            Removal Reason
                          </p>

                          <span className="text-[10px] text-red-300"> {(post.aiScore * 100).toFixed(0)}% Toxic</span>
                        </div>

                        <p className="text-sm text-slate-300 mt-3">
                          {post.aiAnalysis?.reasoning || 'This content violated community guidelines.'}
                        </p>

                        {post.violationType && (
                          <div className="mt-3 inline-flex px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] uppercase tracking-wider font-bold text-red-300">
                            {post.violationType.replaceAll('_', ' ')}
                          </div>
                        )}
                      </div>
                    )}


                    {/* INTERACTION FOOTER */}
                    <div className="flex items-center justify-between mt-8 text-slate-500">
                        <div className="flex gap-6">
                        <button className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors">
                            <FiHeart size={16} />
                            <span className="text-[10px] font-bold">852</span>
                        </button>
                        <button className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors">
                            <FiMessageSquare size={16} />
                            <span className="text-[10px] font-bold">24</span>
                        </button>
                        </div>
                        <button className="hover:text-indigo-400 transition-colors">
                        <FiShare2 size={16} />
                        </button>
                    </div>
                    </div>
                </FeedCard>
            </div>
        )}
    </div>
  );
};

export default PostCard;
