import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,

  (err) => {
    const isAuthRoute = err.config?.url?.includes('/auth/login') ||
                        err.config?.url?.includes('/auth/register');

    if (
      err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Posts
export const postsAPI = {
  getAll: (params) => api.get('/posts', { params }),
  getUserPosts: (id) => api.get(`/posts/${id}`),
  create: (data) => api.post('/posts', data),
  report: (id, reason) => api.post(`/posts/${id}/report`, { reason }),
  uploadAvatar: (data) => api.post(`/posts/avatar`, data)
};

// Moderation
export const moderationAPI = {
  getQueue: (params) => api.get('/moderation/queue', { params }),
  getHistory: (params) => api.get('/moderation/history', { params }),
  action: (id, action, reason) => api.post(`/moderation/${id}/action`, { action, reason }),
  bulk: (postIds, action, reason) => api.post('/moderation/bulk', { postIds, action, reason }),
};

// Analytics
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getCommunityHealth: () => api.get('/analytics/community-health'),
};

// Users
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  unban: (id) => api.patch(`/users/${id}/unban`),
};

// Communities
export const communitiesAPI = {
  getAll: () => api.get('/communities'),
  create: (data) => api.post('/communities', data),
  update: (id, data) => api.patch(`/communities/${id}`, data),
};

export default api;