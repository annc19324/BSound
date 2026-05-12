'use client';

import React, { useEffect, useState, use } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Play, Music } from 'lucide-react';

export default function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [songs, setSongs] = useState<any[]>([]);
  const [playlist, setPlaylist] = useState<any>(null);
  const { playSong } = usePlayer();

  useEffect(() => {
    fetch(`/api/playlists/${id}`)
      .then(res => res.json())
      .then(data => setSongs(data));
      
    // Ideally we fetch playlist info too, but for now we just show name
  }, [id]);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-end', marginBottom: '48px' }}>
        <div style={{ 
          width: '200px', 
          height: '200px', 
          background: 'linear-gradient(45deg, #1db954, #191414)', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 24px rgba(0,0,0,0.5)'
        }}>
          <Music size={80} color="white" opacity={0.5} />
        </div>
        <div>
          <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800' }}>Playlist</p>
          <h1 style={{ fontSize: '4rem', margin: '4px 0' }}>Danh sách phát</h1>
          <p style={{ color: 'var(--text-muted)' }}>{songs.length} bài hát</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {songs.map((song, i) => (
          <div 
            key={song.id} 
            className="song-row" 
            onClick={() => playSong(song)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '12px 16px', 
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
          >
            <div style={{ width: '32px', color: 'var(--text-muted)' }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600' }}>{song.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{song.artist}</div>
            </div>
            <div style={{ color: 'var(--text-muted)' }}>3:45</div>
          </div>
        ))}
        {songs.length === 0 && <p>Chưa có bài hát nào trong playlist này.</p>}
      </div>
    </div>
  );
}
