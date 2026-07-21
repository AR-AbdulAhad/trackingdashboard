import { useQuery } from '@tanstack/react-query';
import { getAudienceOverview } from '../lib/api';
import PageHeader from '../components/PageHeader';
import { useDateRange } from '../context/DateRangeContext';
import { useI18n } from '../context/I18nContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, GraduationCap, School, CalendarDays, Package } from 'lucide-react';

const COLORS = ['#0EA5E9', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16'];
const PIE_COLORS = ['#0EA5E9', '#F59E0B'];

const ChartCard = ({ title, icon: Icon, children }) => (
  <div className="card animate-fade-in flex flex-col h-[380px]">
    <div className="flex items-center gap-3 mb-6 shrink-0">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100">
        <Icon className="w-5 h-5 text-slate-600" />
      </div>
      <h2 className="font-bold text-slate-800 text-lg brand-text">{title}</h2>
    </div>
    <div className="flex-1 min-h-0 w-full relative">
      {children}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label, t }) => {
  if (active && payload?.length) {
    return (
      <div className="glass text-slate-800 px-4 py-3 rounded-xl shadow-xl border border-slate-200">
        <p className="font-bold text-sm mb-1">{label}</p>
        <p className="text-sky-600 font-semibold">{payload[0].value.toLocaleString()} {t('users')}</p>
      </div>
    );
  }
  return null;
};

export default function AudienceDashboard() {
  const { from, to } = useDateRange();
  const { t } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ['audience-overview', from, to],
    queryFn: () => getAudienceOverview(from, to),
    retry: 1,
  });

  const eduData = Object.entries(data?.byEducation || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const schoolData = Object.entries(data?.bySchool || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const gradYearData = Object.entries(data?.byGradYear || {})
    .map(([name, value]) => ({ name: String(name), value }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const packageData = Object.entries(data?.byPackage || {})
    .map(([name, value]) => ({ name: t(name.charAt(0).toUpperCase() + name.slice(1)), value }));

  const Skeleton = () => (
    <div className="w-full h-full bg-slate-50/50 rounded-xl animate-pulse border border-slate-100 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin"></div>
    </div>
  );

  const EmptyState = () => (
    <div className="w-full h-full flex items-center justify-center flex-col text-slate-400">
      <Users className="w-8 h-8 mb-2 opacity-50" />
      <p className="text-sm font-medium">{t('No data yet')}</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <PageHeader 
        title={t('Audience Intelligence')} 
        description={t('Visitor demographics, segmentation, and preferences')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Education Type */}
        <ChartCard title={t('Education Segment Distribution')} icon={GraduationCap}>
          {isLoading ? <Skeleton /> : eduData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eduData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip t={t} />} cursor={{ fill: 'rgba(14,165,233,0.05)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {eduData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartCard>

        {/* Package Preference Pie */}
        <ChartCard title={t('Package Preference Split')} icon={Package}>
          {isLoading ? <Skeleton /> : packageData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={packageData}
                  cx="50%" cy="45%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#CBD5E1', strokeWidth: 1 }}
                >
                  {packageData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 500, paddingTop: '20px' }} />
                <Tooltip formatter={(v) => [`${v} ${t('users')}`]} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartCard>

        {/* Graduation Year */}
        <ChartCard title={t('Anticipated Graduation Year')} icon={CalendarDays}>
          {isLoading ? <Skeleton /> : gradYearData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradYearData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip t={t} />} cursor={{ fill: 'rgba(124,58,237,0.05)' }} />
                <Bar dataKey="value" fill="#7C3AED" radius={[6, 6, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartCard>

        {/* Top Schools */}
        <ChartCard title={t('Top 10 Schools by Engagement')} icon={School}>
          {isLoading ? <Skeleton /> : schoolData.length ? (
            <div className="space-y-3 h-full overflow-y-auto pr-3 absolute inset-0">
              {schoolData.map(({ name, value }, i) => {
                const max = schoolData[0].value || 1;
                const pct = Math.round((value / max) * 100);
                return (
                  <div key={name} className="flex items-center gap-4 group">
                    <span className="text-xs font-bold text-slate-300 w-5 text-right transition-colors group-hover:text-sky-400">{i + 1}</span>
                    <div className="flex-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 group-hover:border-slate-200 group-hover:bg-white transition-all">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm font-semibold text-slate-700 truncate max-w-[70%]">{name}</span>
                        <span className="text-sm font-bold text-slate-600">{value.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState />}
        </ChartCard>
      </div>
    </div>
  );
}
