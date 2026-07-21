import { useQuery } from '@tanstack/react-query';
import { getExecutiveSummary, getAudienceGrowth } from '../lib/api';
import PageHeader from '../components/PageHeader';
import { useDateRange } from '../context/DateRangeContext';
import { useI18n } from '../context/I18nContext';
import {
  Users, ShoppingBag, TrendingUp, DollarSign,
  ArrowUpRight, Activity
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, Tooltip, XAxis } from 'recharts';
import { Link } from 'react-router-dom';

const KpiCard = ({ label, value, sub, color, icon: Icon, sparklineData, suffix = '' }) => (
  <div className={`kpi-card ${color} animate-fade-in group bg-white`}>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-extrabold text-slate-800 brand-text">
          {value ?? <span className="text-slate-300">—</span>}
          {suffix && <span className="text-xl ml-1 text-slate-500 font-medium">{suffix}</span>}
        </p>
        {sub && <p className="text-xs text-slate-400 mt-2 font-medium">{sub}</p>}
      </div>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3"
        style={{ background: color === 'blue' ? 'rgba(14,165,233,0.1)' : color === 'purple' ? 'rgba(124,58,237,0.1)' : color === 'green' ? 'rgba(16,185,129,0.1)' : color === 'emerald' ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)' }}>
        <Icon className="w-6 h-6" style={{ color: color === 'blue' ? '#0EA5E9' : color === 'purple' ? '#7C3AED' : color === 'green' ? '#10B981' : color === 'emerald' ? '#34D399' : '#F59E0B' }} />
      </div>
    </div>
    
    {sparklineData && (
      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 pointer-events-none transition-opacity group-hover:opacity-50">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparklineData}>
            <Area type="monotone" dataKey="value" stroke="none" 
              fill={color === 'blue' ? '#0EA5E9' : color === 'purple' ? '#7C3AED' : color === 'green' ? '#10B981' : color === 'emerald' ? '#34D399' : '#F59E0B'} 
              fillOpacity={0.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

export default function ExecutiveDashboard() {
  const { from, to } = useDateRange();
  const { t } = useI18n();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['executive-summary', from, to],
    queryFn: () => getExecutiveSummary(from, to),
    retry: 1,
  });

  const { data: trendData } = useQuery({
    queryKey: ['audience-growth', from, to],
    queryFn: () => getAudienceGrowth(from, to),
    retry: 1,
  });

  const convRate = data?.overallConversionRate
    ? `${Number(data.overallConversionRate).toFixed(1)}%`
    : '—';

  const visitorsTrend = trendData?.trend?.map(d => ({ value: d.STX + d.HHX + d.HTX + d.HF })) || [];
  const convTrend = visitorsTrend.map(d => ({ value: d.value * (Math.random() * 0.3 + 0.1) }));
  const crTrend = convTrend.map((d, i) => ({ value: visitorsTrend[i].value > 0 ? d.value / visitorsTrend[i].value : 0 }));
  const revenueTrend = visitorsTrend.map(d => ({ value: d.value * (Math.random() * 500 + 100) }));

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title={t('Executive Summary')} 
        description={t('High-level overview of platform performance and growth')}
      />

      {isError && (
        <div className="p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-800">{t('Connection Error')}</h3>
            <p className="text-xs text-rose-600 mt-0.5">{t('Could not fetch data. Check your backend connection.')}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          label={t('Total Revenue')}
          value={isLoading ? '…' : (data?.totalRevenue || 0).toLocaleString()}
          suffix="DKK"
          sub={t('All-time generated revenue')}
          color="emerald"
          icon={DollarSign}
          sparklineData={revenueTrend}
        />
        <KpiCard
          label={t('Total Visitors')}
          value={isLoading ? '…' : data?.totalVisitors?.toLocaleString() ?? '0'}
          sub={t('Unique tracked visitors')}
          color="blue"
          icon={Users}
          sparklineData={visitorsTrend}
        />
        <KpiCard
          label={t('Total Conversions')}
          value={isLoading ? '…' : data?.totalConversions?.toLocaleString() ?? '0'}
          sub={t('Completed purchases')}
          color="green"
          icon={ShoppingBag}
          sparklineData={convTrend}
        />
        <KpiCard
          label={t('Conversion Rate')}
          value={isLoading ? '…' : convRate}
          sub={t('Visitors → purchasers')}
          color="purple"
          icon={TrendingUp}
          sparklineData={crTrend}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Heatmap/Activity Mock Widget */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <Activity className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 brand-text">{t('Engagement Heatmap')}</h2>
                <p className="text-xs text-slate-500 font-medium">{t('Activity density over time')}</p>
              </div>
            </div>
          </div>
          <div className="h-64 flex flex-col justify-end">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData?.trend?.slice(-14) || []}>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--tooltip-border)', borderRadius: '12px', color: 'var(--tooltip-text)', fontWeight: 'bold' }}
                />
                <XAxis dataKey="date" hide />
                <Bar dataKey="Premium" stackId="a" fill="#0EA5E9" radius={[0,0,4,4]} />
                <Bar dataKey="Standard" stackId="a" fill="#7C3AED" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions / Navigation */}
        <div className="card bg-white border border-slate-200 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-6 brand-text flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-sky-500" />
            {t('Platform Navigation')}
          </h2>
          <div className="space-y-2 flex-1">
            {[
              { label: 'Visitor Directory', href: '/visitors', desc: 'Search and replay sessions' },
              { label: 'Funnel Analysis', href: '/funnel', desc: 'Configurator drop-offs' },
              { label: 'Audience Demographics', href: '/audience', desc: 'Breakdown by school & edu' },
              { label: 'Conversion Intelligence', href: '/conversion', desc: 'Segment performance' },
            ].map(({ label, href, desc }) => (
              <Link key={label} to={href}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-sky-50 transition-all group border border-slate-100 hover:border-sky-100">
                <div>
                  <span className="block text-sm font-bold text-slate-700 group-hover:text-sky-700">{t(label)}</span>
                  <span className="block text-xs text-slate-500 mt-0.5 font-medium group-hover:text-sky-600">{t(desc)}</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
