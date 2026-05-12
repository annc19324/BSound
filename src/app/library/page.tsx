'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Music } from 'lucide-react';

export default function LibraryPage() {
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/playlists')
      .then(res => res.json())
      .then(data => setPlaylists(data));
  }, []);

  return (
    <div className="fade-in">
      <h1>Thư viện của bạn</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px', marginTop: '32px' }}>
        <Link href="/playlist/create" className="song-card" style={{ justifyContent: 'center', alignItems: 'center', border: '2px dashed var(--glass-border)', background: 'transparent' }}>
          <div style={{ fontSize: '3rem', color: 'var(--primary)' }}>+</div>
          <div style={{ fontWeight: '700' }}>Tạo playlist mới</div>
        </Link>

        {playlists.map(p => (
          <Link key={p.id} href={`/playlist/${p.id}`} className="song-card">
            <div style={{ 
              width: '100%', 
              aspectRatio: '1', 
              background: 'linear-gradient(45deg, #1db954, #191414)', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <Music size={60} color="white" opacity={0.3} />
            </div>
            <div style={{ fontWeight: '700' }}>{p.name}</div>
            <p style={{ fontSize: '0.8rem' }}>Playlist • Bạn</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
