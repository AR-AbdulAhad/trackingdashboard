import { useNotifications } from '../context/NotificationContext';
import { X, Bell, ExternalLink, MousePointerClick, TrendingUp, Users, AlertTriangle } from 'lucide-react';

const ICONS = {
  new_visitor: { icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
  new_conversion: { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  configurator_started: { icon: MousePointerClick, color: 'text-amber-500', bg: 'bg-amber-50' },
  iframe_crash: { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
  iframe_stuck: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
};

export default function NotificationPanel({ isOpen, onClose }) {
  const { notifications, markAllAsRead, markAsRead } = useNotifications();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l border-slate-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-slate-700" />
            <h2 className="font-bold text-lg text-slate-800 brand-text">Notifications</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Feed</span>
          <button onClick={markAllAsRead} className="text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors">
            Mark all read
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Bell className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">No new notifications</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const { icon: Icon, color, bg } = ICONS[notif.type] || ICONS.new_visitor;
              return (
                <div
                  key={notif.id}
                  className={`relative p-4 rounded-xl border cursor-pointer transition-all ${notif.read ? 'bg-white border-slate-200' : 'bg-sky-50 border-sky-200 shadow-sm'}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  {!notif.read && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-sky-500" />}
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div>
                      <p className={`text-sm mb-1 ${notif.read ? 'text-slate-700 font-medium' : 'text-slate-900 font-bold'}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-semibold text-slate-400">
                          {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {notif.visitorId && (
                          <a href={`/visitors?id=${notif.visitorId}`} className="text-xs font-bold text-sky-600 flex items-center gap-1 hover:underline">
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
