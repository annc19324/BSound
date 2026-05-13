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
    <div className="player-inner">

      {/* ── Row 1: Song info + play controls + right section ── */}
      <div className="player-row1">
        {/* Song Info */}
        <div className="player-song-info">
          <div className="player-thumb">
            {currentSong.image_url
              ? <img src={currentSong.image_url} alt={currentSong.title} />
              : <span>🎵</span>
            }
          </div>
          <div className="player-meta">
            <div className="player-title">{currentSong.title}</div>
            <div className="player-artist">{currentSong.artist}</div>
            {currentSong.uploader_id && currentSong.uploader_name && (
              <a href={`/user/${currentSong.uploader_id}`}
                style={{ fontSize: '0.62rem', color: 'var(--primary)', fontWeight: '700', opacity: 0.85, textDecoration: 'none' }}>
                @{currentSong.uploader_name}
              </a>
            )}
          </div>
        </div>

        {/* Playback Controls */}
        <div className="player-controls">
          <button onClick={toggleShuffle} title="Shuffle" className="hide-mobile">
            <Shuffle size={18} color={isShuffle ? 'var(--primary)' : 'var(--text-muted)'} />
          </button>
          <button onClick={prevSong}><SkipBack size={22} fill="currentColor" /></button>
          <button onClick={togglePlay} className="play-btn">
            {isPlaying ? <Pause size={22} fill="black" /> : <Play size={22} fill="black" style={{ marginLeft: '2px' }} />}
          </button>
          <button onClick={nextSong}><SkipForward size={22} fill="currentColor" /></button>
          <button onClick={toggleRepeat} title="Repeat" className="hide-mobile">
            {repeatMode === 'ONE' ? <Repeat1 size={18} color="var(--primary)" /> : <Repeat size={18} color={repeatMode === 'ALL' ? 'var(--primary)' : 'var(--text-muted)'} />}
          </button>
        </div>

        {/* Right: Volume + Download (desktop only) */}
        <div className="player-right hide-mobile">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Volume2 size={18} color={volume > 1 ? 'var(--primary)' : 'currentColor'} />
            <input type="range" min="0" max="2" step="0.01" value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              style={{ width: '80px', accentColor: 'var(--primary)', height: '4px' }}
            />
            <span style={{ fontSize: '0.65rem', width: '30px', fontWeight: '800', color: volume > 1 ? 'var(--primary)' : 'inherit' }}>
              {Math.round(volume * 100)}%
            </span>
          </div>
          <a href={currentSong.file_url} download title="Download" style={{ opacity: 0.8 }}>
            <Download size={18} />
          </a>
        </div>
      </div>

      {/* ── Row 2: Seek bar + Speed + Timer ── */}
      <div className="player-row2">
        <div className="player-seek">
          <span className="player-time">{formatTime(progress)}</span>
          <input type="range" min="0" max={duration || 0} value={progress}
            onChange={(e) => seek(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--primary)', cursor: 'pointer', height: '4px' }}
          />
          <span className="player-time">{formatTime(duration)}</span>
        </div>

        {/* Speed */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} title="Speed"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: playbackSpeed !== 1 ? 'var(--primary)' : 'inherit' }}>
            <Gauge size={16} /> {playbackSpeed}x
          </button>
          {showSpeedMenu && (
            <div className="glass" style={{ position: 'absolute', bottom: '130%', right: 0, padding: '8px', minWidth: '100px', zIndex: 200 }}>
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                <div key={speed} onClick={() => { setPlaybackSpeed(speed); setShowSpeedMenu(false); }}
                  style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', background: playbackSpeed === speed ? 'rgba(243,186,47,0.2)' : 'transparent', color: playbackSpeed === speed ? 'var(--primary)' : 'white' }}>
                  {speed}x
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timer */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setShowTimerMenu(!showTimerMenu)} title="Sleep Timer"
            style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Timer size={16} color={remainingTime ? 'var(--primary)' : 'currentColor'} />
            {remainingTime ? <span style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>{Math.ceil(remainingTime / 60)}m</span> : null}
          </button>
          {showTimerMenu && (
            <div className="glass" style={{ position: 'absolute', bottom: '130%', right: 0, padding: '12px', minWidth: '160px', zIndex: 200, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ fontSize: '0.7rem', marginBottom: '4px', textTransform: 'uppercase' }}>Hẹn giờ tắt</p>
              {[0, 5, 15, 30, 60].map(mins => (
                <div key={mins} onClick={() => { setSleepTimer(mins); setShowTimerMenu(false); }}
                  style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', background: 'rgba(255,255,255,0.03)' }}>
                  {mins === 0 ? 'Tắt' : `${mins} phút`}
                </div>
              ))}
              <input type="number" placeholder="Phút tùy chọn" value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && customMinutes) { setSleepTimer(parseInt(customMinutes)); setShowTimerMenu(false); setCustomMinutes(''); } }}
                style={{ width: '100%', padding: '6px', background: '#000', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px', fontSize: '0.8rem', marginTop: '8px' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Mobile only — Volume + Shuffle + Repeat + Download ── */}
      <div className="player-row3-mobile">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Volume2 size={15} color={volume > 1 ? 'var(--primary)' : 'var(--text-muted)'} />
          <input type="range" min="0" max="2" step="0.01" value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{ width: '70px', accentColor: 'var(--primary)', height: '3px' }}
          />
          <span style={{ fontSize: '0.65rem', color: volume > 1 ? 'var(--primary)' : 'var(--text-muted)', minWidth: '28px' }}>
            {Math.round(volume * 100)}%
          </span>
        </div>

        <button onClick={toggleShuffle} title="Shuffle" style={{ padding: '4px' }}>
          <Shuffle size={17} color={isShuffle ? 'var(--primary)' : 'var(--text-muted)'} />
        </button>

        <button onClick={toggleRepeat} title="Repeat" style={{ padding: '4px' }}>
          {repeatMode === 'ONE'
            ? <Repeat1 size={17} color="var(--primary)" />
            : <Repeat size={17} color={repeatMode === 'ALL' ? 'var(--primary)' : 'var(--text-muted)'} />
          }
        </button>

        <a href={currentSong.file_url} download title="Download" style={{ opacity: 0.75, padding: '4px', color: 'inherit' }}>
          <Download size={17} />
        </a>
      </div>

    </div>
  );
}
