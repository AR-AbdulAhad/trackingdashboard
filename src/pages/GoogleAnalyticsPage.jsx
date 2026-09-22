import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getGASummary, getGARealtime, getGAAuthUrl } from '../lib/api';
import { useDateRange } from '../context/DateRangeContext';
import { useI18n } from '../context/I18nContext';
import {
  Users, Activity, Zap, TrendingUp,
  ArrowUpRight, Sparkles, RefreshCw, BarChart3, Radio,
  ShieldCheck, AlertTriangle, Copy, Check, ExternalLink, LogIn
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, BarChart, Bar,
  Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts';

export default function GoogleAnalyticsPage() {
  const { from, to } = useDateRange();
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Live Summary from GA4 Data API
  const { data: gaData, isLoading: isSummaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['ga-page-summary', from, to],
    queryFn: () => getGASummary(from, to),
    staleTime: 60000,
    retry: 1,
  });

  // Live Realtime from GA4 Data API
  const { data: realtimeData, isLoading: isRealtimeLoading, refetch: refetchRealtime } = useQuery({
    queryKey: ['ga-page-realtime'],
    queryFn: getGARealtime,
    staleTime: 60000,
    retry: 1,
  });

  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      refetchSummary();
      refetchRealtime();
    }
  }, [searchParams]);

  const handleConnectGoogle = async () => {
    try {
      setConnecting(true);
      const data = await getGAAuthUrl();
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      alert('Error initiating Google Login: ' + err.message);
      setConnecting(false);
    }
  };

  const isLiveConnected = gaData?.isLive === true;
  const isPermissionPending = gaData?.permissionPending || realtimeData?.permissionPending;
  const serviceAccountEmail = gaData?.serviceAccountEmail || realtimeData?.serviceAccountEmail || 'ga-reader@studentlife-509311.iam.gserviceaccount.com';

  const copyEmail = () => {
    navigator.clipboard.writeText(serviceAccountEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const metrics = gaData?.metrics || {
    activeUsers: 0,
    activeUsersFormatted: '0',
    sessions: 0,
    sessionsFormatted: '0',
    eventCount: 0,
    eventCountFormatted: '0',
    keyEvents: 0,
    keyEventsFormatted: '0',
    pageViews: 0,
    pageViewsFormatted: '0',
  };

  const trendData = gaData?.trend || [];
  const countries = gaData?.countries || [];
  const pageViews = gaData?.pageViews || [];
  const trafficChannels = gaData?.trafficChannels || [];
  const realtime = realtimeData || { active30Min: 0, perMinute: [], byCountry: [] };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2zm4 8h-2v-4h2v4zm0-6h-2V7h2v4z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-800 brand-text tracking-tight">
                  Google Analytics
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  www.studentlife.dk
                </span>
                {isLiveConnected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" /> GA4 Live Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5" /> GA4 Permission Required
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Property ID: <span className="font-semibold text-slate-700">503219826</span> • Live audience & traffic intelligence
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>{realtime.active30Min} active in last 30 minutes</span>
          </div>

          <button
            onClick={() => { refetchSummary(); refetchRealtime(); }}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-sky-600 hover:border-sky-200 transition-all shadow-sm flex items-center gap-2 text-xs font-bold"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(isSummaryLoading || isRealtimeLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Permission Pending Notice */}
      {isPermissionPending && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/90 text-amber-900 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-950 flex items-center gap-2">
                Connect Google Analytics 4 (1-Click Google Login)
              </p>
              <p className="text-xs text-amber-800/90 mt-1 leading-relaxed max-w-xl">
                Aapke account (<code>elipsedev@gmail.com</code>) ke pass GA4 ka direct access hai. Niche diye gaye button par click karke apne Google account se connect karein, taake 100% real live data load ho sake.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
            <button
              onClick={handleConnectGoogle}
              disabled={connecting}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm hover:shadow active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{connecting ? 'Connecting...' : 'Sign in with Google (elipsedev@gmail.com)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Users */}
        <div className="card bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Active users</p>
              <p className="text-3xl font-extrabold text-slate-800 brand-text">
                {isSummaryLoading ? '...' : (metrics.activeUsersFormatted || metrics.activeUsers?.toLocaleString())}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> Live
                </span>
                <span className="text-xs text-slate-400 font-medium">GA4 dynamic users</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Event Count */}
        <div className="card bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Event count</p>
              <p className="text-3xl font-extrabold text-slate-800 brand-text">
                {isSummaryLoading ? '...' : (metrics.eventCountFormatted || metrics.eventCount?.toLocaleString())}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> Total
                </span>
                <span className="text-xs text-slate-400 font-medium">interactions</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Key Events */}
        <div className="card bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Key events</p>
              <p className="text-3xl font-extrabold text-slate-800 brand-text">
                {isSummaryLoading ? '...' : (metrics.keyEventsFormatted || metrics.keyEvents?.toLocaleString())}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> Goals
                </span>
                <span className="text-xs text-slate-400 font-medium">key events</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div className="card bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Sessions</p>
              <p className="text-3xl font-extrabold text-slate-800 brand-text">
                {isSummaryLoading ? '...' : (metrics.sessionsFormatted || metrics.sessions?.toLocaleString())}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> Visits
                </span>
                <span className="text-xs text-slate-400 font-medium">total sessions</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row: Trend Line & 30-min Realtime */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Users Trend Chart */}
        <div className="card lg:col-span-2 bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 brand-text text-base">Active Users Trend (GA4 Live)</h3>
                  <p className="text-xs text-slate-400">Date-wise live user traffic</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-sky-600">
                  <span className="w-3 h-1 rounded-full bg-sky-500"></span> Active Users
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-1 rounded-full bg-slate-300"></span> Sessions
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gaCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
                    />
                    <Area type="monotone" dataKey="current" name="Active Users" stroke="#0EA5E9" strokeWidth={3} fill="url(#gaCurrent)" dot={{ r: 4, fill: '#0EA5E9', strokeWidth: 2, stroke: '#fff' }} />
                    <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                  {isSummaryLoading ? 'Loading GA4 live trend...' : 'No trend records returned for selected range'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Realtime Users in Last 30 Minutes */}
        <div className="card bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active users in last 30 minutes</p>
                <p className="text-4xl font-extrabold text-slate-800 brand-text mt-1">{realtime.active30Min || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
            </div>

            {/* Minute-by-minute bars */}
            <div className="mb-5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Active users per minute</p>
              <div className="h-20 w-full">
                {realtime.perMinute?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={realtime.perMinute}>
                      <Bar dataKey="activeUsers" fill="#38BDF8" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No active per-minute traffic right now
                  </div>
                )}
              </div>
            </div>

            {/* Country breakdown in realtime */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span>Country (Realtime)</span>
                <span>Active users</span>
              </div>
              <div className="space-y-2">
                {realtime.byCountry?.length > 0 ? (
                  realtime.byCountry.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold">
                      <span className="flex items-center gap-2 text-slate-700">
                        <span>📍</span>
                        <span>{item.country}</span>
                      </span>
                      <span className="font-extrabold text-slate-800">{item.activeUsers}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-2 italic text-center">No active users in last 30 min</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested For You: 3 Detailed Cards Matching GA4 Home */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 brand-text mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Audience & Traffic Intelligence (GA4 Live)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Active users by Country */}
          <div className="card bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">Active users by Country</h3>
                <span className="text-xs text-slate-400">Selected Range</span>
              </div>

              <div className="space-y-3 pt-1">
                {countries.length > 0 ? (
                  countries.map((c, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">{c.country}</span>
                        <span className="font-extrabold text-slate-800">{c.activeUsers?.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${c.barPct || 5}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-6 text-center">
                    {isSummaryLoading ? 'Loading country data...' : 'No country records returned'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Views by Page title */}
          <div className="card bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">Views by Page Title</h3>
                <span className="text-xs text-slate-400">Selected Range</span>
              </div>

              <div className="space-y-3 pt-1">
                {pageViews.length > 0 ? (
                  pageViews.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <span className="font-semibold text-slate-700 truncate max-w-[180px]" title={p.title}>
                        {p.title}
                      </span>
                      <span className="font-extrabold text-slate-800">{p.views?.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-6 text-center">
                    {isSummaryLoading ? 'Loading page views...' : 'No page view records returned'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Sessions by Channel */}
          <div className="card bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">Sessions by Channel</h3>
                <span className="text-xs text-slate-400">Selected Range</span>
              </div>

              <div className="space-y-3 pt-1">
                {trafficChannels.length > 0 ? (
                  trafficChannels.map((ch, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">{ch.channel}</span>
                        <span className="font-extrabold text-slate-800">{ch.sessions?.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${ch.barPct || 5}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-6 text-center">
                    {isSummaryLoading ? 'Loading traffic channels...' : 'No channel records returned'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
