'use client';

import React, { useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Heart, Play } from 'lucide-react';

export default function LikedPage() {
  const [songs, setSongs] = useState<any[]>([]);
  const { playSong } = usePlayer();

  useEffect(() => {
    fetch('/api/songs/liked')
      .then(res => res.json())
      .then(data => setSongs(data));
  }, []);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-end', marginBottom: '48px' }}>
        <div style={{ 
          width: '200px', 
          height: '200px', 
          background: 'linear-gradient(135deg, #450af5, #c4efd9)', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 24px rgba(0,0,0,0.5)'
        }}>
          <Heart size={80} fill="white" color="white" />
        </div>
        <div>
          <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800' }}>Playlist</p>
          <h1 style={{ fontSize: '4rem', margin: '4px 0' }}>Bài hát đã thích</h1>
          <p style={{ color: 'var(--text-muted)' }}>{songs.length} bài hát</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {songs.map((song, i) => (
          <div 
            key={song.id} 
            onClick={() => playSong(song)}
            className="song-row"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '12px 16px', 
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <div style={{ width: '32px', color: 'var(--text-muted)' }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600' }}>{song.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{song.artist}</div>
            </div>
            <Heart size={16} fill="var(--primary)" color="var(--primary)" />
          </div>
        ))}
        {songs.length === 0 && <p>Bạn chưa thích bài hát nào.</p>}
      </div>
    </div>
  );
}
