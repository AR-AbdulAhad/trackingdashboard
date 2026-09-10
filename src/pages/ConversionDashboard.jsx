import { useQuery } from '@tanstack/react-query';
import { getConversionRates } from '../lib/api';
import PageHeader from '../components/PageHeader';
import { useDateRange } from '../context/DateRangeContext';
import { useI18n } from '../context/I18nContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { TrendingUp, GraduationCap, Package, Shirt } from 'lucide-react';

const COLORS = ['#0EA5E9', '#7C3AED', '#10B981', '#F59E0B'];

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
        <p className="text-emerald-600 font-bold">{payload[0].value.toFixed(1)}% {t('Conversion Rate')}</p>
      </div>
    );
  }
  return null;
};

export default function ConversionDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['conversion-rates'],
    queryFn: () => getConversionRates(),
    retry: 1,
  });

  const { t } = useI18n();

  const eduData = Object.entries(data?.byEducation || {}).map(([name, val]) => ({
    name, value: val * 100
  }));

  const pkgData = Object.entries(data?.byPackage || {}).map(([name, val]) => ({
    name: t(name.charAt(0).toUpperCase() + name.slice(1)), value: val * 100
  }));

  const productData = Object.entries(data?.byProduct || {}).map(([name, val]) => ({
    name: name === 'gradcap' ? t('Graduation Cap') : t('Studywear'), value: val * 100
  }));

  const Skeleton = () => (
    <div className="w-full h-full bg-slate-50 rounded-xl animate-pulse border border-slate-100 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <PageHeader 
        title={t('Conversion Intelligence')} 
        description={t('Conversion rates segmented by audience attributes')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Education CR */}
        <ChartCard title={t('Conversion by Education Type')} icon={GraduationCap}>
          {isLoading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={eduData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Radar name={t('Conversion Rate')} dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.4} />
                <Tooltip content={<CustomTooltip t={t} />} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Package CR */}
        <ChartCard title={t('Package Conversion Performance')} icon={Package}>
          {isLoading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pkgData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip t={t} />} cursor={{ fill: 'rgba(16,185,129,0.05)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {pkgData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Product CR */}
        <ChartCard title={t('Conversion by Product Category')} icon={Shirt}>
          {isLoading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData} layout="vertical" margin={{ top: 10, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<CustomTooltip t={t} />} cursor={{ fill: 'rgba(14,165,233,0.05)' }} />
                <Bar dataKey="value" fill="#0EA5E9" radius={[0, 6, 6, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        
        {/* Insights Card */}
        <div className="card bg-emerald-50 border border-emerald-100 flex flex-col justify-center items-center text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 brand-text mb-2">{t('Conversion Insights')}</h2>
          <p className="text-slate-600 text-sm mb-6 max-w-sm">
            {t('Based on the data,')} <strong>Premium</strong> {t('packages typically convert at a higher rate than Standard packages. Consider offering targeted upsells to the STX demographic.')}
          </p>
          <div className="flex gap-2">
            <span className="badge badge-green px-3 py-1.5 text-sm">{t('Target STX Segment')}</span>
            <span className="badge badge-blue px-3 py-1.5 text-sm">{t('Boost Studywear')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
