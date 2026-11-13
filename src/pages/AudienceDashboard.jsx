import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAudienceOverview } from '../lib/api';
import PageHeader from '../components/PageHeader';
import { useDateRange } from '../context/DateRangeContext';
import { useI18n } from '../context/I18nContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { Users, GraduationCap, School, CalendarDays, Package, UserCheck, Crown, ChevronDown } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                 */
/* ------------------------------------------------------------------ */

// Fixed tier order + validated CVD-safe colours (identity follows the package, never its rank)
const PACKAGE_ORDER = ['basic', 'standard', 'premium', 'luksus'];
const PACKAGE_COLORS = { basic: '#D97706', standard: '#7C3AED', premium: '#0284C7', luksus: '#059669' };

const fmt = (n) => (n ?? 0).toLocaleString('da-DK');
const pct = (part, total) => (total ? Math.round((part / total) * 100) : 0);
const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

function Card({ title, subtitle, icon: Icon, right, children, className = '' }) {
  return (
    <div className={`card !p-5 sm:!p-6 flex flex-col min-w-0 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-50 ring-1 ring-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-slate-800 brand-text text-base sm:text-[17px] leading-tight">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function StatTile({ label, value, hint, icon: Icon, tone, loading }) {
  return (
    <div className="card !p-4 sm:!p-5 min-w-0">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <p className="min-w-0 break-words text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-[0.08em] sm:tracking-[0.12em] leading-snug">{label}</p>
        <div className={`w-9 h-9 rounded-xl hidden sm:flex items-center justify-center shrink-0 ${tone}`}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
      </div>
      {loading ? (
        <div className="mt-3 space-y-2">
          <div className="h-8 w-20 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
        </div>
      ) : (
        <>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 brand-text mt-2 tabular-nums truncate">{value}</p>
          {hint && <p className="text-xs text-slate-400 mt-1.5 font-medium truncate">{hint}</p>}
        </>
      )}
    </div>
  );
}

function ListSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-8 rounded-lg bg-slate-100 animate-pulse" style={{ opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  );
}

function Empty({ text, icon: Icon = Users }) {
  return (
    <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center px-6">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 ring-1 ring-slate-100 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-sm text-slate-400 max-w-xs">{text}</p>
    </div>
  );
}

function RankBar({ rank, label, value, share, barPct, color = 'bg-sky-600' }) {
  return (
    <div className="flex items-center gap-3 min-w-0" title={`${label}: ${fmt(value)} (${share}%)`}>
      {rank !== undefined && (
        <span className={`w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center shrink-0 ${
          rank <= 3 ? 'bg-slate-900 text-white' : 'bg-white ring-1 ring-slate-200 text-slate-500'
        }`}>{rank}</span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-semibold text-slate-700 truncate flex-1 min-w-0">{label}</span>
          <span className="text-xs text-slate-400 tabular-nums shrink-0">{share}%</span>
          <span className="text-sm font-bold text-slate-900 tabular-nums shrink-0 min-w-[2.5rem] text-right">{fmt(value)}</span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${Math.max(barPct, 1.5)}%` }} />
        </div>
      </div>
    </div>
  );
}

function DarkTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-slate-900 text-white px-3.5 py-2.5 shadow-xl text-xs">
      <p className="text-slate-400 font-medium mb-0.5">{label ?? payload[0].name}</p>
      <p className="font-bold text-sm tabular-nums">{fmt(payload[0].value)} <span className="font-medium text-slate-300">{unit}</span></p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AudienceDashboard() {
  const { from, to } = useDateRange();
  const { t } = useI18n();
  const [showAllEdu, setShowAllEdu] = useState(false);
  const [showAllSchools, setShowAllSchools] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['audience-overview', from, to],
    queryFn: () => getAudienceOverview(from, to),
    retry: 1,
  });

  const totals = data?.totals || {};

  // Education — only segments with visitors, largest first
  const eduAll = Object.entries(data?.byEducation || {})
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const eduTotal = eduAll.reduce((s, d) => s + d.value, 0);
  const eduMax = eduAll[0]?.value || 1;
  const eduShown = showAllEdu ? eduAll : eduAll.slice(0, 8);

  // Schools
  const schoolsAll = Object.entries(data?.bySchool || {})
    .map(([name, value]) => ({ name, value }))
    .filter(({ name, value }) => name.trim() && value > 0)
    .sort((a, b) => b.value - a.value);
  const schoolTotal = schoolsAll.reduce((s, d) => s + d.value, 0);
  const schoolMax = schoolsAll[0]?.value || 1;
  const schoolsShown = showAllSchools ? schoolsAll.slice(0, 25) : schoolsAll.slice(0, 10);

  // Graduation year
  const gradYearData = Object.entries(data?.byGradYear || {})
    .map(([name, value]) => ({ name: String(name), value }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Packages — fixed tier order
  const byPackage = data?.byPackage || {};
  const packages = PACKAGE_ORDER.map((key) => ({
    key, name: t(titleCase(key)), value: byPackage[key] || 0, color: PACKAGE_COLORS[key],
  }));
  const packageTotal = packages.reduce((s, p) => s + p.value, 0);
  const topPackage = [...packages].sort((a, b) => b.value - a.value)[0];

  const visitors = totals.visitors ?? 0;

  return (
    <div className="space-y-6 animate-fade-in pb-10 min-w-0">
      <PageHeader
        title={t('Audience Intelligence')}
        description={t('Visitor demographics, segmentation, and preferences')}
      />

      {/* ---------- Headline tiles ---------- */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
        <StatTile loading={isLoading} label={t('Visitors')} value={fmt(visitors)}
          hint={t('Visitors in selected range')} icon={Users} tone="bg-sky-50 text-sky-600" />
        <StatTile loading={isLoading} label={t('With education profile')} value={`${pct(totals.withEducation, visitors)}%`}
          hint={`${fmt(totals.withEducation)} ${t('of visitors')}`} icon={UserCheck} tone="bg-violet-50 text-violet-600" />
        <StatTile loading={isLoading} label={t('Schools represented')} value={fmt(schoolsAll.length)}
          hint={`${fmt(totals.withSchool ?? schoolTotal)} ${t('visitors with a school')}`} icon={School} tone="bg-emerald-50 text-emerald-600" />
        <StatTile loading={isLoading} label={t('Most popular package')}
          value={packageTotal ? topPackage.name : '—'}
          hint={packageTotal ? `${pct(topPackage.value, packageTotal)}% ${t('of package choices')}` : t('No data yet')}
          icon={Crown} tone="bg-amber-50 text-amber-600" />
      </div>

      {/* ---------- Education + Packages ---------- */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <Card
          className="xl:col-span-3"
          icon={GraduationCap}
          title={t('Education Segment Distribution')}
          subtitle={eduTotal ? `${fmt(eduTotal)} ${t('profiled visitors')} · ${eduAll.length} ${t('segments')}` : null}
        >
          {isLoading ? <ListSkeleton rows={8} /> : eduAll.length ? (
            <>
              <div className="space-y-3.5">
                {eduShown.map((d) => (
                  <RankBar key={d.name} label={d.name} value={d.value}
                    share={pct(d.value, eduTotal)} barPct={(d.value / eduMax) * 100} color="bg-sky-600" />
                ))}
              </div>
              {eduAll.length > 8 && (
                <button onClick={() => setShowAllEdu((v) => !v)}
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 cursor-pointer">
                  {showAllEdu ? t('Show less') : `${t('Show all')} (${eduAll.length})`}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAllEdu ? 'rotate-180' : ''}`} />
                </button>
              )}
            </>
          ) : <Empty text={t('No data yet')} icon={GraduationCap} />}
        </Card>

        <Card className="xl:col-span-2" icon={Package} title={t('Package Preference Split')}
          subtitle={packageTotal ? `${fmt(packageTotal)} ${t('choices')}` : null}>
          {isLoading ? <ListSkeleton rows={5} /> : packageTotal ? (
            <div className="flex flex-col sm:flex-row xl:flex-col 2xl:flex-row items-center gap-6">
              <div className="relative w-[200px] h-[200px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={packages.filter((p) => p.value > 0)} dataKey="value" nameKey="name"
                      innerRadius={66} outerRadius={96} paddingAngle={2} cornerRadius={4}
                      stroke="#fff" strokeWidth={2} startAngle={90} endAngle={-270}>
                      {packages.filter((p) => p.value > 0).map((p) => <Cell key={p.key} fill={p.color} />)}
                    </Pie>
                    <Tooltip content={<DarkTooltip unit={t('users')} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('Total')}</span>
                  <span className="text-2xl font-extrabold text-slate-900 brand-text tabular-nums">{fmt(packageTotal)}</span>
                </div>
              </div>

              <div className="w-full flex-1 min-w-0 space-y-2">
                {packages.map((p) => (
                  <div key={p.key} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50/70 ring-1 ring-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                    <span className="text-sm font-semibold text-slate-700 flex-1 truncate">{p.name}</span>
                    <span className="text-xs text-slate-400 tabular-nums">{fmt(p.value)}</span>
                    <span className="text-sm font-bold text-slate-900 tabular-nums w-11 text-right">{pct(p.value, packageTotal)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <Empty text={t('No data yet')} icon={Package} />}
        </Card>
      </div>

      {/* ---------- Graduation year + Schools ---------- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card icon={CalendarDays} title={t('Anticipated Graduation Year')}
          subtitle={totals.withGradYear ? `${fmt(totals.withGradYear)} ${t('profiled visitors')}` : null}>
          {isLoading ? <ListSkeleton rows={6} /> : gradYearData.length ? (
            <div className="h-[280px] -ml-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradYearData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} dy={8} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
                  <Tooltip content={<DarkTooltip unit={t('users')} />} cursor={{ fill: 'rgba(124,58,237,0.06)' }} />
                  <Bar dataKey="value" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <Empty text={t('Graduation year data will appear here once visitors share it.')} icon={CalendarDays} />}
        </Card>

        <Card icon={School} title={t('Top 10 Schools by Engagement')}
          subtitle={schoolsAll.length ? `${fmt(schoolsAll.length)} ${t('Schools represented').toLowerCase()}` : null}>
          {isLoading ? <ListSkeleton rows={8} /> : schoolsAll.length ? (
            <>
              <div className="space-y-3.5">
                {schoolsShown.map((s, i) => (
                  <RankBar key={s.name} rank={i + 1} label={s.name} value={s.value}
                    share={pct(s.value, schoolTotal)} barPct={(s.value / schoolMax) * 100} color="bg-emerald-600" />
                ))}
              </div>
              {schoolsAll.length > 10 && (
                <button onClick={() => setShowAllSchools((v) => !v)}
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 cursor-pointer">
                  {showAllSchools ? t('Show less') : `${t('Show all')} (${Math.min(schoolsAll.length, 25)})`}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAllSchools ? 'rotate-180' : ''}`} />
                </button>
              )}
            </>
          ) : <Empty text={t('No data yet')} icon={School} />}
        </Card>
      </div>
    </div>
  );
}
