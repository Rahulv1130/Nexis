import React, { useRef, useState } from 'react';
import { FiEdit2, FiTrendingUp, FiZap, FiShield, FiMessageSquare, FiHeart } from 'react-icons/fi';
import { ImSpinner2 } from "react-icons/im";
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsAPI, communitiesAPI } from '../services/api';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import PostCard from '../components/PostCard.jsx'

const Stat = ({ label, value }) => (
  <div className="flex flex-col items-center px-6">
    <span className="text-2xl font-bold text-slate-100">{value}</span>
    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{label}</span>
  </div>
);


export default function UserProfile() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Posts');
  const fileInputRef = useRef(null);
  const { setUser } = useAuth();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { user } = useAuth();

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['user-posts', user.id],
    queryFn: () => postsAPI.getUserPosts(user.id).then(res => res.data),
    enabled: !!user?.id,
  });

  const avgToxicity = posts?.length
    ? posts.reduce((acc, p) => acc + (p.aiScore || 0), 0) / posts.length
    : 0;

  const safePercentage = posts?.length ? Math.round(
        (posts.filter(p => (p.aiScore || 0) < 0.3).length / posts.length) * 100) : 100;


  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploadingAvatar(true);
      const updatedUser = await postsAPI.uploadAvatar(formData);
      setUser(updatedUser.data);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    } 
    catch (err) { console.error(err); }
    finally {setUploadingAvatar(false);}
  };

  return (
    <div className="min-h-screen bg-[#0d0d15] text-slate-200 font-sans flex">

      {/* MAIN CONTENT */}
      <main className="flex-1 min-h-screen">
        {/* HEADER / COVER AREA */}
        <div className="h-37 border-slate-800/50"></div>  
        <div className="max-w-6xl px-8 -mt-16">
          <div className="flex justify-around">

            {/* Posts */}
            {posts?.length == 0 ? null : 
              <div className="space-y-8 pb-12 w-fit">
                  <div className='text-4xl font-bold text-center'>Posts</div>
                  <PostCard posts={posts} user={user}/>
              </div>
            }

            {/* PROFILE INFO CARD */}
            <div className="w-full md:w-80 space-y-6 flex flex-col ">
              <div className="bg-[#1b1b23] border border-slate-800/50 rounded-3xl p-8 text-center relative shadow-2xl max-h-80">
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-32 h-32 rounded-3xl bg-slate-800 mx-auto -mt-24 mb-6 border-4 border-[#0d0d15] overflow-hidden cursor-pointer group"
                >
                  <img src={ user.avatar ?? "https://api.dicebear.com/7.x/avataaars/svg"} alt="Profile" className="w-full h-full object-cover"/>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploadingAvatar ? (
                      <ImSpinner2 className="text-white animate-spin" size={24} />
                    ) : ( <FiEdit2 className="text-white" size={22} /> )} 
                  </div>

                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange}/>
                </div>

                <h2 className="text-2xl font-bold">{user.username}</h2>
                <p className="text-sm text-indigo-400 font-semibold mb-4">{user.email}</p>
                <div className="flex justify-center divide-x divide-slate-800">
                  <Stat label="Posts" value={posts?.length} />
                  <Stat label="Trust" value={user.trustScore} />
                </div>
              </div>

              {/* TRUST METRICS / BADGES */}
              <div className="bg-[#1b1b23] border border-slate-800/50 rounded-2xl p-6 max-h-80">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-6 flex items-center gap-2">
                  <FiShield className="text-green-500" /> AI Moderation Health
                </h4>

                <div className="flex items-center justify-between w-full">
                  
                  <div className="w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        innerRadius="70%" outerRadius="100%" barSize={10}
                        data={[{ name: 'Safety', value: safePercentage }]}
                        startAngle={90} endAngle={-270}
                      >
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        <RadialBar background={{ fill: '#1e293b' }} dataKey="value" fill="#22c55e" clockWise />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-7">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest">Avg Toxicity</p>
                      <p className="text-2xl font-bold text-green-400">{(avgToxicity * 100).toFixed(1)}%</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest">Safe Posts</p>
                      <p className="text-xl font-semibold text-slate-200">{safePercentage}%</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest">Trust Score</p>
                      <p className="text-xl font-semibold text-indigo-400">{user.trustScore}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
