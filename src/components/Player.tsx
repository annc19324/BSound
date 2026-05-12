'use client';

import React, { useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, Timer, Gauge, Download, Shuffle, Repeat, Repeat1 } from 'lucide-react';

export default function Player() {
  const { 
    currentSong, isPlaying, togglePlay, progress, duration, seek, 
    playbackSpeed, setPlaybackSpeed, volume, setVolume,
    setSleepTimer, remainingTime,
    isShuffle, toggleShuffle, repeatMode, toggleRepeat, nextSong, prevSong
  } = usePlayer();

  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');

  if (!currentSong) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="player-bar" style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '20px', alignItems: 'center', padding: '0 20px' }}>
      {/* Song Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <div style={{ width: '56px', height: '56px', background: '#222', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', flexShrink: 0 }}>
          {currentSong.image_url ? (
            <img src={currentSong.image_url} alt={currentSong.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '1.2rem' }}>🎵</span>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'white', marginBottom: '2px' }}>{currentSong.title}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{currentSong.artist}</div>
        </div>
      </div>

      {/* Controls & Progress */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <button onClick={toggleShuffle} title="Shuffle" className="hide-mobile">
            <Shuffle size={18} color={isShuffle ? 'var(--primary)' : 'var(--text-muted)'} />
          </button>
          <button onClick={prevSong}><SkipBack size={22} fill="currentColor" /></button>
          <button 
            onClick={togglePlay}
            style={{ background: 'var(--primary)', color: 'black', borderRadius: '50%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
          >
            {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" style={{ marginLeft: '2px' }} />}
          </button>
          <button onClick={nextSong}><SkipForward size={22} fill="currentColor" /></button>
          <button onClick={toggleRepeat} title="Repeat" className="hide-mobile">
            {repeatMode === 'ONE' ? <Repeat1 size={18} color="var(--primary)" /> : <Repeat size={18} color={repeatMode === 'ALL' ? 'var(--primary)' : 'var(--text-muted)'} />}
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '40px', textAlign: 'right' }}>{formatTime(progress)}</span>
          <input 
            type="range" 
            min="0" 
            max={duration || 0} 
            value={progress}
            onChange={(e) => seek(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--primary)', cursor: 'pointer', height: '4px' }}
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '40px' }}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Extra Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'flex-end' }}>
        <div style={{ position: 'relative' }} className="hide-mobile">
          <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} title="Speed" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: playbackSpeed !== 1 ? 'var(--primary)' : 'inherit' }}>
            <Gauge size={18} /> {playbackSpeed}x
          </button>
          {showSpeedMenu && (
            <div className="glass" style={{ position: 'absolute', bottom: '130%', right: 0, padding: '8px', minWidth: '100px', zIndex: 100 }}>
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                <div 
                  key={speed} 
                  onClick={() => { setPlaybackSpeed(speed); setShowSpeedMenu(false); }}
                  style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', background: playbackSpeed === speed ? 'rgba(243, 186, 47, 0.2)' : 'transparent', color: playbackSpeed === speed ? 'var(--primary)' : 'white' }}
                >
                  {speed}x
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowTimerMenu(!showTimerMenu)} title="Sleep Timer">
            <Timer size={18} color={remainingTime ? 'var(--primary)' : 'currentColor'} />
          </button>
          {showTimerMenu && (
            <div className="glass" style={{ position: 'absolute', bottom: '130%', right: 0, padding: '12px', minWidth: '160px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ fontSize: '0.7rem', marginBottom: '4px', textTransform: 'uppercase' }}>Hẹn giờ tắt</p>
              {[0, 5, 15, 30, 60].map(mins => (
                <div key={mins} onClick={() => { setSleepTimer(mins); setShowTimerMenu(false); }} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', background: 'rgba(255,255,255,0.03)' }}>
                  {mins === 0 ? 'Tắt' : `${mins} phút`}
                </div>
              ))}
              <input 
                type="number" 
                placeholder="Phút tùy chọn" 
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && customMinutes) { setSleepTimer(parseInt(customMinutes)); setShowTimerMenu(false); setCustomMinutes(''); } }}
                style={{ width: '100%', padding: '6px', background: '#000', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px', fontSize: '0.8rem', marginTop: '8px' }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="hide-mobile">
          <Volume2 size={18} color={volume > 1 ? 'var(--primary)' : 'currentColor'} />
          <input 
            type="range" 
            min="0" 
            max="2" 
            step="0.01" 
            value={volume} 
            onChange={(e) => setVolume(parseFloat(e.target.value))} 
            style={{ width: '80px', accentColor: 'var(--primary)', height: '4px' }} 
          />
          <span style={{ fontSize: '0.65rem', width: '30px', fontWeight: '800', color: volume > 1 ? 'var(--primary)' : 'inherit' }}>
            {Math.round(volume * 100)}%
          </span>
        </div>

        <a href={currentSong.file_url} download title="Download" style={{ opacity: 0.8 }} className="hide-mobile">
          <Download size={18} />
        </a>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .player-bar { grid-template-columns: 1fr 1fr !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
