'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePlaylist() {
  const [name, setName] = useState('');
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '400px', margin: '100px auto' }}>
      <h1>Tạo Playlist mới</h1>
      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '32px' }}>
        <input 
          type="text" 
          placeholder="Tên playlist" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px' }}
          required
        />
        <button type="submit" style={{ padding: '16px', background: 'var(--primary)', color: 'black', fontWeight: '700', borderRadius: '30px' }}>
          Tạo ngay
        </button>
      </form>
    </div>
  );
}
