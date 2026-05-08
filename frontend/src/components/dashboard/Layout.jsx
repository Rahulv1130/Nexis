import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { LuLayoutDashboard } from "react-icons/lu";
import { FaShieldAlt, FaUsers, FaGlobe  } from "react-icons/fa";
import { FiFileText, FiLogOut, FiPlus, FiUser } from "react-icons/fi";
import { IoBarChart } from "react-icons/io5";

const navItems = [
  { to: '/', label: 'Dashboard', icon: LuLayoutDashboard, exact: true },
  { to: '/queue', label: 'Mod Queue', icon: FaShieldAlt, roles: ['MODERATOR', 'ADMIN'], badge: 'queue' },
  { to: '/posts', label: 'All Posts', icon: FiFileText },
  { to: '/analytics', label: 'Analytics', icon: IoBarChart, roles: ['MODERATOR', 'ADMIN'] },
  { to: '/users', label: 'Users', icon: FaUsers, roles: ['ADMIN'] },
  { to: '/communities', label: 'Communities', icon: FaGlobe, roles: ['ADMIN'] },
  { to: '/create', label: 'New Post', icon: FiPlus},
  { to: '/profile', label: 'Profile', icon: FiUser},
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const allowedItems = navItems.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface bg-red-500">
      {/* Sidebar */}
      <aside className="w-60 bg-surface-secondary border-r border-gray-700/50 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-gray-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <FaShieldAlt size={16} className="text-white" />
            </div>
            <span className="font-semibold text-white">Nexis</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-10">AI Moderated Community Platform</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {allowedItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-accent/20 text-accent-light'
                    : 'text-gray-400 hover:text-white hover:bg-surface-tertiary'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-700/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-accent/30">
              <img
                src={user?.avatar ?? "https://api.dicebear.com/7.x/avataaars/svg"} alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.username}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
            <button onClick={handleLogout} className="text-gray-500 hover:text-danger transition-colors" title="Logout">
              <FiLogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
