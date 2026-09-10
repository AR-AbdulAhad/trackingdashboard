import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVisitors, getVisitorDetails, getRecordingPlayback } from '../lib/api';
import PageHeader from '../components/PageHeader';
import { 
  Search, Filter, ChevronLeft, ChevronRight, ShoppingBag, Eye, Database, 
  PlayCircle, CheckCircle, AlertCircle, Clock, Percent, Layers, Tag, 
  ChevronDown, ChevronUp 
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';

const pkgBadgeMap = {
  'premium': 'bg-sky-100 text-sky-700 border-sky-200',
  'luksus': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'standard': 'bg-purple-100 text-purple-700 border-purple-200',
  'basic': 'bg-amber-100 text-amber-700 border-amber-200',
};

export const EDUCATION_LIST = [
  { value: 'STX', label: 'STX' },
  { value: 'HHX', label: 'HHX' },
  { value: 'HTX', label: 'HTX' },
  { value: 'HF', label: 'HF' },
  { value: 'EUD', label: 'EUD' },
  { value: 'EUX', label: 'EUX' },
  { value: 'SOSUASSISTENT', label: 'SOSU Assistent' },
  { value: 'SOSUHJAELPER', label: 'SOSU Hjælper' },
  { value: 'PAEDAGOG', label: 'Pædagog' },
  { value: 'PAU', label: 'PAU' },
  { value: 'FRISOER', label: 'Frisør' },
  { value: 'KOSMETOLOG', label: 'Kosmetolog' },
  { value: 'ERNAERINGSASSISTENT', label: 'Ernæringsassistent' },
  { value: 'LANDMAND', label: 'Landmand' },
  { value: 'STU', label: 'STU' },
];

export const formatEducation = (type) => {
  if (!type) return '—';
  const found = EDUCATION_LIST.find(
    e => e.value.toLowerCase() === String(type).toLowerCase() || e.label.toLowerCase() === String(type).toLowerCase()
  );
  return found ? found.label : type;
};

export const CONFIGURATOR_STEPS = [
  { id: 1, name: 'KOKARDE', label: 'Kokarde', aliases: ['KOKARDE'] },
  { id: 2, name: 'EMBLEM', label: 'Emblem', aliases: ['EMBLEM'] },
  { id: 3, name: 'BÅND', label: 'Bånd', aliases: ['BÅND', 'UDDANNELSESBÅND', 'UDDANNELSESBAND', 'BAND'] },
  { id: 4, name: 'FOER', label: 'Foer', aliases: ['FOER', 'FODER'] },
  { id: 5, name: 'SKYGGE', label: 'Skygge', aliases: ['SKYGGE'] },
  { id: 6, name: 'HUESNOR', label: 'Huesnor', aliases: ['HUESNOR', 'SNOR'] },
  { id: 7, name: 'BRODERI', label: 'Broderi', aliases: ['BRODERI'] },
  { id: 8, name: 'TILBEHØR', label: 'Tilbehør', aliases: ['TILBEHØR', 'TILBEHOER', 'TILBEH'] },
  { id: 9, name: 'STØRRELSE', label: 'Størrelse', aliases: ['STØRRELSE', 'STOERRELSE', 'SIZE'] },
];

export const normalizeStepName = (name) => {
  if (!name) return '';
  const upper = String(name).trim().toUpperCase();
  const step = CONFIGURATOR_STEPS.find(s => 
    s.name === upper || s.aliases.some(a => upper.includes(a) || a.includes(upper))
  );
  return step ? step.name : upper;
};

const eduBadgeMap = {
  'STX': 'badge-blue',
  'HHX': 'badge-purple',
  'HTX': 'badge-amber',
  'HF': 'badge-emerald',
  'EUD': 'badge-red',
  'EUX': 'badge-pink',
  'SOSUASSISTENT': 'badge-teal',
  'SOSU Assistent': 'badge-teal',
  'SOSUHJAELPER': 'badge-cyan',
  'SOSU Hjælper': 'badge-cyan',
  'PAEDAGOG': 'badge-orange',
  'Pædagog': 'badge-orange',
  'PAU': 'badge-indigo',
  'FRISOER': 'badge-fuchsia',
  'Frisør': 'badge-fuchsia',
  'KOSMETOLOG': 'badge-rose',
  'Kosmetolog': 'badge-rose',
  'ERNAERINGSASSISTENT': 'badge-lime',
  'Ernæringsassistent': 'badge-lime',
  'LANDMAND': 'badge-emerald',
  'Landmand': 'badge-emerald',
  'STU': 'badge-amber',
};

const EventTimelineCard = ({ event, formatDateTime }) => {
  const [showRaw, setShowRaw] = useState(false);
  const p = event.eventParams || {};
  const isAbandoned = event.eventName === 'configurator_abandoned';
  const isStepView = event.eventName === 'configurator_step_view';
  const isCompleted = event.eventName === 'configurator_completed' || event.eventName === 'purchase_completed';
  const isStarted = event.eventName === 'configurator_started';
  const isCommerce = ['add_to_cart', 'checkout_started', 'purchase_completed'].includes(event.eventName);

  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
  if (isAbandoned) badgeColor = 'bg-rose-100 text-rose-700 border-rose-200';
  else if (isCompleted) badgeColor = 'bg-emerald-100 text-emerald-700 border-emerald-200';
  else if (isStepView) badgeColor = 'bg-sky-100 text-sky-700 border-sky-200';
  else if (isStarted) badgeColor = 'bg-indigo-100 text-indigo-700 border-indigo-200';

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${badgeColor} capitalize`}>
            {event.eventName?.replace(/_/g, ' ')}
          </span>
          {p.package && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-600 border border-sky-100 uppercase">
              {p.package}
            </span>
          )}
          {p.program && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-100 uppercase">
              {p.program}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400 font-medium">{formatDateTime(event.createdAt)}</span>
      </div>

      {/* Step View Details */}
      {isStepView && (
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-100">
            <span className="font-bold text-slate-700">
              Step {p.step_index || 1} / {p.total_steps || 9}: <span className="text-sky-600">{p.step_name}</span>
            </span>
            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              {p.step_percentage || p.activity_percentage || 0}% Done
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            {p.time_spent_on_previous_step !== undefined && (
              <div className="bg-white p-2 rounded border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Time on Prev Step</span>
                <span className="font-bold text-slate-700">{p.time_spent_on_previous_step}s</span>
                {p.previous_step && <span className="text-slate-400 text-[10px] ml-1">({p.previous_step})</span>}
              </div>
            )}
            {p.total_time_spent !== undefined && (
              <div className="bg-white p-2 rounded border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Time Spent</span>
                <span className="font-bold text-slate-700">{p.total_time_spent}s</span>
              </div>
            )}
          </div>

          {p.skipped_steps && p.skipped_steps.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 p-2 rounded-lg text-xs text-amber-700">
              <span className="font-bold">Skipped Steps:</span> {p.skipped_steps.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Abandoned Details */}
      {isAbandoned && (
        <div className="mt-2 bg-rose-50 border border-rose-100 p-3 rounded-xl text-xs space-y-1.5">
          <div className="flex justify-between font-bold text-rose-800">
            <span>Left at: {p.last_step || 'Unknown Step'}</span>
            <span>{p.percentage_completed || 0}% Completed</span>
          </div>
          {p.total_time_spent !== undefined && (
            <p className="text-rose-600 font-medium">
              Time spent before leaving: <span className="font-bold">{p.total_time_spent} seconds</span>
            </p>
          )}
          {p.visited_steps && (
            <p className="text-slate-600">
              <span className="font-bold">Visited:</span> {p.visited_steps.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Commerce Details */}
      {isCommerce && (
        <div className="mt-2 bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-xs flex justify-between items-center">
          <div>
            <p className="font-bold text-emerald-800 uppercase">{event.eventName.replace(/_/g, ' ')}</p>
            {p.order_ref && <p className="text-slate-500 font-medium mt-0.5">Ref: {p.order_ref}</p>}
          </div>
          {p.value && <p className="text-sm font-bold text-emerald-700">{Number(p.value).toLocaleString()} DKK</p>}
        </div>
      )}

      {/* Raw Toggle */}
      <button
        onClick={() => setShowRaw(!showRaw)}
        className="text-[11px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 mt-2.5 transition-colors"
      >
        {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {showRaw ? 'Hide JSON Params' : 'View Raw Params'}
      </button>

      {showRaw && (
        <pre className="text-xs text-slate-500 mt-2 bg-white p-2.5 rounded-lg border border-slate-100 overflow-x-auto">
          {JSON.stringify(event.eventParams, null, 2)}
        </pre>
      )}
    </div>
  );
};

const VisitorOverviewTab = ({ data, formatDate, formatDateTime }) => {
  const stepTracking = data.stepTracking;
  const events = data.events && !Array.isArray(data.events) ? Object.values(data.events) : (data.events || []);
  const stepViews = events.filter(e => e.eventName === 'configurator_step_view');
  const abandonEvent = events.find(e => e.eventName === 'configurator_abandoned');
  const checkoutEvent = events.find(e => e.eventName === 'checkout_started' || e.eventName === 'add_to_cart');
  const completedEvent = events.find(e => e.eventName === 'configurator_completed' || e.eventName === 'purchase_completed');
  const hasPurchased = data.orders?.some(o => o.status === 'purchased') || !!completedEvent;
  const isCheckedOut = Boolean(stepTracking?.checkedOut || checkoutEvent || hasPurchased);

  // Extract visited steps
  let visitedStepsList = [];
  if (Array.isArray(stepTracking?.visitedSteps) && stepTracking.visitedSteps.length > 0) {
    visitedStepsList = stepTracking.visitedSteps;
  } else {
    const vSet = new Set();
    events.forEach(e => {
      if (Array.isArray(e.eventParams?.visited_steps)) {
        e.eventParams.visited_steps.forEach(s => vSet.add(s));
      } else if (e.eventParams?.step_name) {
        vSet.add(e.eventParams.step_name);
      }
    });
    visitedStepsList = Array.from(vSet);
  }

  // Extract skipped steps
  let skippedStepsList = [];
  if (Array.isArray(stepTracking?.skippedSteps) && stepTracking.skippedSteps.length > 0) {
    skippedStepsList = stepTracking.skippedSteps;
  } else {
    const sSet = new Set();
    events.forEach(e => {
      if (Array.isArray(e.eventParams?.skipped_steps)) {
        e.eventParams.skipped_steps.forEach(s => sSet.add(s));
      }
    });
    skippedStepsList = Array.from(sSet);
  }

  // Normalize step sets for robust matching
  const visitedNormalized = new Set(visitedStepsList.map(s => normalizeStepName(s)));
  const skippedNormalized = new Set(skippedStepsList.map(s => normalizeStepName(s)));

  // Each page visited is 11% (1 page = 11%, 2 pages = 22%, 9 pages = 100%)
  const visitedCount = visitedNormalized.size || visitedStepsList.length;
  let maxPct = stepTracking?.percentage;
  if (typeof maxPct !== 'number' || maxPct === 0) {
    maxPct = visitedCount >= 9 || hasPurchased ? 100 : visitedCount * 11;
  }
  if (hasPurchased) maxPct = 100;

  let totalConfigTime = 0;
  if (abandonEvent?.eventParams?.total_time_spent) {
    totalConfigTime = abandonEvent.eventParams.total_time_spent;
  } else if (stepViews.length > 0 && stepViews[0].eventParams?.total_time_spent) {
    totalConfigTime = stepViews[0].eventParams.total_time_spent;
  }

  const lastStep = stepTracking?.lastStepVisited || abandonEvent?.eventParams?.last_step || (stepViews.length > 0 ? stepViews[0].eventParams?.step_name : null);

  const stepStatusList = CONFIGURATOR_STEPS.map(step => {
    const isVisited = visitedNormalized.has(step.name);
    const isSkipped = !isVisited && skippedNormalized.has(step.name);
    return {
      ...step,
      isVisited,
      isSkipped,
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Configurator Activity & Journey Intelligence Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50/40 border border-sky-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-800 text-sm">Configurator Activity & Journey</h3>
          </div>
          <span className={`badge font-bold px-3 py-1 rounded-full text-xs ${
            hasPurchased 
              ? 'badge-green' 
              : isCheckedOut 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                : abandonEvent 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-sky-100 text-sky-800'
          }`}>
            {hasPurchased 
              ? '100% Completed & Purchased' 
              : isCheckedOut 
                ? `Checked Out (${maxPct}% Funnel • ${visitedCount}/9 Pages)`
                : abandonEvent 
                  ? `Left at ${lastStep || 'Step'} (${maxPct}% Activity)` 
                  : `${maxPct}% Activity Reached (${visitedCount}/9 Pages)`}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-600">
            <span>Funnel Progress ({visitedCount} pages visited × 11%)</span>
            <span className="text-sky-600 font-extrabold">{maxPct}%</span>
          </div>
          <div className="h-2.5 bg-slate-200/70 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-sky-500 to-emerald-500"
              style={{ width: `${Math.max(maxPct, 5)}%` }}
            />
          </div>
        </div>

        {/* Checkout Banner if user initiated checkout */}
        {isCheckedOut && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold">
                {hasPurchased ? 'Order Purchased & Paid' : 'User Reached Checkout'}
              </span>
            </div>
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded">
              {visitedCount} of 9 Visited ({maxPct}%)
            </span>
          </div>
        )}

        {/* 9 Configurator Pages Grid */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>9 Step-by-Step Pages Breakdown</span>
            <span className="text-slate-400 font-medium">11% per page</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {stepStatusList.map((step) => {
              if (step.isVisited) {
                return (
                  <div key={step.id} className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        ✓
                      </div>
                      <span className="text-xs font-bold text-emerald-950 truncate">
                        {step.id}. {step.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                      +11%
                    </span>
                  </div>
                );
              } else if (step.isSkipped) {
                return (
                  <div key={step.id} className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        ↷
                      </div>
                      <span className="text-xs font-bold text-amber-950 truncate">
                        {step.id}. {step.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
                      Skipped
                    </span>
                  </div>
                );
              } else {
                return (
                  <div key={step.id} className="p-2.5 rounded-xl border border-slate-200 bg-white/70 flex items-center justify-between opacity-55">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {step.id}
                      </div>
                      <span className="text-xs font-medium text-slate-600 truncate">
                        {step.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 shrink-0">
                      —
                    </span>
                  </div>
                );
              }
            })}
          </div>
        </div>

        {/* Journey Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2.5 bg-white rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Time Spent</span>
            <span className="text-xs font-extrabold text-slate-700">{totalConfigTime}s</span>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Last Step</span>
            <span className="text-xs font-extrabold text-slate-700 truncate block">{lastStep || 'None'}</span>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Pages Visited</span>
            <span className="text-xs font-extrabold text-emerald-600">{visitedCount} / 9</span>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Skipped</span>
            <span className={`text-xs font-extrabold ${skippedStepsList.length > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
              {skippedStepsList.length > 0 ? `${skippedStepsList.length} Steps` : '0 Steps'}
            </span>
          </div>
        </div>

        {skippedStepsList.length > 0 && (
          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-800">
            <span className="font-bold">Skipped Pages:</span> {skippedStepsList.map(s => {
              const norm = normalizeStepName(s);
              const found = CONFIGURATOR_STEPS.find(c => c.name === norm);
              return found ? found.label : s;
            }).join(', ')}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase">First Visit</p>
          <p className="text-sm font-bold text-slate-800 mt-1">{formatDate(data.firstVisitAt)}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase">Last Visit</p>
          <p className="text-sm font-bold text-slate-800 mt-1">{formatDate(data.lastVisitAt)}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase">Total Visits</p>
          <p className="text-sm font-bold text-slate-800 mt-1">{data.visitCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <p className="text-xs font-bold text-emerald-600 uppercase">Purchases</p>
          <p className="text-sm font-bold text-emerald-700 mt-1">{data.orders.length}</p>
        </div>
      </div>

      {data.orders.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-800 mb-3">Order History</h3>
          <div className="space-y-3">
            {data.orders.map(order => {
              const formattedValue = typeof order.value === 'object' && order.value !== null
                ? (order.value.d ? Number(order.value.s * Number(order.value.d.join('')) * Math.pow(10, order.value.e - order.value.d.join('').length + 1)) : Number(order.value) || 0)
                : (order.value ?? 0);
              return (
                <div key={order.id} className="p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">Order #{order.id}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">{Number(formattedValue).toLocaleString()} DKK</p>
                    <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-700">{order.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const VisitorDetailPanel = ({ visitorId, onClose }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['visitor-details', visitorId],
    queryFn: () => getVisitorDetails(visitorId),
    enabled: !!visitorId,
  });

  const { formatDate, formatDateTime, t } = useI18n();
  const [activeTab, setActiveTab] = useState('overview');

  const handlePlayRecording = (id) => {
    window.open(`/replay/${id}`, '_blank');
  };

  if (!visitorId) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col">

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
          </div>
        ) : data ? (
          <>
            <div className="p-6 border-b border-slate-100 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {data.visitorId.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 brand-text">{data.visitorId}</h2>
                    <p className="text-sm font-medium text-slate-500">
                      {(data.educationType ? formatEducation(data.educationType) : 'Unknown')} • {data.school || 'Unknown School'}
                    </p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl">
                {['overview', 'timeline', 'recordings'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg capitalize transition-all relative ${
                      activeTab === tab
                        ? 'bg-white text-sky-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab === 'recordings' && (
                      <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    )}
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && (
                <VisitorOverviewTab data={data} formatDate={formatDate} formatDateTime={formatDateTime} />
              )}

              {activeTab === 'timeline' && (
                <div className="animate-fade-in relative pl-4 border-l-2 border-slate-200 space-y-4">
                  {(Array.isArray(data.events) ? data.events : Object.values(data.events || {})).map(event => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-[21px] top-4 w-3 h-3 rounded-full bg-sky-500 ring-4 ring-white" />
                      <EventTimelineCard event={event} formatDateTime={formatDateTime} />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'recordings' && (
                <div className="animate-fade-in space-y-4">
                  {data.recordings?.length > 0 ? (
                    data.recordings.map(rec => (
                      <div key={rec.id} className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-4 group hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 shrink-0 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                            <Eye className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-slate-800 truncate" title={rec.pageUrl}>
                              {rec.pageUrl || 'Configurator Session'}
                            </p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {new Date(rec.createdAt).toLocaleString()} • {Math.round(rec.duration / 1000)}s
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePlayRecording(rec.id)}
                          className="shrink-0 px-4 py-2 bg-sky-500 text-white font-bold text-sm rounded-lg hover:bg-sky-600 transition-colors flex items-center gap-2 shadow-sm"
                        >
                          <PlayCircle className="w-4 h-4" /> Play
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <PlayCircle className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm font-medium">No session recordings available.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-6 text-red-500 font-bold">Failed to load visitor details.</div>
        )}
      </div>
    </>
  );
};

export default function VisitorsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [eduFilter, setEduFilter] = useState('');

  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const selectedVisitorId = queryParams.get('id');

  const { data, isLoading } = useQuery({
    queryKey: ['visitors', page, search, eduFilter],
    queryFn: () => getVisitors(page, 20, search, eduFilter),
    keepPreviousData: true,
  });

  const { formatDate } = useI18n();

  const closePanel = () => navigate('/visitors', { replace: true });

  return (
    <div className="animate-fade-in pb-10">
      <PageHeader
        title="Visitor Intelligence"
        description="Comprehensive directory of all tracked users, sessions, and purchases"
        hideDateFilter={true}
      />

      <div className="card h-full flex flex-col p-0 overflow-hidden">

        {/* Toolbar */}
        <div className="p-4 md:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID or School..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-sky-500 font-medium text-sm transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={eduFilter}
              onChange={e => { setEduFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-sm outline-none cursor-pointer"
            >
              <option value="">All Educations</option>
              {EDUCATION_LIST.map((edu) => (
                <option key={edu.value} value={edu.value}>
                  {edu.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="p-4 font-bold">Visitor</th>
                <th className="p-4 font-bold">Education</th>
                {/* <th className="p-4 font-bold">School</th> */}
                <th className="p-4 font-bold">Package</th>
                <th className="p-4 font-bold">Visits</th>
                {/* <th className="p-4 font-bold">Orders</th> */}
                <th className="p-4 font-bold">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center">
                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin" /></div>
                  </td>
                </tr>
              ) : data?.visitors?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-slate-400">
                    <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-bold">No visitors found.</p>
                  </td>
                </tr>
              ) : (
                data?.visitors?.map(v => (
                  <tr
                    key={v.visitorId}
                    onClick={() => navigate(`/visitors?id=${v.visitorId}`)}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 group-hover:bg-sky-100 group-hover:text-sky-600 transition-colors">
                          {v.visitorId.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-800 text-sm max-w-[190px] truncate">{v.visitorId}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {v.educationType ? (
                        <span className={`badge ${eduBadgeMap[v.educationType] || eduBadgeMap[formatEducation(v.educationType)] || 'bg-slate-100 text-slate-700'}`}>
                          {formatEducation(v.educationType)}
                        </span>
                      ) : <span className="text-slate-400 text-sm">—</span>}
                    </td>
                    {/* <td className="p-4 text-sm font-medium text-slate-600 max-w-[150px] truncate">{v.school || '—'}</td> */}
                    <td className="p-4">
                      {v.packagePreference ? (
                        <span className={`badge border ${pkgBadgeMap[v.packagePreference] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {v.packagePreference.charAt(0).toUpperCase() + v.packagePreference.slice(1)}
                        </span>
                      ) : <span className="text-slate-400 text-sm">—</span>}
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-700">{v.visitCount}</td>
                    {/* <td className="p-4">
                      {v._count?.orders > 0 ? (
                        <span className="badge badge-green flex items-center gap-1 w-max">
                          <ShoppingBag className="w-3 h-3" /> {v._count.orders}
                        </span>
                      ) : <span className="text-slate-400 text-sm">—</span>}
                    </td> */}
                    <td className="p-4 text-xs font-medium text-slate-500">{formatDate(v.lastVisitAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <span className="text-sm font-medium text-slate-500">
              Page <span className="font-bold text-slate-700">{data.page}</span> of {data.pages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                disabled={page === data.pages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}

      </div>

      <VisitorDetailPanel visitorId={selectedVisitorId} onClose={closePanel} />
    </div>
  );
}
