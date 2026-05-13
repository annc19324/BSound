'use client';

import React, { useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { MoreVertical, Heart, Headphones, Music } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Song {
  id: number;
  title: string;
  artist: string;
  image_url?: string;
  file_url: string;
  views: number;
  likes: number;
  status: string;
  uploader_id?: number;
  uploader_name?: string;
}

interface Playlist { id: number; name: string; }
interface Props { songs: Song[]; playlists: Playlist[]; }

export default function SongGrid({ songs, playlists }: Props) {
  const [showMenu, setShowMenu] = useState<number | null>(null);
  const { playSong, currentSong } = usePlayer();

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

  return (
    <div className="song-grid">
      {songs.map((song) => {
        const isActive = currentSong?.id === song.id;
        return (
          <div key={song.id} className={`song-card ${isActive ? 'song-card-active' : ''}`} style={{ position: 'relative' }}>
            {/* Cover art */}
            <div
              onClick={() => playSong(song, songs)}
              className={`song-cover ${isActive ? 'song-cover-active' : ''}`}
            >
              {song.image_url
                ? <img src={song.image_url} alt={song.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '1.5rem' }}>🎵</span>
              }
              {isActive && (
                <div className="song-playing-badge">▶</div>
              )}
            </div>

            {/* Info row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/song/${song.id}`}>
                  <div className="song-card-title">{song.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{song.artist}</div>
                </Link>
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
  );
}
