'use client';

import React, { useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Play, MoreVertical, Heart, Headphones, Music } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [songs, setSongs] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [showMenu, setShowMenu] = useState<number | null>(null);
  const { playSong } = usePlayer();

  useEffect(() => {
    fetch('/api/songs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSongs(data);
      });

    fetch('/api/playlists')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPlaylists(data);
      });
  }, []);

  const addToPlaylist = async (songId: number, playlistId: number) => {
    const res = await fetch(`/api/playlists/${playlistId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song_id: songId }),
    });
    if (res.ok) {
      alert('Đã thêm vào playlist!');
      setShowMenu(null);
    }
  };

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px', lineHeight: 1 }}>
          B <span style={{ color: 'var(--primary)' }}>Sound</span>
        </h1>
      </header>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Mới cập nhật</h2>
          <Link href="/upload" style={{ color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.7rem' }}>+ Đăng nhạc</Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '20px'
        }}>
          {songs.length > 0 ? songs.map((song) => (
            <div key={song.id} className="song-card" style={{ position: 'relative' }}>
              <div
                onClick={() => playSong(song, songs)}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  background: '#1a1a1a',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  position: 'relative',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                {song.image_url ? (
                  <img src={song.image_url} alt={song.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  '🎵'
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/song/${song.id}`}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '4px' }}>{song.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{song.artist}</div>
                  </Link>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Headphones size={10} /> {song.views}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Heart size={10} fill="var(--primary)" color="var(--primary)" /> {song.likes}</span>
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <button onClick={(e) => { e.stopPropagation(); setShowMenu(showMenu === song.id ? null : song.id); }} style={{ padding: '2px' }}>
                    <MoreVertical size={14} color="var(--text-muted)" />
                  </button>
                  {showMenu === song.id && (
                    <div className="glass" style={{ position: 'absolute', bottom: '100%', right: 0, width: '180px', zIndex: 100, padding: '8px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', padding: '4px', textTransform: 'uppercase', fontWeight: '800' }}>Thêm vào Playlist</div>
                      <div style={{ maxHeight: '120px', overflowY: 'auto', marginTop: '4px' }}>
                        {playlists.map(p => (
                          <div
                            key={p.id}
                            onClick={() => addToPlaylist(song.id, p.id)}
                            style={{ padding: '8px', cursor: 'pointer', borderRadius: '6px', fontSize: '0.8rem' }}
                            className="menu-item"
                          >
                            {p.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'rgba(243, 186, 47, 0.01)', border: '1px dashed var(--glass-border)', borderRadius: '16px' }}>
              <Music size={32} style={{ marginBottom: '12px', opacity: 0.2 }} />
              <p style={{ fontSize: '0.9rem' }}>Chưa có bài hát nào.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
