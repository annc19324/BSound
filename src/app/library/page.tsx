'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Music, ListMusic } from 'lucide-react';

export default function LibraryPage() {
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/playlists')
      .then(res => res.json())
      .then(data => Array.isArray(data) && setPlaylists(data));
  }, []);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '900' }}>Thư viện</h1>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
          {playlists.length} playlist
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
        <Link href="/playlist/create" className="song-card"
          style={{ justifyContent: 'center', alignItems: 'center', border: '2px dashed var(--glass-border)', background: 'transparent', minHeight: '200px' }}>
          <div style={{ fontSize: '2.5rem', color: 'var(--primary)' }}>+</div>
          <div style={{ fontWeight: '700', marginTop: '8px' }}>Tạo playlist mới</div>
        </Link>

        {playlists.map(p => (
          <Link key={p.id} href={`/playlist/${p.id}`} className="song-card">
            <div style={{
              width: '100%', aspectRatio: '1',
              background: 'linear-gradient(135deg, #1db954 0%, #191414 100%)',
              borderRadius: '10px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: '10px'
            }}>
              <ListMusic size={52} color="white" opacity={0.4} />
            </div>
            <div style={{ fontWeight: '700', wordBreak: 'break-word' }}>{p.name}</div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {p.song_count ?? 0} bài hát
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
