import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRecordingPlayback } from '../lib/api';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';
import { ArrowLeft, Loader2, PlayCircle } from 'lucide-react';

export default function SessionReplayPage() {
  const { recordingId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [playerError, setPlayerError] = useState('');

  const { data: recording, isLoading, error } = useQuery({
    queryKey: ['recording', recordingId],
    queryFn: () => getRecordingPlayback(recordingId),
    enabled: !!recordingId,
  });

  useEffect(() => {
    if (!recording || !containerRef.current) return;

    if (!recording.events || recording.events.length < 2) {
      setPlayerError('Recording is too short or corrupted to playback.');
      return;
    }

    try {
      const evts = typeof recording.events === 'string' ? JSON.parse(recording.events) : recording.events;
      
      if (!Array.isArray(evts) || evts.length < 2) {
        throw new Error('Invalid events array');
      }

      // Clear previous player
      if (playerRef.current) {
        try {
          if (typeof playerRef.current.pause === 'function') playerRef.current.pause();
          if (typeof playerRef.current.$destroy === 'function') playerRef.current.$destroy();
        } catch(e) {
          console.warn(e);
        }
        playerRef.current = null;
      }

      containerRef.current.innerHTML = '';

      // Initialize new player
      playerRef.current = new rrwebPlayer({
        target: containerRef.current,
        props: {
          events: evts,
          autoPlay: true,
          showController: true,
          // Let it figure out its own dimensions
        },
      });

      // Try to trigger a resize to fix white screen
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 500);

    } catch (err) {
      console.error(err);
      setPlayerError('Failed to initialize playback. Events may be corrupted.');
    }

    return () => {
      if (playerRef.current) {
        try {
          if (typeof playerRef.current.pause === 'function') playerRef.current.pause();
          if (typeof playerRef.current.$destroy === 'function') playerRef.current.$destroy();
        } catch(e) {
          console.warn(e);
        }
      }
    };
  }, [recording]);

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <PlayCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg">Session Replay</h1>
            {recording && (
              <p className="text-xs text-slate-500 font-medium">
                Recorded {new Date(recording.createdAt).toLocaleString()} • {recording.pageUrl || 'Unknown'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative flex flex-col p-4 md:p-8">
        <div className="flex-1 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col relative">
          
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-sky-500">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <span className="font-bold text-sm">Fetching recording data...</span>
            </div>
          )}

          {(error || playerError) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
              <div className="bg-red-50 text-red-600 border border-red-200 p-6 rounded-xl max-w-md text-center shadow-lg">
                <p className="font-bold mb-2">Error loading playback</p>
                <p className="text-sm">{error?.message || playerError}</p>
              </div>
            </div>
          )}

          {/* Player Container - Taking full space */}
          <div 
            ref={containerRef} 
            className="w-full h-full flex items-center justify-center bg-slate-50 rrweb-player-container"
            style={{ minHeight: 0 }}
          />
        </div>
      </div>
    </div>
  );
}
