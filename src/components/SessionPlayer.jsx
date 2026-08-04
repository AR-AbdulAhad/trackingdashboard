import { useState, useRef } from 'react';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';
import { useEffect } from 'react';
import { X, PlayCircle, Loader2 } from 'lucide-react';

export default function SessionPlayer({ recording, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!recording || !recording.events || recording.events.length < 2) {
      setError('Recording is too short or corrupted to playback.');
      setLoading(false);
      return;
    }

    try {
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current = null;
      }

      playerRef.current = new rrwebPlayer({
        target: containerRef.current,
        props: {
          events: typeof recording.events === 'string' ? JSON.parse(recording.events) : recording.events,
          autoPlay: true,
          width: 800,
          height: 600,
        },
      });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to initialize playback. Events may be corrupted.');
      setLoading(false);
    }

    return () => {
      if (playerRef.current && typeof playerRef.current.pause === 'function') {
        playerRef.current.pause();
      }
    };
  }, [recording]);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col border border-slate-200 animate-fade-in relative">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 brand-text">Session Replay</h2>
              <p className="text-xs text-slate-500 font-medium">
                Recorded {new Date(recording.createdAt).toLocaleString()} • {recording.pageUrl || 'Configurator'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-4 bg-slate-100 flex-1 min-h-[600px] flex items-center justify-center relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-10 text-sky-500">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <span className="font-bold text-sm">Loading playback engine...</span>
            </div>
          )}

          {error && (
            <div className="text-red-500 font-bold bg-red-50 p-4 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div ref={containerRef} className="rounded-xl overflow-hidden shadow-lg border border-slate-200" />
        </div>
      </div>
    </div>
  );
}
