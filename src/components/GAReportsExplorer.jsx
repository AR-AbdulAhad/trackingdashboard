import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getGAReport } from '../lib/api';
import { useI18n } from '../context/I18nContext';
import {
  FileText, LogIn, Share2, Zap, MapPin, Users, Globe, Search, ArrowUpDown, ArrowDown, ArrowUp, ChevronDown, Info,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Formatters                                                          */
/* ------------------------------------------------------------------ */

const num = (n) => Math.round(n || 0).toLocaleString('da-DK');
const pct = (n) => `${((n || 0) * 100).toLocaleString('da-DK', { maximumFractionDigits: 1 })}%`;
const dec = (n) => (n || 0).toLocaleString('da-DK', { maximumFractionDigits: 1 });
const dur = (sec) => {
  const s = Math.round(sec || 0);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`;
};

const landingLabel = (row, t) => {
  const path = (row.landingPage || '').trim();
  const host = row.hostName && row.hostName !== '(not set)' ? row.hostName : '';
  if (!path || path === '(not set)') {
    return { title: t('Entry page not recorded'), host, sub: t('These sessions were counted, but their entry page was not recorded.') };
  }
  const names = { '/': t('Homepage'), '/pakker': t('Packages'), '/legatet': t('Scholarship'), '/studenterstoj': t('Student clothing') };
  const cleanPath = path.replace(/\/+$/, '') || '/';
  let readable = cleanPath.split('/').filter(Boolean).join(' / ').replace(/[-_]/g, ' ');
  try { readable = decodeURIComponent(readable); } catch { /* Keep malformed paths readable. */ }
  return {
    title: names[cleanPath] || readable.charAt(0).toUpperCase() + readable.slice(1),
    host,
    sub: `${host}${path}`,
  };
};

/* ------------------------------------------------------------------ */
/* Report definitions — one per tab                                    */
/* ------------------------------------------------------------------ */
// `value` derives a sortable number from a row; `fmt` renders it.
// `primary` is the metric the share bar is based on.

const TABS = [
  {
    key: 'pages', label: 'Pages', icon: FileText, hint: 'Every page on the site with views, users and engagement',
    searchKeys: ['pagePath', 'pageTitle', 'hostName'], primary: 'screenPageViews', bySite: true,
    dimension: (r) => ({ title: r.pageTitle || '(untitled)', host: r.hostName, sub: r.pagePath }),
    columns: [
      { key: 'screenPageViews', label: 'Views', fmt: num },
      { key: 'activeUsers', label: 'Users', fmt: num },
      { key: 'viewsPerUser', label: 'Views / user', value: (r) => (r.activeUsers ? r.screenPageViews / r.activeUsers : 0), fmt: dec },
      { key: 'avgEngagement', label: 'Avg. engagement', value: (r) => (r.activeUsers ? r.userEngagementDuration / r.activeUsers : 0), fmt: dur },
      { key: 'bounceRate', label: 'Bounce rate', fmt: pct },
      { key: 'keyEvents', label: 'Key events', fmt: num },
    ],
  },
  {
    key: 'landing', label: 'Landing pages', icon: LogIn, hint: 'First page of each session — where visitors enter',
    searchKeys: ['landingPage', 'hostName'], primary: 'sessions', bySite: true,
    dimension: landingLabel,
    columns: [
      { key: 'sessions', label: 'Sessions', fmt: num },
      { key: 'activeUsers', label: 'Users', fmt: num },
      { key: 'engagementRate', label: 'Engagement', fmt: pct },
      { key: 'averageSessionDuration', label: 'Avg. session', fmt: dur },
      { key: 'keyEvents', label: 'Key events', fmt: num },
    ],
  },
  {
    key: 'sources', label: 'Sources', icon: Share2, hint: 'Source / medium of each session',
    searchKeys: ['sessionSourceMedium'], primary: 'sessions',
    dimension: (r, t) => {
      const [src, med] = (r.sessionSourceMedium || '').split(' / ');
      return {
        title: src === '(direct)' ? t('Direct') : src,
        sub: ['', '(none)', '(not set)', '(data not available)', 'unknown'].includes((med || '').trim().toLowerCase()) ? null : med,
      };
    },
    columns: [
      { key: 'sessions', label: 'Sessions', fmt: num },
      { key: 'activeUsers', label: 'Users', fmt: num },
      { key: 'engagementRate', label: 'Engagement', fmt: pct },
      { key: 'averageSessionDuration', label: 'Avg. session', fmt: dur },
      { key: 'keyEvents', label: 'Key events', fmt: num },
    ],
  },
  {
    key: 'events', label: 'Events', icon: Zap, hint: 'Every tracked event and how often it fires',
    searchKeys: ['eventName'], primary: 'eventCount',
    dimension: (r) => ({ title: r.eventName, mono: true }),
    columns: [
      { key: 'eventCount', label: 'Count', fmt: num },
      { key: 'totalUsers', label: 'Users', fmt: num },
      { key: 'eventCountPerUser', label: 'Per user', fmt: dec },
      { key: 'keyEvents', label: 'Key events', fmt: num },
    ],
  },
  {
    key: 'cities', label: 'Cities', icon: MapPin, hint: 'Where your visitors are located',
    searchKeys: ['city', 'countryId'], primary: 'activeUsers',
    dimension: (r) => ({ title: r.city, sub: r.countryId }),
    columns: [
      { key: 'activeUsers', label: 'Users', fmt: num },
      { key: 'sessions', label: 'Sessions', fmt: num },
      { key: 'screenPageViews', label: 'Views', fmt: num },
      { key: 'engagementRate', label: 'Engagement', fmt: pct },
    ],
  },
  {
    key: 'browsers', label: 'Tech', icon: Globe, hint: 'Browser and operating system',
    searchKeys: ['browser', 'operatingSystem'], primary: 'activeUsers',
    dimension: (r) => ({ title: r.browser, sub: r.operatingSystem }),
    columns: [
      { key: 'activeUsers', label: 'Users', fmt: num },
      { key: 'sessions', label: 'Sessions', fmt: num },
      { key: 'engagementRate', label: 'Engagement', fmt: pct },
    ],
  },
  {
    key: 'demographics', label: 'Demographics', icon: Users, hint: 'Age bracket and gender',
    searchKeys: ['userAgeBracket', 'userGender'], primary: 'activeUsers',
    note: 'Only recorded age groups are shown. Percentages are based on visitors with a recorded age.',
    dimension: (r) => ({
      title: r.userAgeBracket,
      sub: ['', 'unknown', '(not set)'].includes((r.userGender || '').trim().toLowerCase()) ? null : r.userGender,
    }),
    columns: [
      { key: 'activeUsers', label: 'Users', fmt: num },
      { key: 'sessions', label: 'Sessions', fmt: num },
      { key: 'engagementRate', label: 'Engagement', fmt: pct },
    ],
  },
];

const PAGE_SIZE = 15;

const hasRecordedSource = (row) => {
  const source = (row.sessionSourceMedium || '').split(/\s*\/\s*/)[0].trim().toLowerCase();
  return !['', '(not set)', '(data not available)', 'data not available', 'unknown', '(unknown)'].includes(source);
};

// Local, preview and IP hosts are test traffic, not a real site
const isTestHost = (h = '') =>
  /^(localhost|127\.|192\.168\.|10\.)/.test(h) || /\.(netlify\.app|vercel\.app)$/.test(h);
const TEST_SITES = '__test__';

const shortHost = (h = '') => h.replace(/^www\./, '');

function HostBadge({ host }) {
  if (!host) return null;
  const test = isTestHost(host);
  return (
    <span
      className={`inline-flex items-center max-w-full truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${
        test ? 'bg-amber-50 text-amber-700 ring-amber-100' : 'bg-slate-50 text-slate-600 ring-slate-200'
      }`}
      title={host}
    >
      {shortHost(host)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function GAReportsExplorer({ from, to }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const prefetchTab = (key) => queryClient.prefetchQuery({
    queryKey: ['ga-report', 'recorded-values-v2', key, from, to],
    queryFn: () => getGAReport(key, from, to),
    staleTime: 5 * 60 * 1000,
  });
  const [tabKey, setTabKey] = useState('pages');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: null, dir: 'desc' });
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [site, setSite] = useState('all');

  const tab = TABS.find((x) => x.key === tabKey);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['ga-report', 'recorded-values-v2', tabKey, from, to],
    queryFn: () => getGAReport(tabKey, from, to),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const switchTab = (key) => {
    setTabKey(key);
    setQuery('');
    setSort({ key: null, dir: 'desc' });
    setVisible(PAGE_SIZE);
  };

  const valueOf = (row, col) => (col.value ? col.value(row) : row[col.key] || 0);

  // Sites present in this report, largest first; test hosts grouped together
  const sites = useMemo(() => {
    if (!tab.bySite) return [];
    const sums = {};
    let testSum = 0;
    for (const r of data?.rows || []) {
      const v = r[tab.primary] || 0;
      if (isTestHost(r.hostName)) testSum += v;
      else sums[r.hostName] = (sums[r.hostName] || 0) + v;
    }
    const list = Object.entries(sums).sort((a, b) => b[1] - a[1]).map(([host, value]) => ({ key: host, label: shortHost(host), value }));
    if (testSum) list.push({ key: TEST_SITES, label: t('Test sites'), value: testSum, test: true });
    return list;
  }, [data, tab, t]);

  const siteRows = useMemo(() => {
    const rawRows = data?.rows || [];
    const list = tab.key === 'sources' ? rawRows.filter(hasRecordedSource) : rawRows;
    if (!tab.bySite || site === 'all') return list;
    return list.filter((r) => (site === TEST_SITES ? isTestHost(r.hostName) : r.hostName === site));
  }, [data, tab, site]);

  const rows = useMemo(() => {
    let list = siteRows;
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((r) => tab.searchKeys.some((k) => String(r[k] || '').toLowerCase().includes(q)));
    const sortCol = tab.columns.find((c) => c.key === (sort.key || tab.primary));
    if (sortCol) {
      list = [...list].sort((a, b) => {
        const d = valueOf(a, sortCol) - valueOf(b, sortCol);
        return sort.dir === 'asc' ? d : -d;
      });
    }
    return list;
  }, [siteRows, query, sort, tab]);

  // Shares are relative to the selected site (or the whole property)
  const primaryTotal = tab.bySite && site !== 'all'
    ? siteRows.reduce((s, r) => s + (r[tab.primary] || 0), 0)
    : data?.totals?.[tab.primary] || siteRows.reduce((s, r) => s + (r[tab.primary] || 0), 0);
  const primaryMax = Math.max(...siteRows.map((r) => r[tab.primary] || 0), 1);
  const activeSortKey = sort.key || tab.primary;

  const toggleSort = (key) => {
    setSort((s) => (s.key === key || (!s.key && key === tab.primary)
      ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' }
      : { key, dir: 'desc' }));
  };

  return (
    <div className="card !p-0 min-w-0">
      {/* Header */}
      <div className="px-5 sm:px-6 pt-5 sm:pt-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.12em]">{t('Detailed reports')}</p>
            <h3 className="font-bold text-slate-900 brand-text text-lg mt-1">{t(tab.label)}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{t(tab.hint)}</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setVisible(PAGE_SIZE); }}
              placeholder={t('Search...')}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 -mx-5 sm:-mx-6 px-5 sm:px-6 border-b border-slate-100 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {TABS.map((x) => {
              const active = x.key === tabKey;
              return (
                <button
                  key={x.key}
                  onClick={() => switchTab(x.key)}
                  onMouseEnter={() => prefetchTab(x.key)}
                  onFocus={() => prefetchTab(x.key)}
                  className={`relative flex items-center gap-2 px-3.5 py-3 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <x.icon className={`w-4 h-4 ${active ? 'text-sky-600' : ''}`} />
                  {t(x.label)}
                  {active && <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-sky-600" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {tab.note && (
        <div className="mx-5 sm:mx-6 mt-4 flex items-start gap-2 text-xs text-slate-500 bg-slate-50 ring-1 ring-slate-100 rounded-xl px-3 py-2.5">
          <Info className="w-4 h-4 shrink-0 text-slate-400 mt-px" />
          <span>{t(tab.note)}</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-slate-400">
              <th className="text-left font-bold px-5 sm:px-6 py-3 min-w-[240px] sm:min-w-[300px] sticky left-0 z-10 bg-white">
                {t(tab.label)}
                {data?.rowCount !== undefined && !isLoading && (
                  <span className="ml-2 normal-case tracking-normal font-semibold text-slate-300">
                    {rows.length !== data.rowCount ? `${rows.length} / ${data.rowCount}` : data.rowCount}
                  </span>
                )}
              </th>
              {tab.columns.map((c) => {
                const active = activeSortKey === c.key;
                const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
                return (
                  <th key={c.key} className="text-right font-bold px-3 py-3 whitespace-nowrap last:pr-5 sm:last:pr-6">
                    <button onClick={() => toggleSort(c.key)}
                      className={`inline-flex items-center gap-1 uppercase tracking-wider cursor-pointer hover:text-slate-700 ${active ? 'text-slate-700' : ''}`}>
                      {t(c.label)}
                      <Icon className={`w-3 h-3 ${active ? '' : 'opacity-40'}`} />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading && [...Array(8)].map((_, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-5 sm:px-6 py-3.5" colSpan={tab.columns.length + 1}>
                  <div className="h-5 rounded-md bg-slate-100 animate-pulse" style={{ opacity: 1 - i * 0.1 }} />
                </td>
              </tr>
            ))}

            {!isLoading && (isError || data?.error) && (
              <tr><td colSpan={tab.columns.length + 1} className="px-6 py-12 text-center text-sm text-rose-600">
                {t('Could not load this report.')} <span className="text-slate-400">{data?.error || error?.message}</span>
              </td></tr>
            )}

            {!isLoading && !isError && !data?.error && rows.length === 0 && (
              <tr><td colSpan={tab.columns.length + 1} className="px-6 py-12 text-center text-sm text-slate-400">
                {query ? t('No results match your search.') : t('No data for the selected range.')}
              </td></tr>
            )}

            {!isLoading && rows.slice(0, visible).map((r, i) => {
              const d = tab.dimension(r, t);
              const share = primaryTotal ? (r[tab.primary] / primaryTotal) * 100 : 0;
              return (
                <tr key={i} className="group border-t border-slate-100 hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 sm:px-6 py-3 sticky left-0 z-10 bg-white group-hover:bg-slate-50 transition-colors min-w-[240px] sm:min-w-[300px] max-w-[240px] sm:max-w-[420px] shadow-[1px_0_0_#f1f5f9]">
                    <div className="min-w-0" title={[d.title, d.sub].filter(Boolean).join(' — ')}>
                      <p className={`font-semibold text-slate-800 truncate ${d.mono ? 'font-mono text-[13px]' : ''}`}>{d.title}</p>
                      {d.host && <div className="mt-1"><HostBadge host={d.host} /></div>}
                      {d.sub && <p className="text-xs text-slate-400 truncate mt-0.5">{d.sub}</p>}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1 flex-1 max-w-[180px] rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-sky-600" style={{ width: `${Math.max((r[tab.primary] / primaryMax) * 100, 1.5)}%` }} />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
                          {share.toLocaleString('da-DK', { maximumFractionDigits: 1 })}%
                        </span>
                      </div>
                    </div>
                  </td>
                  {tab.columns.map((c) => (
                    <td key={c.key} className={`text-right px-3 py-3 tabular-nums whitespace-nowrap last:pr-5 sm:last:pr-6 ${
                      activeSortKey === c.key ? 'font-bold text-slate-900' : 'text-slate-600'
                    }`}>
                      {c.fmt(valueOf(r, c))}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isLoading && rows.length > visible && (
        <div className="border-t border-slate-100 px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">{t('Showing')} {visible} / {rows.length}</span>
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE * 2)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 cursor-pointer"
          >
            {t('Show more')} <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
