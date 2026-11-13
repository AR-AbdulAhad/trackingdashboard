import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGASummary, getGARealtime } from '../lib/api';
import { useDateRange } from '../context/DateRangeContext';
import { useI18n } from '../context/I18nContext';
import PageHeader from '../components/PageHeader';
import GAReportsExplorer from '../components/GAReportsExplorer';
import {
  Users, Activity, Zap, MousePointerClick, Eye, UserPlus, Timer, Gauge,
  ArrowUpRight, ArrowDownRight, Minus, Globe2, FileText, Share2,
  Smartphone, Monitor, Tablet, Radio, CheckCircle2, AlertCircle,
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, BarChart, Bar, Cell,
  Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const fmtNum = (n) => (n ?? 0).toLocaleString('da-DK');

const fmtDuration = (sec) => {
  const s = Math.round(sec || 0);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`;
};

const fmtDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y.slice(2)}`;
};

const ACCENTS = {
  sky:     { stroke: '#0284C7', soft: 'bg-sky-50',     icon: 'text-sky-600',     ring: 'ring-sky-100' },
  violet:  { stroke: '#7C3AED', soft: 'bg-violet-50',  icon: 'text-violet-600',  ring: 'ring-violet-100' },
  amber:   { stroke: '#D97706', soft: 'bg-amber-50',   icon: 'text-amber-600',   ring: 'ring-amber-100' },
  emerald: { stroke: '#059669', soft: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-100' },
};

// Validated categorical order (CVD-safe): sky → violet → amber
const DEVICE_META = {
  mobile:  { label: 'Mobile',  color: '#0284C7', icon: Smartphone },
  desktop: { label: 'Desktop', color: '#7C3AED', icon: Monitor },
  tablet:  { label: 'Tablet',  color: '#D97706', icon: Tablet },
};

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function DeltaBadge({ value, size = 'sm' }) {
  const base = size === 'sm'
    ? 'text-[11px] px-2 py-0.5 gap-0.5'
    : 'text-xs px-2.5 py-1 gap-1';
  if (value === null || value === undefined) {
    return (
      <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-500 font-semibold ${base}`}>
        <Minus className="w-3 h-3" /> —
      </span>
    );
  }
  const up = value > 0;
  const flat = value === 0;
  const cls = flat
    ? 'bg-slate-100 text-slate-600'
    : up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700';
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center rounded-full font-bold tabular-nums ${cls} ${base}`}>
      <Icon className="w-3.5 h-3.5" />
      {Math.abs(value).toLocaleString('da-DK', { maximumFractionDigits: 1 })}%
    </span>
  );
}

function SectionTitle({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-slate-50 ring-1 ring-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Icon className="w-[18px] h-[18px]" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-bold text-slate-800 brand-text text-[15px] leading-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

function EmptyState({ loading, text }) {
  if (loading) {
    return (
      <div className="space-y-3 py-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-7 rounded-lg bg-slate-100 animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
        ))}
      </div>
    );
  }
  return <p className="text-xs text-slate-400 py-10 text-center">{text}</p>;
}

function ChartTooltip({ active, payload, label, metricLabel }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-slate-900 text-white px-3.5 py-2.5 shadow-xl text-xs">
      <p className="text-slate-400 font-medium mb-1">{label}</p>
      <p className="font-bold text-sm tabular-nums">
        {fmtNum(payload[0].value)} <span className="font-medium text-slate-300">{metricLabel}</span>
      </p>
    </div>
  );
}

function Flag({ code, name }) {
  const [failed, setFailed] = useState(false);
  if (!code || code.length !== 2 || failed) {
    return (
      <span className="w-6 h-[18px] rounded-[4px] bg-slate-100 text-[9px] font-bold text-slate-500 flex items-center justify-center shrink-0">
        {code || '?'}
      </span>
    );
  }
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-6 h-[18px] rounded-[4px] object-cover ring-1 ring-black/5 shrink-0"
    />
  );
}

