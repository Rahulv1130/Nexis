import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsAPI, communitiesAPI } from '../services/api';
import { FiImage, FiType, FiChevronDown, FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';
import { ImSpinner2 } from 'react-icons/im';
import { useNavigate } from 'react-router-dom';


export default function CreatePostPage() {
  const [content, setContent] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  
  const queryClient = useQueryClient();

  const {user} = useAuth();

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const { data: communities = [] } = useQuery({
    queryKey: ['communities'],
    queryFn: () => communitiesAPI.getAll().then(r => r.data)
  });

  // ── Create post mutation ───────────────────────────────────────────────────
  const { mutate: createPost, isPending } = useMutation({
    mutationFn: (payload) => postsAPI.create(payload).then(r => r.data),
    onSuccess: (data) => {
      setSubmitResult(data);
      setContent('');
      setCommunityId('');
      clearImage();
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (err) => {
      setSubmitResult({ error: err.response?.data?.error || 'Failed to create post' });
    },
  });

   // ── Submit handling ─────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !communityId) return;

    const formData = new FormData();
    formData.append('content', content);
    formData.append('communityId', communityId);

    if (fileInputRef.current?.files[0]) {
      formData.append('image', fileInputRef.current.files[0]);
    }

    createPost(formData);
  };

    // ── Image handling ─────────────────────────────────────────────────────────
    const handleFile = (file) => {
      if (!file) return;
      if (file.size > MAX_FILE_SIZE) {
        alert('File size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
  
      // TODO: upload to S3/Cloudinary here, then setImageUrl(uploadedUrl)
      // For now, using base64 as placeholder:
      setImageUrl(URL.createObjectURL(file));
    };
  
    const clearImage = () => {
      setImagePreview(null);
      setImageUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };


  return (
    <div className="min-h-screen bg-[#0d0d15] text-slate-200 font-sans flex">
      {/* MAIN CONTENT */}
      <main className="flex-1  min-h-screen flex flex-col">
        <header className="px-8 py-6 border-b border-slate-800/50 flex justify-between items-center">
          <h2 className="text-xl font-bold">Create Post</h2>
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full border border-slate-800 overflow-hidden">
              <img src={user?.avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        <div className="p-8 max-w-4xl mx-auto w-full">
          <div className="bg-[#1b1b23] border border-slate-800/50 rounded-2xl overflow-hidden shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* EDITOR HEADER */}
            <div className="px-6 py-4 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/20">
              <div className="relative">
                <select
                  value={communityId}
                  onChange={(e) => setCommunityId(e.target.value)}
                  className="appearance-none bg-slate-900 border border-slate-700 text-slate-200 text-sm font-medium rounded-xl px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all cursor-pointer ">
                    <option value="" disabled>
                      Select Community
                    </option>

                  {communities?.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                      className="bg-slate-900 text-slate-200"
                    >
                      {c.name}
                    </option>
                  ))}
                </select>

                <FiChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={14}
                />
              </div>
            </div>

            {/* TEXT AREA */}
            <div className="p-6">
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening in the deep tech world today?"
                className="w-full h-48 bg-transparent border-none focus:ring-0 outline-none text-slate-200 placeholder-slate-600 resize-none text-lg leading-relaxed"
              />
              
              {/* IMAGE DROPZONE */}
              {imagePreview ? (
                  <div className="mt-4 relative rounded-xl overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-60 object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-7 h-7 flex items-center justify-center transition-colors"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                    className={`mt-4 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center group cursor-pointer transition-all
                      ${dragOver ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5'}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FiImage className="text-slate-400 group-hover:text-indigo-400" size={24} />
                    </div>
                    <p className="text-sm font-semibold text-slate-300">Drag and drop or click to upload</p>
                    <p className="text-xs text-slate-500 mt-1">SVG, PNG, JPG (max. 5MB)</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleFile(e.target.files[0])}
                />
            </div>

            {/* FOOTER */}
            <div className="px-6 py-4 border-t border-slate-800/50 flex justify-between items-center bg-slate-900/20">
                <div className="flex gap-4">
                  <button type="button" className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all">
                    <FiType />
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all">
                    <FiImage />
                  </button>
                </div>
                <div className="flex gap-3 items-center">
                  <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !content.trim() || !communityId}
                    className="px-8 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-2"
                  >
                    {isPending && <ImSpinner2 size={14} className="animate-spin" />}
                    {isPending ? 'Posting…' : 'Post Content'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* TIPS & PREVIEW ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-[#1b1b23] border border-slate-800/50 rounded-2xl p-6">
              <h4 className="text-sm font-bold flex items-center gap-2 mb-4">
                <FiAlertCircle className="text-indigo-400" /> Post Tips
              </h4>
              <ul className="space-y-3">
                <li className="text-xs text-slate-400 flex items-start gap-2">• Keep technical discussions grounded in data.</li>
                <li className="text-xs text-slate-400 flex items-start gap-2">• Use charts to visualize complex concepts.</li>
                <li className="text-xs text-slate-400 flex items-start gap-2">• Tag relevant communities for better reach.</li>
              </ul>
            </div>
            <div className="bg-[#1b1b23] border border-slate-800/50 rounded-2xl p-6 opacity-50">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Post Preview</p>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-2 w-24 bg-slate-800 rounded animate-pulse"></div>
                  <div className="h-12 w-full bg-slate-800/50 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
