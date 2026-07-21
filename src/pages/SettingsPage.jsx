import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import { apiRequest } from '../lib/api';
import {
  UserCog, Shield, Save, Eye, EyeOff, Plus, Trash2,
  CheckCircle, AlertCircle, RefreshCw, Crown, User, Lock, Upload, Edit, X
} from 'lucide-react';

const ROLE_META = {
  SUPERADMIN: { label: 'Super Admin', color: 'text-rose-500', bg: 'bg-rose-50 border-rose-200', icon: Crown },
  ADMIN: { label: 'Admin', color: 'text-sky-500', bg: 'bg-sky-50 border-sky-200', icon: Shield },
  VIEWER: { label: 'Viewer', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', icon: User },
};

const AVAILABLE_PAGES = [
  { id: '/', label: 'Executive' },
  { id: '/audience', label: 'Audience' },
  { id: '/funnel', label: 'Configurators' },
  { id: '/conversion', label: 'Conversions' },
  { id: '/journey', label: 'Customer Journey' },
  { id: '/marketing', label: 'Marketing Intel' },
  { id: '/visitors', label: 'Visitor Data' },
  { id: '/settings', label: 'Settings (User Management)' },
];

function Alert({ type, message }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold animate-fade-in ${isError ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
      {isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
      {message}
    </div>
  );
}

// ── Profile Tab ─────────────────────────────────────────────────────────────
function ProfileTab() {
  const { admin, updateAdmin } = useAuth();
  const [displayName, setDisplayName] = useState(admin?.displayName || '');
  const [profilePhoto, setProfilePhoto] = useState(admin?.profilePhoto || null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setAlert({ type: 'error', message: 'Image must be less than 2MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setAlert(null);
    try {
      const body = { displayName, profilePhoto };
      if (newPassword) { body.currentPassword = currentPassword; body.newPassword = newPassword; }
      const res = await apiRequest('/api/auth/profile', { method: 'PUT', body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const { token, admin: updated } = await res.json();
      localStorage.setItem('adminToken', token);
      updateAdmin(updated);
      setCurrentPassword(''); setNewPassword('');
      setAlert({ type: 'success', message: 'Profile updated successfully!' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const initials = (admin?.displayName || admin?.email || 'A').substring(0, 2).toUpperCase();

  return (
    <div className="max-w-xl space-y-6">
      {alert && <Alert type={alert.type} message={alert.message} />}

      {/* Avatar */}
      <div className="card flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shrink-0 overflow-hidden bg-sky-500 relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-700 mb-1">Profile Photo</p>
          <p className="text-xs text-slate-500 mb-3">Upload a new profile picture (Max 2MB)</p>
          <button onClick={() => fileInputRef.current?.click()} className="btn-ghost text-xs py-1.5 px-4 rounded-lg">Choose Image</button>
          {profilePhoto && (
            <button onClick={() => setProfilePhoto(null)} className="text-xs text-red-500 font-bold ml-4 hover:underline">Remove</button>
          )}
        </div>
      </div>

      {/* Display Name */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <UserCog className="w-5 h-5 text-sky-500" />
          <h3 className="font-bold text-slate-800 brand-text text-lg">Personal Info</h3>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Display Name</label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)}
            placeholder="Your display name"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email</label>
          <input value={admin?.email || ''} disabled
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 text-sm font-medium cursor-not-allowed" />
        </div>
      </div>

      {/* Password */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Lock className="w-5 h-5 text-purple-500" />
          <h3 className="font-bold text-slate-800 brand-text text-lg">Change Password</h3>
          <span className="text-xs text-slate-400 font-medium">(Leave blank to keep current)</span>
        </div>
        {[
          { label: 'Current Password', value: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
          { label: 'New Password', value: newPassword, set: setNewPassword, show: showNew, toggle: () => setShowNew(v => !v) },
        ].map(({ label, value, set, show, toggle }) => (
          <div key={label}>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={value} onChange={e => set(e.target.value)} placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all" />
              <button onClick={toggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleSave} disabled={loading}
        className="btn-primary flex items-center gap-2 w-full justify-center">
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

// ── Users & Permissions Tab ──────────────────────────────────────────────────
function UsersTab() {
  const { admin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [editMode, setEditMode] = useState(null); // 'add' or userId
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [pageAccess, setPageAccess] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/users');
      if (res.ok) setUsers(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openAdd = () => {
    setEditMode('add');
    setEmail(''); setPassword(''); setDisplayName(''); setRole('VIEWER'); setPageAccess([]);
  };

  const openEdit = (user) => {
    setEditMode(user.id);
    setEmail(user.email); setDisplayName(user.displayName || ''); setRole(user.role); setPageAccess(user.pageAccess || []);
  };

  const closeForm = () => {
    setEditMode(null);
    setAlert(null);
  };

  const handleTogglePage = (pageId) => {
    setPageAccess(prev => prev.includes(pageId) ? prev.filter(p => p !== pageId) : [...prev, pageId]);
  };

  const handleSaveUser = async () => {
    setSaving(true); setAlert(null);
    try {
      if (editMode === 'add') {
        const res = await apiRequest('/api/users', { 
          method: 'POST', 
          body: JSON.stringify({ email, password, displayName, role, pageAccess }) 
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
        const created = await res.json();
        setUsers(u => [...u, created]);
        setAlert({ type: 'success', message: `User ${created.email} added successfully!` });
      } else {
        const res = await apiRequest(`/api/users/${editMode}/access`, { 
          method: 'PUT', 
          body: JSON.stringify({ role, pageAccess }) 
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
        const updated = await res.json();
        setUsers(u => u.map(user => user.id === editMode ? { ...user, role: updated.role, pageAccess: updated.pageAccess } : user));
        setAlert({ type: 'success', message: 'User updated successfully' });
      }
      setEditMode(null);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async (userId, userEmail) => {
    if (!confirm(`Delete user "${userEmail}"? This cannot be undone.`)) return;
    setAlert(null);
    try {
      const res = await apiRequest(`/api/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setUsers(u => u.filter(user => user.id !== userId));
      setAlert({ type: 'success', message: 'User deleted successfully' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {alert && <Alert type={alert.type} message={alert.message} />}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800 brand-text">Team Members</h3>
          <p className="text-sm text-slate-500 mt-0.5">{users.length} users total</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Edit / Add User Form */}
      {editMode && (
        <div className="card border-2 border-sky-200 space-y-4 animate-fade-in relative shadow-lg">
          <button onClick={closeForm} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          <h4 className="font-bold text-slate-800 text-base">{editMode === 'add' ? 'New User Details' : 'Edit User Access'}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={editMode !== 'add'}
                placeholder="user@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-sky-400 disabled:opacity-50" />
            </div>
            {editMode === 'add' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-sky-400" />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Display Name</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} disabled={editMode !== 'add'}
                placeholder="Optional"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-sky-400 disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Role</label>
              <select value={role} onChange={e => setRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-sky-400">
                <option value="VIEWER">Viewer (Read-only)</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPERADMIN">Super Admin (All Access)</option>
              </select>
            </div>
          </div>

          {/* Page Permissions Checklist */}
          {role !== 'SUPERADMIN' && (
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Sidebar Page Access</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_PAGES.map(page => {
                  const hasAccess = pageAccess.includes(page.id);
                  return (
                    <label key={page.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${hasAccess ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <input type="checkbox" className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                        checked={hasAccess} onChange={() => handleTogglePage(page.id)} />
                      <span className={`text-sm font-semibold ${hasAccess ? 'text-sky-700' : 'text-slate-600'}`}>{page.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button onClick={handleSaveUser} disabled={saving} className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save User'}
            </button>
            <button onClick={closeForm} className="btn-ghost text-sm py-2.5 px-5">Cancel</button>
          </div>
        </div>
      )}

      {/* Users List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(user => {
            const roleMeta = ROLE_META[user.role] || ROLE_META.VIEWER;
            const RoleIcon = roleMeta.icon;
            const isSelf = user.id === admin?.id;
            return (
              <div key={user.id} className={`card flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${editMode === user.id ? 'border-sky-400 ring-4 ring-sky-50' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden bg-sky-500 shadow-sm">
                    {user.profilePhoto ? (
                      <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      (user.displayName || user.email).substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      {user.displayName || 'No Name'}
                      {isSelf && <span className="ml-2 text-xs text-sky-500 font-bold">(You)</span>}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${roleMeta.bg} ${roleMeta.color}`}>
                    <RoleIcon className="w-3.5 h-3.5" />
                    {roleMeta.label}
                  </div>
                  {!isSelf && (
                    <>
                      <button onClick={() => openEdit(user)} title="Edit Access"
                        className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-sky-600 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(user.id, user.email)} title="Delete User"
                        className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Settings Page ────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserCog },
    { id: 'users', label: 'Users & Permissions', icon: Shield },
  ];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Settings" description="Manage your profile and team access" hideDateFilter />

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl w-fit shadow-inner">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSearchParams({ tab: id })}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === id
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' ? <ProfileTab /> : <UsersTab />}
    </div>
  );
}
