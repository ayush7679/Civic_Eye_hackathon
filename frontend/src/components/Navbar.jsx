import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Eye, Map, LayoutDashboard, AlertTriangle, Menu, X, LogOut, LogIn, User } from 'lucide-react';
import { isLoggedIn, isAdmin, getCurrentUser, clearSession } from '../services/auth';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Refresh user state on route change
  useEffect(() => {
    setUser(isLoggedIn() ? getCurrentUser() : null);
    setMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    navigate('/auth');
  };

  // Base nav items visible to everyone
  const navItems = [
    { to: '/',       label: 'Home',   icon: Eye },
    { to: '/report', label: 'Report', icon: AlertTriangle },
    { to: '/map',    label: 'Map',    icon: Map },
    // Dashboard only for admin
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard }] : []),
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#050d1a]/90 backdrop-blur-xl border-b border-white/8 shadow-2xl' : 'bg-transparent'
    }`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all">
              <Eye size={16} className="text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-white text-lg leading-none">Civic</span>
              <span className="font-display font-bold text-blue-400 text-lg leading-none">Eye</span>
            </div>
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-display font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/8'
                  }`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300">
                  <User size={13} className="text-blue-400" />
                  <span className="font-mono text-xs">{user.username}</span>
                  {user.role === 'admin' && (
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-blue-600/30 text-blue-300 border border-blue-500/30">
                      admin
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/8 rounded-xl text-sm transition-all"
                  title="Logout"
                >
                  <LogOut size={14} />
                  <span className="hidden lg:inline">Logout</span>
                </button>
              </>
            ) : (
              <NavLink
                to="/auth"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-display font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
              >
                <LogIn size={14} />
                Sign In
              </NavLink>
            )}

            {/* Report CTA — only for logged-in non-admin */}
            {user && user.role !== 'admin' && (
              <NavLink
                to="/report"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-display font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
              >
                <AlertTriangle size={14} />
                Report Damage
              </NavLink>
            )}

            <button
              onClick={() => setMenuOpen(v => !v)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-white/8 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-display font-medium transition-all ${
                    isActive ? 'bg-blue-600/20 text-blue-300' : 'text-slate-400 hover:text-white hover:bg-white/8'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/8 transition-all"
              >
                <LogOut size={16} />
                Logout ({user.username})
              </button>
            ) : (
              <NavLink
                to="/auth"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/8 transition-all"
              >
                <LogIn size={16} />
                Sign In
              </NavLink>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
