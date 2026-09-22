import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useI18n } from '../context/I18nContext';
import {
  LayoutDashboard, Users, SlidersHorizontal, TrendingUp, Route, Megaphone,
  LogOut, ChevronLeft, ChevronRight, Bell, Database,
  Settings, ChevronDown, UserCog, Shield, Globe
} from 'lucide-react';
import NotificationPanel from './NotificationPanel';

const NAV_ITEMS = [
  { to: '/',                 label: 'Executive',        icon: LayoutDashboard },
  { to: '/audience',         label: 'Audience',         icon: Users },
  { to: '/google-analytics', label: 'Google Analytics', icon: Globe },
  { to: '/funnel',           label: 'Configurators',    icon: SlidersHorizontal },
  { to: '/conversion',       label: 'Conversions',      icon: TrendingUp },
  { to: '/journey',          label: 'Customer Journey', icon: Route },
  { to: '/marketing',        label: 'Marketing Intel',  icon: Megaphone },
  { to: '/visitors',         label: 'Visitor Data',     icon: Database },
  { to: '/settings',         label: 'Settings',         icon: Settings },
];

export default function Layout() {
  const { admin, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { lang, setLang, t } = useI18n();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const langDropdownRef = useRef(null);

  const getInitials = (name) => name ? name.substring(0, 2).toUpperCase() : 'AD';

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="flex w-full h-full">

        {/* Sidebar */}
        <aside
          className="flex flex-col shrink-0 transition-all duration-300 z-20"
          style={{
            width: collapsed ? '72px' : '240px',
            background: 'var(--sidebar-bg)',
            borderRight: '1px solid var(--sidebar-border)',
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
            <img src="/logo.png" alt="StudentLife Logo" className={`shrink-0 ${collapsed ? 'w-10 h-10 object-contain' : 'w-12 h-12 object-contain'}`} />
            {!collapsed && (
              <div className="animate-slide-in flex-1 min-w-0">
                <p className="font-bold text-lg leading-tight brand-text text-slate-800 truncate tracking-wide">STUDENT</p>
                <p className="text-slate-600 font-medium tracking-[0.2em] text-xs">LIFE</p>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2.5 py-5 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.filter(item => {
              if (admin?.role === 'SUPERADMIN') return true;
              return admin?.pageAccess?.includes(item.to);
            }).map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                title={collapsed ? t(label) : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="animate-slide-in">{t(label)}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Collapse toggle & Logout */}
          <div className="px-2.5 pb-4 border-t pt-4 flex flex-col gap-2" style={{ borderColor: 'var(--sidebar-border)' }}>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="sidebar-item w-full justify-center lg:justify-start"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              {!collapsed && <span className="animate-slide-in">Collapse</span>}
            </button>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="sidebar-item w-full justify-center lg:justify-start text-red-400 hover:text-red-500 hover:bg-red-50"
              title={t('Sign Out')}
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span className="animate-slide-in">{t('Sign Out')}</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">

          {/* Topbar */}
          <header className="flex items-center justify-between px-6 py-3.5 bg-white backdrop-blur-md border-b border-slate-200 z-10 shrink-0">

            <div className="relative max-w-xs w-full hidden md:block">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" /></svg>
              <input
                placeholder={t('Search metrics...')}
                className="w-full pl-9 pr-4 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
              />
            </div>
            <div className="md:hidden" />

            <div className="flex items-center gap-3">

              {/* Language Switcher */}
              <div className="relative" ref={langDropdownRef}>
                <button
                  onClick={() => setShowLangDropdown(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-bold"
                >
                  <Globe className="w-4 h-4" />
                  {lang.toUpperCase()}
                </button>
                {showLangDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
                    <button onClick={() => { setLang('da'); setShowLangDropdown(false); }} className={`w-full text-left px-4 py-2 text-sm font-semibold hover:bg-slate-50 ${lang === 'da' ? 'text-sky-600' : 'text-slate-600'}`}>
                      Dansk (DA)
                    </button>
                    <button onClick={() => { setLang('en'); setShowLangDropdown(false); }} className={`w-full text-left px-4 py-2 text-sm font-semibold hover:bg-slate-50 ${lang === 'en' ? 'text-sky-600' : 'text-slate-600'}`}>
                      English (EN)
                    </button>
                  </div>
                )}
              </div>

              {/* Notification Bell */}
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
                )}
              </button>

              {/* User Avatar + Dropdown */}
              <div className="relative ml-1" ref={dropdownRef}>
                <button
                  onClick={() => setShowUserDropdown(v => !v)}
                  className="flex items-center gap-2.5 pl-3 border-l border-slate-200 hover:opacity-90 transition-opacity"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden bg-sky-500">
                    {admin?.profilePhoto ? (
                      <img src={admin.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(admin?.displayName || admin?.email)
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-bold text-slate-700 leading-tight">{admin?.displayName || t('Admin')}</p>
                    <p className="text-xs text-slate-400">{admin?.email}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-800">{admin?.displayName || t('Admin')}</p>
                      <p className="text-xs text-slate-400 truncate">{admin?.email}</p>
                    </div>
                    <div className="py-1.5">
                      <Link
                        to="/settings"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <UserCog className="w-4 h-4" />
                        {t('Profile Settings')}
                      </Link>
                      <Link
                        to="/settings?tab=users"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        {t('User Management')}
                      </Link>
                    </div>
                    <div className="border-t border-slate-100 py-1.5">
                      <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('Sign Out')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-2 md:p-4 bg-slate-50">
            <Outlet />
          </main>
        </div>
      </div>

      <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </div>
  );
}