/* ------------------------------------------------------------------ */
/* KPI card                                                            */
/* ------------------------------------------------------------------ */

function KpiCard({ label, value, exact, change, accent, icon: Icon, series, dataKey, loading, compareLabel }) {
  const a = ACCENTS[accent];
  if (loading) {
    return (
      <div className="card !p-6 min-h-[176px] animate-pulse">
        <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
        <div className="h-9 w-28 bg-slate-200 rounded-lg mb-3" />
        <div className="h-4 w-20 bg-slate-100 rounded-full" />
      </div>
    );
  }
  return (
    <div className="card !p-0 group flex flex-col min-h-[176px]">
      <div className="p-6 pb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.12em]">{label}</p>
          <p className="text-[34px] leading-none font-extrabold text-slate-900 brand-text mt-3 tabular-nums" title={exact}>
            {value}
          </p>
          <div className="flex items-center gap-2 mt-3">
            {change !== null && change !== undefined && <DeltaBadge value={change} />}
            {compareLabel && <span className="text-[11px] text-slate-400 font-medium truncate">{compareLabel}</span>}
          </div>
        </div>
        <div className={`w-11 h-11 rounded-2xl ${a.soft} ring-1 ${a.ring} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
          <Icon className={`w-5 h-5 ${a.icon}`} />
        </div>
      </div>
      <div className="h-14 mt-auto -mb-px">
        {series?.length > 1 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${accent}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={a.stroke} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={a.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey={dataKey} stroke={a.stroke} strokeWidth={2} fill={`url(#spark-${accent})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const TREND_METRICS = [
  { key: 'current',    label: 'Active Users', short: 'users' },
  { key: 'sessions',   label: 'Sessions',     short: 'sessions' },
  { key: 'eventCount', label: 'Events',       short: 'events' },
  { key: 'keyEvents',  label: 'Key Events',   short: 'key events' },
  { key: 'pageViews',  label: 'Page Views',   short: 'views' },
];

export default function GoogleAnalyticsPage() {
  const { from, to } = useDateRange();
  const { t } = useI18n();
  const [trendKey, setTrendKey] = useState('current');

  const { data: gaData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['ga-page-summary', from, to],
    queryFn: () => getGASummary(from, to),
    staleTime: 60000,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: realtimeData, isLoading: isRealtimeLoading } = useQuery({
    queryKey: ['ga-page-realtime'],
    queryFn: getGARealtime,
    staleTime: 30000,
    refetchInterval: 60 * 1000,
    retry: 1,
  });

  const m = gaData?.metrics || {};
  const changes = gaData?.changes || {};
  const range = gaData?.range;
  const trend = gaData?.trend || [];
  const countries = gaData?.countries || [];
  const pages = gaData?.pageViews || [];
  const channels = gaData?.trafficChannels || [];
  const devices = gaData?.devices || [];
  const realtime = realtimeData || { active30Min: 0, perMinute: [], byCountry: [] };
  const isLive = gaData?.isLive === true;

  const compareLabel = null; // comparison period is shown once in the context bar
  const activeTrend = TREND_METRICS.find((x) => x.key === trendKey);
  const trendTotal = trend.reduce((s, d) => s + (d[trendKey] || 0), 0);

  const updatedAt = gaData?.fetchedAt
    ? new Date(gaData.fetchedAt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader title="Google Analytics" description={t('Live audience & traffic intelligence')} />

      {/* ---------- Connection / context bar ---------- */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3 rounded-2xl bg-white border border-slate-200/80 text-xs">
        {isSummaryLoading ? (
          <span className="text-slate-400">{t('Connecting to Google Analytics...')}</span>
        ) : isLive ? (
          <>
            <span className="flex items-center gap-2 font-bold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              GA4 · {gaData?.propertyName}
            </span>
            <span className="text-slate-400">Property ID <span className="font-semibold text-slate-600 tabular-nums">{gaData?.propertyId}</span></span>
            {range && (
              <span className="text-slate-400">
                {range.allTime ? t('All time') : `${fmtDate(range.from)} – ${fmtDate(range.to)}`}
                {range.previous && (
                  <> · {t('compared with')} <span className="font-semibold text-slate-600">{fmtDate(range.previous.startDate)} – {fmtDate(range.previous.endDate)}</span></>
                )}
              </span>
            )}
            {updatedAt && <span className="ml-auto text-slate-400">{t('Updated')} {updatedAt}</span>}
          </>
        ) : (
          <span className="flex items-center gap-2 font-semibold text-rose-700">
            <AlertCircle className="w-4 h-4" />
            {t('Google Analytics data is unavailable right now.')}
            {gaData?.error && <span className="font-normal text-slate-400 truncate max-w-md">({gaData.error})</span>}
          </span>
        )}
      </div>

      {/* ---------- Primary KPIs ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard label={t('Active Users')} value={m.activeUsersFormatted ?? '0'} exact={fmtNum(m.activeUsers)}
          change={changes.activeUsers} accent="sky" icon={Users} series={trend} dataKey="current"
          loading={isSummaryLoading} compareLabel={compareLabel} />
        <KpiCard label={t('Event Count')} value={m.eventCountFormatted ?? '0'} exact={fmtNum(m.eventCount)}
          change={changes.eventCount} accent="emerald" icon={Activity} series={trend} dataKey="eventCount"
          loading={isSummaryLoading} compareLabel={compareLabel} />
        <KpiCard label={t('Key Events')} value={m.keyEventsFormatted ?? '0'} exact={fmtNum(m.keyEvents)}
          change={changes.keyEvents} accent="violet" icon={Zap} series={trend} dataKey="keyEvents"
          loading={isSummaryLoading} compareLabel={compareLabel} />
        <KpiCard label={t('Sessions')} value={m.sessionsFormatted ?? '0'} exact={fmtNum(m.sessions)}
          change={changes.sessions} accent="amber" icon={MousePointerClick} series={trend} dataKey="sessions"
          loading={isSummaryLoading} compareLabel={compareLabel} />
      </div>

      {/* ---------- Trend + Realtime ---------- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card xl:col-span-2 !p-6">
          <div className="flex flex-col 2xl:flex-row 2xl:items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.12em]">{t('Trend')}</p>
              <div className="flex items-baseline gap-3 mt-1.5">
                <span className="text-3xl font-extrabold text-slate-900 brand-text tabular-nums">
                  {trendKey === 'current' ? fmtNum(m.activeUsers) : fmtNum(trendTotal)}
                </span>
                <span className="text-sm text-slate-500 font-medium">
                  {t(activeTrend.label)} {t('total')} · {range?.granularity === 'month' ? t('monthly view') : t('daily view')}
                </span>
              </div>
            </div>
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 self-start max-w-full overflow-x-auto">
              {TREND_METRICS.map((tm) => (
                <button
                  key={tm.key}
                  onClick={() => setTrendKey(tm.key)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    trendKey === tm.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t(tm.label)}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[300px] -ml-2">
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gaTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284C7" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#0284C7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={8} minTickGap={16} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={44}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : v)} />
                  <Tooltip
                    content={<ChartTooltip metricLabel={t(activeTrend.short)} />}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone" dataKey={trendKey} stroke="#0284C7" strokeWidth={2.5}
                    fill="url(#gaTrendFill)"
                    dot={trend.length <= 31 ? { r: 3, fill: '#fff', stroke: '#0284C7', strokeWidth: 2 } : false}
                    activeDot={{ r: 5, fill: '#0284C7', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyState loading={isSummaryLoading} text={t('No trend records returned for selected range')} />
              </div>
            )}
          </div>
        </div>

        {/* Realtime — dark hero card */}
        <div className="relative rounded-[20px] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 text-white p-6 shadow-lg flex flex-col">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-200">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
              </span>
              {t('Realtime')}
            </span>
            <Radio className="w-4 h-4 text-slate-400" />
          </div>

          <div className="relative mt-4">
            <p className="text-6xl font-extrabold brand-text tabular-nums leading-none">
              {isRealtimeLoading ? '–' : realtime.active30Min || 0}
            </p>
            <p className="text-sm text-slate-300 mt-2">{t('Active users in last 30 minutes')}</p>
          </div>

          <div className="relative mt-6">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <span>{t('Per minute')}</span>
            </div>
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={realtime.perMinute || []} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barCategoryGap={2}>
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                    content={({ active, payload }) => active && payload?.length ? (
                      <div className="rounded-lg bg-white text-slate-900 px-2.5 py-1.5 text-[11px] shadow-lg">
                        <b className="tabular-nums">{payload[0].value}</b> {t('users')} ·{' '}
                        {payload[0].payload.minuteAgo === 0 ? t('now') : `${payload[0].payload.minuteAgo} min`}
                      </div>
                    ) : null}
                  />
                  <Bar dataKey="activeUsers" radius={[3, 3, 0, 0]} minPointSize={2}>
                    {(realtime.perMinute || []).map((d, i) => (
                      <Cell key={i} fill={d.activeUsers > 0 ? '#38BDF8' : 'rgba(148,163,184,0.25)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
              <span>-30 min</span><span>{t('now')}</span>
            </div>
          </div>

          <div className="relative mt-6 pt-5 border-t border-white/10 flex-1">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
              <span>{t('Country')}</span><span>{t('Users')}</span>
            </div>
            {realtime.byCountry?.length > 0 ? (
              <div className="space-y-2.5">
                {realtime.byCountry.slice(0, 5).map((c) => (
                  <div key={c.country} className="flex items-center justify-between text-sm">
                    <span className="text-slate-200 font-medium">{c.country}</span>
                    <span className="font-bold tabular-nums">{c.activeUsers}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">{t('No active users in last 30 min')}</p>
            )}
          </div>
        </div>
      </div>

      {/* ---------- Engagement strip + devices ---------- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card xl:col-span-2 !p-0">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100">
            {[
              { label: t('Page Views'), value: m.pageViewsFormatted ?? '0', exact: fmtNum(m.pageViews), change: changes.screenPageViews, icon: Eye },
              { label: t('New Users'), value: m.newUsersFormatted ?? '0', exact: fmtNum(m.newUsers), change: changes.newUsers, icon: UserPlus },
              { label: t('Engagement Rate'), value: `${((m.engagementRate || 0) * 100).toFixed(1)}%`, change: changes.engagementRate, icon: Gauge },
              { label: t('Avg. Session'), value: fmtDuration(m.averageSessionDuration), change: changes.averageSessionDuration, icon: Timer },
            ].map((s) => (
              <div key={s.label} className="p-5" title={s.exact}>
                <div className="flex items-center gap-2 text-slate-500">
                  <s.icon className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em]">{s.label}</span>
                </div>
                <p className="text-2xl font-extrabold text-slate-900 brand-text mt-2.5 tabular-nums">
                  {isSummaryLoading ? <span className="inline-block h-7 w-16 bg-slate-100 rounded animate-pulse" /> : s.value}
                </p>
                {!isSummaryLoading && s.change !== null && s.change !== undefined && <div className="mt-2"><DeltaBadge value={s.change} /></div>}
              </div>
            ))}
          </div>
        </div>

        <div className="card !p-5">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em] mb-3">{t('Devices')}</p>
          {devices.length > 0 ? (
            <>
              <div className="flex h-2.5 w-full rounded-full overflow-hidden gap-[2px] bg-white">
                {devices.map((d) => (
                  <div key={d.device} style={{ width: `${Math.max(d.pct, 1)}%`, background: DEVICE_META[d.device]?.color || '#94a3b8' }}
                    title={`${DEVICE_META[d.device]?.label || d.device}: ${d.pct}%`} />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {devices.map((d) => {
                  const meta = DEVICE_META[d.device] || { label: d.device, color: '#94a3b8', icon: Monitor };
                  return (
                    <div key={d.device}>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                        {t(meta.label)}
                      </div>
                      <p className="text-lg font-extrabold text-slate-900 tabular-nums mt-0.5">{d.pct}%</p>
                      <p className="text-[11px] text-slate-400 tabular-nums">{fmtNum(d.activeUsers)} {t('users')}</p>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyState loading={isSummaryLoading} text={t('No device data')} />
          )}
        </div>
      </div>

      {/* ---------- Breakdown tables ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Countries */}
        <div className="card !p-6">
          <SectionTitle icon={Globe2} title={t('Active users by Country')} subtitle={t('Top 10 in selected range')} />
          {countries.length > 0 ? (
            <div className="space-y-3.5">
              {countries.map((c) => (
                <div key={c.country} className="group/row" title={`${c.country}: ${fmtNum(c.activeUsers)} (${c.pct}%)`}>
                  <div className="flex items-center gap-3 text-sm">
                    <Flag code={c.countryCode} name={c.country} />
                    <span className="font-semibold text-slate-700 truncate flex-1">{c.country}</span>
                    <span className="text-xs text-slate-400 tabular-nums w-10 text-right">{c.pct}%</span>
                    <span className="font-bold text-slate-900 tabular-nums w-12 text-right">{fmtNum(c.activeUsers)}</span>
                  </div>
                  <div className="ml-9 mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-sky-600 transition-all duration-700" style={{ width: `${Math.max(c.barPct, 2)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState loading={isSummaryLoading} text={t('No country records returned')} />
          )}
        </div>

        {/* Pages */}
        <div className="card !p-6">
          <SectionTitle icon={FileText} title={t('Views by Page Title')} subtitle={t('Most viewed pages')} />
          {pages.length > 0 ? (
            <div className="space-y-1">
              {pages.map((p, i) => (
                <div key={p.title + i} className="relative flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-slate-50 transition-colors" title={p.title}>
                  <div className="absolute inset-y-1 left-0 rounded-lg bg-sky-50/80 -z-0" style={{ width: `${Math.max(p.barPct, 3)}%` }} />
                  <span className={`relative w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center shrink-0 ${
                    i < 3 ? 'bg-slate-900 text-white' : 'bg-white ring-1 ring-slate-200 text-slate-500'
                  }`}>{i + 1}</span>
                  <span className="relative text-sm font-medium text-slate-700 truncate flex-1">
                    {p.title.replace(/\s*-\s*Student Life$/i, '')}
                  </span>
                  <span className="relative text-sm font-bold text-slate-900 tabular-nums">{fmtNum(p.views)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState loading={isSummaryLoading} text={t('No page view records returned')} />
          )}
        </div>

        {/* Channels */}
        <div className="card !p-6">
          <SectionTitle icon={Share2} title={t('Sessions by Channel')} subtitle={t('Where visitors come from')} />
          {channels.length > 0 ? (
            <div className="space-y-3.5">
              {channels.map((ch) => (
                <div key={ch.channel} title={`${ch.channel}: ${fmtNum(ch.sessions)} (${ch.pct}%)`}>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-semibold text-slate-700 truncate flex-1">{ch.channel}</span>
                    <span className="text-xs text-slate-400 tabular-nums w-10 text-right">{ch.pct}%</span>
                    <span className="font-bold text-slate-900 tabular-nums w-12 text-right">{fmtNum(ch.sessions)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-violet-600 transition-all duration-700" style={{ width: `${Math.max(ch.barPct, 2)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState loading={isSummaryLoading} text={t('No channel records returned')} />
          )}
        </div>
      </div>

      {/* ---------- Page-wise & detailed reports ---------- */}
      <GAReportsExplorer from={from} to={to} />
    </div>
  );
}
