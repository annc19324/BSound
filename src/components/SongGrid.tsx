'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { MoreVertical, Heart, Headphones, Music } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/lib/image';

interface Song {
  id: number;
  title: string;
  artist: string;
  image_url?: string;
  file_url: string;
  views: number;
  likes: number;
  status: string;
  created_at?: string;
  uploader_id?: number;
  uploader_name?: string;
}

interface Playlist { id: number; name: string; }
interface Props { songs: Song[]; playlists: Playlist[]; }

export default function SongGrid({ songs, playlists }: Props) {
  const [showMenu, setShowMenu] = useState<number | null>(null);
  const [sortMethod, setSortMethod] = useState<'newest' | 'alpha'>('newest');
  const [mounted, setMounted] = useState(false);
  const { playSong, currentSong } = usePlayer();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('bsound_sort_method');
    if (saved === 'alpha' || saved === 'newest') {
      setSortMethod(saved);
    }
  }, []);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const method = e.target.value as 'newest' | 'alpha';
    setSortMethod(method);
    localStorage.setItem('bsound_sort_method', method);
  };

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const mainContent = document.querySelector('.main-content');
      if (!mainContent) return;

      const y = e.touches[0].clientY;
      const isPullingDown = y > startY;

      // Prevent pull-to-refresh if pulling down while at the top of the scroll container
      if (isPullingDown && mainContent.scrollTop <= 0) {
        e.preventDefault();
      }
    };

    grid.addEventListener('touchstart', handleTouchStart, { passive: true });
    grid.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      grid.removeEventListener('touchstart', handleTouchStart);
      grid.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const addToPlaylist = async (songId: number, playlistId: number) => {
    const res = await fetch(`/api/playlists/${playlistId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song_id: songId }),
    });
    if (res.ok) { toast.success('Đã thêm vào playlist!'); setShowMenu(null); }
  };

  if (songs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px dashed var(--glass-border)', borderRadius: '16px' }}>
        <Music size={32} style={{ marginBottom: '12px', opacity: 0.2 }} />
        <p style={{ fontSize: '0.9rem' }}>Chưa có bài hát nào.</p>
      </div>
    );
  }

  const sortedSongs = [...songs].sort((a, b) => {
    if (sortMethod === 'alpha') {
      return a.title.localeCompare(b.title);
    }
    // Newest
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    if (dateA === dateB) return b.id - a.id;
    return dateB - dateA;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        {mounted && (
          <select 
            value={sortMethod} 
            onChange={handleSortChange}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--glass-border)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '8px',
              outline: 'none',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <option value="newest" style={{ color: 'black' }}>Mới cập nhật</option>
            <option value="alpha" style={{ color: 'black' }}>Theo Alphabet</option>
          </select>
        )}
      </div>
      <div className="song-grid" ref={gridRef}>
        {sortedSongs.map((song) => {
        const isActive = currentSong?.id === song.id;
        return (
          <div 
            key={song.id} 
            id={`song-card-${song.id}`}
            className={`song-card ${isActive ? 'song-card-active' : ''}`} 
            style={{ position: 'relative', cursor: 'pointer' }}
            onClick={() => playSong(song, songs)}
          >
            {/* Cover art */}
            <div
              className={`song-cover ${isActive ? 'song-cover-active' : ''}`}
            >
              <img 
                src={getImageUrl(song.image_url, 300)} 
                alt={song.title} 
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              {isActive && (
                <div className="song-playing-badge">▶</div>
              )}
            </div>

            {/* Info row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div>
                  <div className="song-card-title">{song.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{song.artist}</div>
                </div>
                {/* Uploader */}
                {song.uploader_id && song.uploader_name && (
                  <Link href={`/user/${song.uploader_id}`}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: '700', opacity: 0.8 }}>
                    @{song.uploader_name}
                  </Link>
                )}
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Headphones size={9} /> {song.views}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Heart size={9} fill="var(--primary)" color="var(--primary)" /> {song.likes}</span>
                </div>
              </div>

              {/* 3-dot menu */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(showMenu === song.id ? null : song.id); }}
                  style={{ padding: '4px' }}
                >
                  <MoreVertical size={14} color="var(--text-muted)" />
                </button>
                {showMenu === song.id && (
                  <div className="song-menu-dropdown">
                    <div className="song-menu-label">Thêm vào Playlist</div>
                    <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
                      {playlists.length === 0
                        ? <div style={{ padding: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Chưa có playlist nào</div>
                        : playlists.map(p => (
                          <div key={p.id} onClick={() => addToPlaylist(song.id, p.id)} className="song-menu-item">
                            {p.name}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
    </div>
  );
}
