import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVisitors, getVisitorDetails, getRecordingPlayback } from '../lib/api';
import PageHeader from '../components/PageHeader';
import SessionPlayer from '../components/SessionPlayer';
import { Search, Filter, ChevronLeft, ChevronRight, ShoppingBag, Eye, Database, PlayCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';

const VisitorDetailPanel = ({ visitorId, onClose }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['visitor-details', visitorId],
    queryFn: () => getVisitorDetails(visitorId),
    enabled: !!visitorId,
  });

  const { formatDate, formatDateTime, t } = useI18n();

  const [activeTab, setActiveTab] = useState('overview');
  const [playingRecording, setPlayingRecording] = useState(null);

  const handlePlayRecording = async (id) => {
    try {
      const rec = await getRecordingPlayback(id);
      setPlayingRecording(rec);
    } catch {
      alert('Failed to load recording');
    }
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
                      {data.educationType || 'Unknown'} • {data.school || 'Unknown School'}
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
                <div className="space-y-6 animate-fade-in">
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
                        {data.orders.map(order => (
                          <div key={order.id} className="p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-slate-800">Order #{order.id}</p>
                              <p className="text-xs text-slate-500">{formatDateTime(order.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-emerald-600">{order.value} DKK</p>
                              <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-700">{order.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="animate-fade-in relative pl-4 border-l-2 border-slate-200 space-y-6">
                  {data.events.map(event => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-sky-500 ring-4 ring-white" />
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-sm text-slate-800 capitalize">{event.eventName?.replace(/_/g, ' ')}</p>
                          <span className="text-xs text-slate-400 font-medium">{formatDateTime(event.createdAt)}</span>
                        </div>
                        {event.eventParams && (
                          <pre className="text-xs text-slate-500 mt-2 bg-white p-2 rounded border border-slate-100 overflow-x-auto">
                            {JSON.stringify(event.eventParams, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'recordings' && (
                <div className="animate-fade-in space-y-4">
                  {data.recordings?.length > 0 ? (
                    data.recordings.map(rec => (
                      <div key={rec.id} className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between group hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                            <Eye className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-800">{rec.pageUrl || 'Configurator Session'}</p>
                            <p className="text-xs text-slate-500 font-medium">
                              {new Date(rec.createdAt).toLocaleString()} • {Math.round(rec.duration / 1000)}s
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePlayRecording(rec.id)}
                          className="px-4 py-2 bg-sky-500 text-white font-bold text-sm rounded-lg hover:bg-sky-600 transition-colors flex items-center gap-2"
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

      {playingRecording && (
        <SessionPlayer recording={playingRecording} onClose={() => setPlayingRecording(null)} />
      )}
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
              <option value="STX">STX</option>
              <option value="HHX">HHX</option>
              <option value="HTX">HTX</option>
              <option value="HF">HF</option>
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
                <th className="p-4 font-bold">School</th>
                <th className="p-4 font-bold">Visits</th>
                <th className="p-4 font-bold">Orders</th>
                <th className="p-4 font-bold">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center">
                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin" /></div>
                  </td>
                </tr>
              ) : data?.visitors?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400">
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
                        <span className="font-bold text-slate-800 text-sm max-w-[120px] truncate">{v.visitorId}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {v.educationType ? (
                        <span className={`badge ${v.educationType === 'STX' ? 'badge-blue' : v.educationType === 'HHX' ? 'badge-purple' : 'badge-amber'}`}>
                          {v.educationType}
                        </span>
                      ) : <span className="text-slate-400 text-sm">—</span>}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600 max-w-[150px] truncate">{v.school || '—'}</td>
                    <td className="p-4 text-sm font-bold text-slate-700">{v.visitCount}</td>
                    <td className="p-4">
                      {v._count?.orders > 0 ? (
                        <span className="badge badge-green flex items-center gap-1 w-max">
                          <ShoppingBag className="w-3 h-3" /> {v._count.orders}
                        </span>
                      ) : <span className="text-slate-400 text-sm">—</span>}
                    </td>
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
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page === data.pages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <VisitorDetailPanel visitorId={selectedVisitorId} onClose={closePanel} />
    </div>
  );
}
