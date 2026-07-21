import { useQuery } from '@tanstack/react-query';
import { getJourneySummary } from '../lib/api';
import PageHeader from '../components/PageHeader';
import { useDateRange } from '../context/DateRangeContext';
import { useI18n } from '../context/I18nContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Route, Clock, RotateCw, HandHeart } from 'lucide-react';

const PIE_COLORS = ['#F59E0B', '#E2E8F0'];

const StatCard = ({ title, value, desc, icon: Icon, color }) => (
  <div className="card animate-fade-in group hover:-translate-y-1 transition-transform cursor-default relative overflow-hidden bg-white">
    <div className="relative z-10 flex items-start justify-between">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-3"
        style={{ background: `${color}15` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div className="text-right">
        <p className="text-3xl font-extrabold text-slate-800 brand-text">{value}</p>
        <p className="text-sm font-bold text-slate-500">{title}</p>
      </div>
    </div>
    <div className="relative z-10 mt-4 pt-4 border-t border-slate-100">
      <p className="text-xs text-slate-500 font-medium">{desc}</p>
    </div>
  </div>
);

export default function JourneyDashboard() {
  const { from, to } = useDateRange();
  const { t } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ['journey-summary', from, to],
    queryFn: () => getJourneySummary(from, to),
    retry: 1,
  });

  const returnRatePct = (data?.returnRate * 100) || 0;
  const pieData = [
    { name: t('Returning'), value: returnRatePct },
    { name: t('Single Visit'), value: 100 - returnRatePct }
  ];

  const Skeleton = () => (
    <div className="w-full h-40 bg-slate-50 rounded-xl animate-pulse border border-slate-100" />
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <PageHeader 
        title={t('Customer Journey Analytics')} 
        description={t('Lifecycle tracking, behavioral insights, and returning visitor metrics')}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton /><Skeleton /><Skeleton /><Skeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title={t('Avg. Visits')}
            value={`${data?.avgVisitsBeforePurchase || 0}x`}
            desc={t('Average visits before a purchase occurs')}
            icon={Route}
            color="#0EA5E9"
          />
          <StatCard
            title={t('Return Interval')}
            value={`${data?.avgDaysBetweenVisits || 0}d`}
            desc={t('Average days between recurring visits')}
            icon={RotateCw}
            color="#F59E0B"
          />
          <StatCard
            title={t('Time to Convert')}
            value={`${data?.avgTimeToConversion || 0}m`}
            desc={t('Average minutes from first visit to purchase')}
            icon={Clock}
            color="#10B981"
          />
          <StatCard
            title={t('Loyalty Base')}
            value={data?.returningVisitors?.toLocaleString() || 0}
            desc={t('Number of users who visited multiple times')}
            icon={HandHeart}
            color="#7C3AED"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1 h-[340px] flex flex-col items-center justify-center text-center bg-white">
          <h2 className="font-bold text-slate-800 text-lg brand-text mb-4 w-full text-left pl-2">{t('Return Visitor Behavior')}</h2>
          {isLoading ? <Skeleton /> : (
            <>
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v.toFixed(1)}%`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2">
                <p className="text-3xl font-extrabold text-amber-500">{returnRatePct.toFixed(1)}%</p>
                <p className="text-sm font-bold text-slate-500">{t('Return Rate')}</p>
              </div>
            </>
          )}
        </div>

        <div className="card lg:col-span-2 h-[340px] bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Route className="w-64 h-64 text-slate-800" />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-slate-800 text-xl brand-text mb-2">{t('Journey Analysis')}</h2>
              <p className="text-slate-500 text-sm max-w-md">
                {t('Tracking user behavior from their first interaction to final purchase. Users typically require multiple touchpoints before committing to a configurator purchase.')}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-600 font-bold">1</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{t('Discovery Phase')}</p>
                  <p className="text-xs text-slate-500">{t('Users land on WordPress site and enter configurators.')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-amber-600 font-bold">2</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{t('Consideration')}</p>
                  <p className="text-xs text-slate-500">{t('Users return ~{days} days later to finalize designs.').replace('{days}', data?.avgDaysBetweenVisits || 0)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
