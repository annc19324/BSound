'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, Timer, Gauge, Download, Shuffle, Repeat, Repeat1, ThumbsUp, ThumbsDown, Mic2 } from 'lucide-react';

export default function Player() {
  const { 
    currentSong, isPlaying, togglePlay, progress, duration, seek, 
    playbackSpeed, setPlaybackSpeed, volume, setVolume,
    setSleepTimer, remainingTime,
    isShuffle, toggleShuffle, repeatMode, toggleRepeat, nextSong, prevSong
  } = usePlayer();
  const router = useRouter();

  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userInteraction, setUserInteraction] = useState<'LIKE' | 'DISLIKE' | null>(null);
  const viewedSongId = useRef<number | null>(null);

  // Lyrics states
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [lyrics, setLyricsText] = useState('');
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load lyrics when modal opens or active song changes
  useEffect(() => {
    if (showLyricsModal && currentSong) {
      if (currentSong.lyrics) {
        setLyricsText(currentSong.lyrics);
      } else {
        setLoadingLyrics(true);
        fetch(`/api/songs/${currentSong.id}`)
          .then(res => res.json())
          .then(data => {
            setLyricsText(data.lyrics || '');
          })
          .catch(err => {
            console.error("Failed to load lyrics", err);
          })
          .finally(() => {
            setLoadingLyrics(false);
          });
      }
    }
  }, [showLyricsModal, currentSong?.id]);

  const handleCopyLyrics = () => {
    if (!lyrics) return;
    navigator.clipboard.writeText(lyrics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentSong) return;

    try {
      const url = currentSong.file_url;
      if (url.includes('res.cloudinary.com')) {
        const downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${currentSong.title} - ${currentSong.artist}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${currentSong.title} - ${currentSong.artist}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error('Direct download failed, falling back to open in new tab', err);
      window.open(currentSong.file_url, '_blank');
    }
  };

  // When song changes: load interaction state + increment view once
  useEffect(() => {
    if (!currentSong) return;
    // Increment view once per song
    if (viewedSongId.current !== currentSong.id) {
      viewedSongId.current = currentSong.id;
      fetch(`/api/songs/${currentSong.id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'VIEW' }),
      });
    }
    // Load user's interaction
    fetch(`/api/songs/${currentSong.id}/interactions`)
      .then(r => r.json())
      .then(d => setUserInteraction(d.userInteraction || null));
    // Load current counts
    fetch(`/api/songs/${currentSong.id}`)
      .then(r => r.json())
      .then(d => { setLikes(d.likes || 0); setDislikes(d.dislikes || 0); });
  }, [currentSong?.id]);

  const handleInteraction = async (type: 'LIKE' | 'DISLIKE') => {
    if (!currentSong) return;
    const res = await fetch(`/api/songs/${currentSong.id}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    if (res.ok) {
      const d = await res.json();
      setLikes(d.likes); setDislikes(d.dislikes); setUserInteraction(d.userInteraction);
    }
  };

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
        <div className="player-song-info" onClick={() => router.push(`/song/${currentSong.id}`)} style={{ cursor: 'pointer' }}>
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
                onClick={(e) => e.stopPropagation()}
                style={{ fontSize: '0.62rem', color: 'var(--primary)', fontWeight: '700', opacity: 0.85, textDecoration: 'none' }}>
                @{currentSong.uploader_name}
              </a>
            )}
          </div>
        </div>

        {/* Playback Controls */}
        <div className="player-controls">
          <button onClick={toggleShuffle} title="Shuffle" className="hide-mobile">
            <Shuffle size={22} color={isShuffle ? 'var(--primary)' : 'var(--text-muted)'} />
          </button>
          <button onClick={prevSong}><SkipBack size={22} fill="currentColor" /></button>
          <button onClick={togglePlay} className="play-btn">
            {isPlaying ? <Pause size={22} fill="black" /> : <Play size={22} fill="black" style={{ marginLeft: '2px' }} />}
          </button>
          <button onClick={nextSong}><SkipForward size={22} fill="currentColor" /></button>
          <button onClick={toggleRepeat} title="Repeat" className="hide-mobile">
            {repeatMode === 'ONE' ? <Repeat1 size={22} color="var(--primary)" /> : <Repeat size={22} color={repeatMode === 'ALL' ? 'var(--primary)' : 'var(--text-muted)'} />}
          </button>
        </div>

        {/* Right: Like/Dislike + Volume + Download (desktop only) */}
        <div className="player-right hide-mobile">
          {/* Like / Dislike */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button onClick={() => handleInteraction('LIKE')} title="Thích"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: '700',
                color: userInteraction === 'LIKE' ? 'var(--primary)' : 'var(--text-muted)', transition: '0.2s' }}>
              <ThumbsUp size={20} fill={userInteraction === 'LIKE' ? 'var(--primary)' : 'none'} />
              {likes}
            </button>
            <button onClick={() => handleInteraction('DISLIKE')} title="Không thích"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: '700',
                color: userInteraction === 'DISLIKE' ? '#ff6b6b' : 'var(--text-muted)', transition: '0.2s' }}>
              <ThumbsDown size={20} fill={userInteraction === 'DISLIKE' ? '#ff6b6b' : 'none'} />
              {dislikes}
            </button>
          </div>
          {/* Lyrics Icon before Volume */}
          <button onClick={() => setShowLyricsModal(true)} title="Xem lời bài hát" style={{ opacity: 0.8, color: 'inherit', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}>
            <Mic2 size={22} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Volume2 size={22} color={volume > 1 ? 'var(--primary)' : 'currentColor'} />
            <input type="range" min="0" max="2" step="0.01" value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              style={{ width: '80px', accentColor: 'var(--primary)', height: '4px' }}
            />
            <span style={{ fontSize: '0.65rem', width: '30px', fontWeight: '800', color: volume > 1 ? 'var(--primary)' : 'inherit' }}>
              {Math.round(volume * 100)}%
            </span>
          </div>
          <button onClick={handleDownload} title="Download" style={{ opacity: 0.8, color: 'inherit' }}>
            <Download size={22} />
          </button>
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
            <Gauge size={20} /> {playbackSpeed}x
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
            <Timer size={20} color={remainingTime ? 'var(--primary)' : 'currentColor'} />
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
        {/* Lyrics Icon on Mobile before Volume */}
        <button onClick={() => setShowLyricsModal(true)} title="Xem lời bài hát" style={{ opacity: 0.8, padding: '4px', color: 'inherit', display: 'flex', alignItems: 'center' }}>
          <Mic2 size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Volume2 size={22} color={volume > 1 ? 'var(--primary)' : 'var(--text-muted)'} />
          <input type="range" min="0" max="2" step="0.01" value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{ width: '70px', accentColor: 'var(--primary)', height: '3px' }}
          />
          <span style={{ fontSize: '0.65rem', color: volume > 1 ? 'var(--primary)' : 'var(--text-muted)', minWidth: '28px' }}>
            {Math.round(volume * 100)}%
          </span>
        </div>

        <button onClick={toggleShuffle} title="Shuffle" style={{ padding: '4px' }}>
          <Shuffle size={22} color={isShuffle ? 'var(--primary)' : 'var(--text-muted)'} />
        </button>

        <button onClick={toggleRepeat} title="Repeat" style={{ padding: '4px' }}>
          {repeatMode === 'ONE'
            ? <Repeat1 size={22} color="var(--primary)" />
            : <Repeat size={22} color={repeatMode === 'ALL' ? 'var(--primary)' : 'var(--text-muted)'} />
          }
        </button>

        <button onClick={handleDownload} title="Download" style={{ opacity: 0.75, padding: '4px', color: 'inherit' }}>
          <Download size={22} />
        </button>
      </div>

      {/* ── Lyric Modal ── */}
      {showLyricsModal && (
        <div className="modal-overlay" onClick={() => setShowLyricsModal(false)} style={{ zIndex: 10000 }}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'white', fontWeight: 800 }}>{currentSong.title}</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{currentSong.artist}</p>
              </div>
              <button onClick={() => setShowLyricsModal(false)} style={{ fontSize: '1.5rem', color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                &times;
              </button>
            </div>
            
            <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '6px', whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '0.95rem', color: '#e5e5e5' }}>
              {loadingLyrics ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
                  <div className="loader" style={{ width: '30px', height: '30px' }} />
                </div>
              ) : lyrics ? (
                lyrics
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>Chưa có lời bài hát.</p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '12px', gap: '8px' }}>
              <button 
                onClick={handleCopyLyrics} 
                disabled={!lyrics}
                style={{ 
                  background: copied ? 'rgba(0, 255, 100, 0.12)' : 'var(--primary)', 
                  color: copied ? '#00e676' : 'black', 
                  fontWeight: 800, 
                  padding: '8px 16px', 
                  borderRadius: '10px', 
                  fontSize: '0.85rem', 
                  transition: 'all 0.2s', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  cursor: lyrics ? 'pointer' : 'not-allowed',
                  opacity: lyrics ? 1 : 0.5
                }}
              >
                {copied ? 'Đã sao chép!' : 'Copy Lời bài hát'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
