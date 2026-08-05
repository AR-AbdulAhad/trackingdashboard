import { useQuery } from '@tanstack/react-query';
import { getAudienceGrowth, getEntryRate } from '../lib/api';
import PageHeader from '../components/PageHeader';
import { useDateRange } from '../context/DateRangeContext';
import { useI18n } from '../context/I18nContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Megaphone, Target, ArrowRight, MousePointerClick } from 'lucide-react';

const COLORS = {
  STX: '#0EA5E9',
  HHX: '#7C3AED',
  HTX: '#10B981',
  HF: '#F59E0B',
  EUD: '#EF4444',
  EUX: '#EC4899',
  'SOSU Assistent': '#14B8A6',
  'SOSU Hjælper': '#06B6D4',
  'Pædagog': '#F97316',
  PAU: '#6366F1',
  Kosmetolog: '#F43F5E',
  Frisør: '#D946EF',
  Ernæringsassistent: '#84CC16'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass text-slate-800 px-4 py-3 rounded-xl shadow-xl border border-slate-200 min-w-[150px]">
        <p className="font-bold text-sm mb-2 border-b border-slate-200 pb-1">{label}</p>
        {payload.map(p => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs font-semibold my-1">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="text-slate-600">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function MarketingDashboard() {
  const { from, to } = useDateRange();
  const { t } = useI18n();
  const { data: growthData, isLoading: growthLoading } = useQuery({
    queryKey: ['audience-growth', from, to],
    queryFn: () => getAudienceGrowth(from, to),
    retry: 1,
  });

  const { data: entryData, isLoading: entryLoading } = useQuery({
    queryKey: ['entry-rate', from, to],
    queryFn: () => getEntryRate(from, to),
    retry: 1,
  });

  const trendData = growthData?.trend || [];

  const Skeleton = () => (
    <div className="w-full h-[300px] bg-slate-50 rounded-xl animate-pulse border border-slate-100 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <PageHeader 
        title={t('Marketing Intelligence')} 
        description={t('Audience growth, entry points, and remarketing segments')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100">
              <Megaphone className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="font-bold text-slate-800 text-lg brand-text">{t('Audience Growth Trends')}</h2>
          </div>
          
          <div className="h-[300px] w-full relative">
            {growthLoading ? <Skeleton /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                  <defs>
                    {Object.entries(COLORS).map(([key, color]) => (
                      <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingTop: '10px' }} />
                  {Object.entries(COLORS).map(([key, color]) => (
                    <Area key={key} type="monotone" dataKey={key} stackId="1" stroke={color} fill={`url(#color${key})`} strokeWidth={2} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* High Intent / Remarketing */}
        <div className="space-y-6">
          <div className="card bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-indigo-500" />
              <h2 className="font-bold text-lg text-slate-800 brand-text">{t('High Intent Segments')}</h2>
            </div>
            <p className="text-slate-500 text-sm mb-6">
              {t('Audiences ready for retargeting campaigns based on recent behavior.')}
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                <span className="text-sm font-bold text-slate-700">{t('STX Premium Drop-offs')}</span>
                <button className="text-xs font-bold bg-white border border-slate-200 text-indigo-700 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-indigo-50 transition-colors">
                  {t('Export')} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                <span className="text-sm font-bold text-slate-700">{t('100% Milestone Reached')}</span>
                <button className="text-xs font-bold bg-white border border-slate-200 text-indigo-700 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-indigo-50 transition-colors">
                  {t('Export')} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="card border-t-4 border-t-sky-500 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <MousePointerClick className="w-5 h-5 text-sky-500" />
              <h2 className="font-bold text-slate-800 brand-text">{t('Website → Configurator Entry')}</h2>
            </div>
            {entryLoading ? (
              <div className="h-24 bg-slate-50 animate-pulse rounded-xl" />
            ) : (
              <div className="space-y-4 mt-2">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-500">{t('Graduation Cap Entry')}</span>
                    <span className="text-sky-600">{entryData?.gradcap?.started} / {entryData?.gradcap?.fromWordpress}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(entryData?.gradcap?.started / (entryData?.gradcap?.fromWordpress || 1)) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-500">{t('Studywear Entry')}</span>
                    <span className="text-indigo-600">{entryData?.studywear?.started} / {entryData?.studywear?.fromWordpress}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(entryData?.studywear?.started / (entryData?.studywear?.fromWordpress || 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
