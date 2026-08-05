import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRecordingPlayback } from '../lib/api';
import { ArrowLeft, Loader2, PlayCircle, PauseCircle } from 'lucide-react';
import { Replayer } from 'rrweb';

export default function SessionReplayPage() {
  const { recordingId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const replayerRef = useRef(null);
  const [playerError, setPlayerError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  const { data: recording, isLoading, error } = useQuery({
    queryKey: ['recording', recordingId],
    queryFn: () => getRecordingPlayback(recordingId),
    enabled: !!recordingId,
  });

  useEffect(() => {
    if (!recording || !recording.events || !containerRef.current) return;

    try {
      // Deep clone events
      const evts = typeof recording.events === 'string' ? JSON.parse(recording.events) : JSON.parse(JSON.stringify(recording.events));
      
      if (!Array.isArray(evts) || evts.length < 2) {
        throw new Error('Invalid events array');
      }

      containerRef.current.innerHTML = ''; // Clean container

      const replayer = new Replayer(evts, {
        root: containerRef.current,
        unpackFn: null,
      });

      // Scale player to fit container perfectly using absolute centering
      const padding = 32; 
      const containerWidth = containerRef.current.clientWidth - padding;
      const containerHeight = containerRef.current.clientHeight - padding;
      const metaEvent = evts.find(e => e.type === 4);
      
      if (metaEvent && metaEvent.data) {
        const recordWidth = metaEvent.data.width || 1024;
        const recordHeight = metaEvent.data.height || 576;
        
        const scaleX = containerWidth / recordWidth;
        const scaleY = containerHeight / recordHeight;
        const scale = Math.min(scaleX, scaleY, 1); 
        
        replayer.wrapper.style.position = 'absolute';
        replayer.wrapper.style.top = '50%';
        replayer.wrapper.style.left = '50%';
        replayer.wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
        replayer.wrapper.style.transformOrigin = 'center center';
      }

      replayerRef.current = replayer;
      
      // Setup timing
      const metaData = replayer.getMetaData();
      setTotalTime(metaData.totalTime);
      setCurrentTime(0);

      // Auto play
      replayer.play();
      setIsPlaying(true);

      replayer.on('finish', () => {
        setIsPlaying(false);
        setCurrentTime(metaData.totalTime);
      });

    } catch (err) {
      console.error(err);
      setPlayerError('Failed to initialize playback. Events may be corrupted.');
    }

    return () => {
      if (replayerRef.current) {
        try {
          replayerRef.current.pause();
          replayerRef.current.destroy();
        } catch(e) {}
      }
    };
  }, [recording]);

  // Update timer while playing
  useEffect(() => {
    let interval;
    if (isPlaying && replayerRef.current) {
      interval = setInterval(() => {
        if (replayerRef.current && replayerRef.current.timer) {
          setCurrentTime(replayerRef.current.timer.timeOffset);
        }
      }, 50); // High frequency for smooth slider
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    if (!replayerRef.current) return;
    if (isPlaying) {
      replayerRef.current.pause();
    } else {
      replayerRef.current.play(currentTime >= totalTime ? 0 : currentTime);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const newTime = parseInt(e.target.value, 10);
    setCurrentTime(newTime);
    if (replayerRef.current) {
      replayerRef.current.play(newTime);
      if (!isPlaying) setIsPlaying(true);
    }
  };

  const formatTime = (ms) => {
    if (isNaN(ms) || ms < 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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

          {/* The Custom Player Container */}
          <div className="flex-1 relative overflow-hidden bg-slate-50 flex items-center justify-center p-4" ref={containerRef}>
             {/* rrweb will inject iframe here */}
          </div>
          
          {/* Custom Controls */}
          {recording && !playerError && (
            <div className="h-16 bg-white border-t border-slate-200 flex items-center px-6 gap-4 shrink-0 z-20">
               <button onClick={togglePlay} className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-md transition-transform hover:scale-105">
                 {isPlaying ? <PauseCircle className="w-6 h-6" fill="currentColor" /> : <PlayCircle className="w-6 h-6" fill="currentColor" />}
               </button>
               
               <div className="text-sm font-semibold text-slate-700 font-mono w-12 text-right">
                 {formatTime(currentTime)}
               </div>
               
               <div className="flex-1 px-2 flex items-center">
                 <input 
                   type="range" 
                   min="0" 
                   max={totalTime || 100} 
                   value={currentTime} 
                   onChange={handleSeek}
                   className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                 />
               </div>
               
               <div className="text-sm font-semibold text-slate-500 font-mono w-12">
                 {formatTime(totalTime)}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
