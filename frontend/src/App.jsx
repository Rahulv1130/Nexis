import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Layout from './components/dashboard/Layout.jsx';
import LoginPage from './pages/Login.jsx';
import DashboardPage from './pages/Dashboard.jsx';
import ModerationQueuePage from './pages/ModerationQueue.jsx';
import PostsPage from './pages/Posts.jsx';
import UsersPage from './pages/Users.jsx';
import CommunityPage from './pages/Community.jsx';
import AnalyticsPage from './pages/Analytics.jsx';
import UserProfilePage from './pages/UserProfile.jsx';
import CreatePostPage from './pages/CreatePost.jsx';
import AuthCallback from './components/AuthCallback.jsx';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="queue" element={<ProtectedRoute roles={['MODERATOR', 'ADMIN']}><ModerationQueuePage /></ProtectedRoute>} />
            <Route path="posts" element={<PostsPage />} />
            <Route path="create" element={<CreatePostPage />} />
            <Route path="profile" element={<UserProfilePage />} />
            <Route path="users" element={<ProtectedRoute roles={['ADMIN']}><UsersPage /></ProtectedRoute>} />
            <Route path="communities" element={<ProtectedRoute roles={['ADMIN']}><CommunityPage /></ProtectedRoute>} />
            <Route path="analytics" element={<ProtectedRoute roles={['MODERATOR', 'ADMIN']}><AnalyticsPage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    // <UserHome />
  );
}
