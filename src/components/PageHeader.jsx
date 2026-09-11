import { CalendarDays, ChevronRight } from 'lucide-react';
import { useDateRange } from '../context/DateRangeContext';
import { useI18n } from '../context/I18nContext';
import { useLocation } from 'react-router-dom';

export default function PageHeader({ title, description, hideDateFilter = false }) {
  const { from, to, setFrom, setTo } = useDateRange();
  const { t } = useI18n();
  const location = useLocation();

  const PRESETS = [
    { label: t('Today'), days: 0 },
    { label: t('Last 7 Days'), days: 7 },
    { label: t('Last 30 Days'), days: 30 },
    { label: t('All Time'), days: null },
  ];

  const handlePreset = (days) => {
    if (days === null) { setFrom(''); setTo(''); return; }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setTo(end.toISOString().split('T')[0]);
    setFrom(start.toISOString().split('T')[0]);
  };

  const getBreadcrumb = () => {
    const path = location.pathname.split('/')[1] || 'executive';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <div className="glass px-6 py-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in mb-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-sky-500 mb-2 uppercase tracking-wider">
          <span>Dashboard</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span>{getBreadcrumb()}</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 brand-text tracking-tight">{title}</h1>
        {description && <p className="text-slate-500 text-sm mt-1 font-medium">{description}</p>}
      </div>

      {!hideDateFilter && (
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 shadow-inner">
            {PRESETS.map((preset) => {
              const isAllTime = !from && !to && preset.days === null;
              return (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset.days)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    isAllTime
                      ? 'bg-white shadow-sm text-sky-600'
                      : 'text-slate-600 hover:bg-white/80 hover:shadow-sm'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
            <CalendarDays className="w-4 h-4 text-slate-400 ml-2" />
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="text-sm bg-transparent border-none outline-none text-slate-700 px-2 cursor-pointer font-medium"
            />
            <span className="text-slate-300">→</span>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="text-sm bg-transparent border-none outline-none text-slate-700 px-2 cursor-pointer font-medium"
            />
          </div>
        </div>
      )}
    </div>
  );
}
