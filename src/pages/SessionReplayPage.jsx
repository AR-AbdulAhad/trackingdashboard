import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRecordingPlayback } from '../lib/api';
import { ArrowLeft, Loader2, PlayCircle } from 'lucide-react';

export default function SessionReplayPage() {
  const { recordingId } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const [playerError, setPlayerError] = useState('');

  const { data: recording, isLoading, error } = useQuery({
    queryKey: ['recording', recordingId],
    queryFn: () => getRecordingPlayback(recordingId),
    enabled: !!recordingId,
  });

  useEffect(() => {
    if (!recording || !recording.events || !iframeRef.current) return;

    try {
      let evts = typeof recording.events === 'string' 
        ? JSON.parse(recording.events) 
        : recording.events;
      
      if (!Array.isArray(evts) || evts.length < 2) {
        throw new Error('Invalid events array');
      }

      // Deep clone to prevent rrweb from mutating the React Query cache!
      const clonedEvents = JSON.parse(JSON.stringify(evts));

      // Pass events via parent window so they survive doc.write()
      window.__CURRENT_RECORDING_EVENTS__ = clonedEvents;

      const doc = iframeRef.current.contentDocument;
      
      if (doc) {
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <link rel="stylesheet" href="https://unpkg.com/rrweb-player@2.1.0/dist/style.css" />
            <style>
              body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #f8fafc; font-family: sans-serif; }
              #player-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
              .rr-player { box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
            </style>
          </head>
          <body>
            <div id="player-container"></div>
            <script src="https://unpkg.com/rrweb-player@2.1.0/dist/rrweb-player.umd.cjs"></script>
            <script>
              setTimeout(() => {
                try {
                  const events = window.parent.__CURRENT_RECORDING_EVENTS__;
                  if (!events || events.length === 0) return;
                  
                  const Player = window.rrwebPlayer.default || window.rrwebPlayer;
                  
                  new Player({
                    target: document.getElementById('player-container'),
                    props: {
                      events: events,
                      autoPlay: true,
                      showController: true,
                      autoScale: true,
                      width: window.innerWidth - 40,
                      height: window.innerHeight - 40
                    }
                  });
                } catch(e) {
                  console.error('Player error:', e);
                  document.body.innerHTML = '<div style="color:red;padding:20px;">Error rendering player: ' + e.message + '</div>';
                }
              }, 100);
            </script>
          </body>
          </html>
        `;
        
        doc.open();
        doc.write(html);
        doc.close();
      }

    } catch (err) {
      console.error(err);
      setPlayerError('Failed to initialize playback. Events may be corrupted.');
    }
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

          {/* Player Iframe - 100% Isolated to prevent React/Tailwind/Vite conflicts */}
          <iframe 
            ref={iframeRef} 
            className="w-full h-full border-none bg-slate-50"
            title="Session Replay Player"
          />
        </div>
      </div>
    </div>
  );
}
