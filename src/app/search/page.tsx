'use client';

import React, { useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Search as SearchIcon, Play } from 'lucide-react';

export default function SearchPage() {
  const [queryStr, setQueryStr] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const { playSong } = usePlayer();

  useEffect(() => {
    if (!queryStr.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      fetch(`/api/songs/search?q=${encodeURIComponent(queryStr)}`)
        .then(res => res.json())
        .then(data => setResults(data));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [queryStr]);

  return (
    <div className="fade-in">
      <div style={{ position: 'relative', marginBottom: '40px' }}>
        <SearchIcon style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
        <input 
          type="text" 
          placeholder="Bạn muốn nghe gì?" 
          value={queryStr}
          onChange={(e) => setQueryStr(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '16px 16px 16px 48px', 
            background: 'var(--bg-card)', 
            border: '1px solid var(--glass-border)', 
            color: 'white', 
            borderRadius: '30px',
            fontSize: '1.1rem'
          }}
        />
      </div>

      {results.length > 0 && (
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '800' }}>Kết quả</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{results.length} bài hát</span>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
        gap: '24px' 
      }}>
        {results.map((song) => (
          <div key={song.id} className="song-card" onClick={() => playSong(song)}>
             <div style={{ 
                width: '100%', 
                aspectRatio: '1', 
                background: 'linear-gradient(45deg, #333, #111)',
                borderRadius: '8px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                position: 'relative'
              }}>
                🎵
              </div>
            <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>{song.title}</h3>
            <p style={{ fontSize: '0.85rem' }}>{song.artist}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
