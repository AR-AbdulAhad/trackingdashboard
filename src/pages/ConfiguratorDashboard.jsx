import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConfiguratorFunnel, getExitPoints } from '../lib/api';
import PageHeader from '../components/PageHeader';
import { useDateRange } from '../context/DateRangeContext';
import { useI18n } from '../context/I18nContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { GraduationCap, Shirt, ArrowDown, LogOut } from 'lucide-react';

const COLORS_FUNNEL = ['#0EA5E9', '#38BDF8', '#7C3AED', '#A78BFA', '#10B981', '#34D399'];

const DropoffBadge = ({ pct, t }) => {
  const color = pct > 50 ? '#EF4444' : pct > 25 ? '#F59E0B' : '#10B981';
  return (
    <div className="flex flex-col items-center my-1 z-10 relative">
      <div className="w-px h-3 bg-slate-200"></div>
      <div className="flex items-center gap-1 bg-white border px-2 py-0.5 rounded-full shadow-sm" style={{ borderColor: `${color}40` }}>
        <ArrowDown className="w-3 h-3" style={{ color }} />
        <span className="text-xs font-bold" style={{ color }}>{pct.toFixed(0)}% {t('drop')}</span>
      </div>
      <div className="w-px h-3 bg-slate-200"></div>
    </div>
  );
};

export default function ConfiguratorDashboard() {
  const { from, to } = useDateRange();
  const [tab, setTab] = useState('gradcap');
  const { t } = useI18n();

  const FUNNEL_STEPS = [
    { key: 'started', label: t('Started') },
    { key: 'm25',     label: t('25% Done') },
    { key: 'm50',     label: t('50% Done') },
    { key: 'm75',     label: t('75% Done') },
    { key: 'm100',    label: t('100% Done') },
    { key: 'purchased', label: t('Purchased') },
  ];

  const { data: funnelData, isLoading } = useQuery({
    queryKey: ['funnel', tab, from, to],
    queryFn: () => getConfiguratorFunnel(tab, from, to),
    retry: 1,
  });

  const { data: exitData, isLoading: exitLoading } = useQuery({
    queryKey: ['exits', tab, from, to],
    queryFn: () => getExitPoints(tab, from, to),
    retry: 1,
  });

  const chartData = FUNNEL_STEPS.map(({ key, label }) => ({
    name: label,
    value: funnelData?.[key] ?? 0,
  }));

  const startVal = funnelData?.started || 1;
  const dropoffs = FUNNEL_STEPS.slice(1).map((step, i) => {
    const prev = funnelData?.[FUNNEL_STEPS[i].key] || 1;
    const curr = funnelData?.[step.key] || 0;
    return prev > 0 ? ((prev - curr) / prev) * 100 : 0;
  });

  const exitChartData = Object.entries(exitData || {}).map(([key, val]) => {
    const label = FUNNEL_STEPS.find(s => s.key === key)?.label || key;
    return { name: label, value: val };
  }).filter(d => d.value > 0);

  const Skeleton = () => (
    <div className="w-full h-full bg-slate-50 rounded-xl animate-pulse border border-slate-100" />
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <PageHeader 
        title={t('Configurator Analytics')} 
        description={t('Funnel performance, completion rates, and exit points')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1.5 border border-slate-200 shadow-inner w-fit">
          {[
            { key: 'gradcap', label: t('Graduation Cap'), icon: GraduationCap },
            { key: 'studywear', label: t('Studywear'), icon: Shirt },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                tab === key
                  ? 'bg-white text-sky-600 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drop-off funnel */}
        <div className="card lg:row-span-2">
          <h2 className="font-bold text-slate-800 text-lg brand-text mb-6">{t('Step-by-Step Flow')}</h2>
          {isLoading ? (
            <div className="h-[500px] bg-slate-50 rounded-xl animate-pulse" />
          ) : (
            <div className="space-y-0 pb-4">
              {FUNNEL_STEPS.map(({ key, label }, i) => {
                const val = funnelData?.[key] ?? 0;
                const pct = startVal > 0 ? (val / startVal) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="funnel-step p-4 rounded-2xl border" style={{
                      background: `linear-gradient(90deg, ${COLORS_FUNNEL[i]}15 0%, ${COLORS_FUNNEL[i]}05 100%)`,
                      borderColor: `${COLORS_FUNNEL[i]}30`
                    }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-base font-bold text-slate-700">{label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-extrabold text-slate-800">{val.toLocaleString()}</span>
                          <span className="badge" style={{ background: `${COLORS_FUNNEL[i]}20`, color: COLORS_FUNNEL[i] }}>
                            {pct.toFixed(1)}% {t('of total')}
                          </span>
                        </div>
                      </div>
                      <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner border border-slate-100">
                        <div className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${Math.max(pct, 0)}%`, background: COLORS_FUNNEL[i] }} />
                      </div>
                    </div>
                    {i < FUNNEL_STEPS.length - 1 && <DropoffBadge pct={dropoffs[i] || 0} t={t} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bar chart */}
        <div className="card h-[380px] flex flex-col">
          <h2 className="font-bold text-slate-800 text-lg brand-text mb-6">{t('Volume Overview')}</h2>
          <div className="flex-1 min-h-0 relative">
            {isLoading ? (
              <Skeleton />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [`${v} ${t('visitors')}`]}
                    cursor={{ fill: 'rgba(14,165,233,0.05)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS_FUNNEL[i % COLORS_FUNNEL.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Exit Points */}
        <div className="card h-[380px] flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <LogOut className="w-5 h-5 text-red-400" />
            <h2 className="font-bold text-slate-800 text-lg brand-text">{t('Most Common Exit Points')}</h2>
          </div>
          <div className="flex-1 min-h-0 relative">
            {exitLoading ? (
              <Skeleton />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={exitChartData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                  <defs>
                    <linearGradient id="colorExit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [`${v} ${t('exits')}`]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExit)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
