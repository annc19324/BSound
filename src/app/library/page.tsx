'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ListMusic, Pencil, Trash2, Check, X } from 'lucide-react';

export default function LibraryPage() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const load = () => {
    fetch('/api/playlists')
      .then(res => res.json())
      .then(data => Array.isArray(data) && setPlaylists(data));
  };

  useEffect(() => { load(); }, []);

  const startEdit = (p: any) => { setEditingId(p.id); setEditName(p.name); };
  const cancelEdit = () => { setEditingId(null); setEditName(''); };

  const saveEdit = async (id: number) => {
    if (!editName.trim()) return;
    await fetch(`/api/playlists/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    });
    cancelEdit();
    load();
  };

  const deletePlaylist = async (id: number, name: string) => {
    if (!confirm(`Xoá playlist "${name}"?`)) return;
    await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '900' }}>Thư viện</h1>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
          {playlists.length} playlist
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
        {/* Create new */}
        <Link href="/playlist/create" className="song-card"
          style={{ justifyContent: 'center', alignItems: 'center', border: '2px dashed var(--glass-border)', background: 'transparent', minHeight: '200px', textDecoration: 'none' }}>
          <div style={{ fontSize: '2.5rem', color: 'var(--primary)' }}>+</div>
          <div style={{ fontWeight: '700', marginTop: '8px' }}>Tạo playlist mới</div>
        </Link>

        {playlists.map(p => (
          <div key={p.id} className="song-card" style={{ position: 'relative' }}>
            <Link href={`/playlist/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{
                width: '100%', aspectRatio: '1',
                background: 'linear-gradient(135deg, #1db954 0%, #191414 100%)',
                borderRadius: '10px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: '10px'
              }}>
                <ListMusic size={52} color="white" opacity={0.4} />
              </div>
            </Link>

            {/* Edit name inline */}
            {editingId === p.id ? (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(p.id); if (e.key === 'Escape') cancelEdit(); }}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid var(--primary)',
                    borderRadius: '6px', color: 'white', padding: '4px 8px', fontSize: '0.82rem',
                  }}
                />
                <button onClick={() => saveEdit(p.id)} style={{ color: '#00e676', padding: '2px' }}><Check size={15} /></button>
                <button onClick={cancelEdit} style={{ color: 'var(--text-muted)', padding: '2px' }}><X size={15} /></button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                <Link href={`/playlist/${p.id}`} style={{ fontWeight: '700', wordBreak: 'break-word', flex: 1, color: 'inherit', textDecoration: 'none' }}>
                  {p.name}
                </Link>
                <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                  <button onClick={() => startEdit(p)} title="Đổi tên"
                    style={{ padding: '3px', borderRadius: '6px', opacity: 0.6 }}
                    className="btn-edit-inline">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => deletePlaylist(p.id, p.name)} title="Xoá"
                    style={{ padding: '3px', borderRadius: '6px', opacity: 0.6 }}
                    className="btn-delete-inline">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )}
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {p.song_count ?? 0} bài hát
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
