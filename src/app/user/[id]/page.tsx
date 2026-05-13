'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';
import { Music, ListMusic, Play, Pencil, Trash2, Save, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<'songs' | 'playlists'>('songs');
  const [myId, setMyId] = useState<number | null>(null);
  const [editingSong, setEditingSong] = useState<any>(null);
  const { playSong } = usePlayer();

  const load = () => {
    fetch(`/api/user/${id}`).then(r => r.json()).then(setData);
  };

  useEffect(() => {
    load();
    // Get current user id for owner check
    fetch('/api/notifications').then(r => r.json()).then(d => setMyId(d.userId));
  }, [id]);

  const isOwner = myId !== null && data?.user?.id === myId;

  const deleteSong = async (songId: number, title: string) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ margin: 0, fontSize: '0.85rem' }}>Xoá bài <strong>{title}</strong>?</p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => toast.dismiss(t.id)}
            style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
          >
            Huỷ
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              const res = await fetch(`/api/songs/${songId}/owner`, { method: 'DELETE' });
              if (res.ok) {
                toast.success('Đã xoá bài hát');
                load();
              } else {
                toast.error('Không thể xoá bài hát');
              }
            }}
            style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', background: '#ff4444', color: '#fff', fontWeight: '700' }}
          >
            Xoá
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const saveEdit = async () => {
    if (!editingSong) return;
    await fetch(`/api/songs/${editingSong.id}/owner`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editingSong.title,
        artist: editingSong.artist,
        lyrics: editingSong.lyrics,
      }),
    });
    setEditingSong(null);
    load();
  };

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <div className="loader" />
    </div>
  );
  if (data.error) return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Không tìm thấy người dùng.</div>;

  const { user, songs, playlists } = data;

  return (
    <div className="fade-in">
      {/* ── Hero ── */}
      <div className="user-hero">
        <div className="user-hero-avatar">
          {user.image_url ? <img src={user.image_url} alt={user.name} /> : <span>{user.name?.charAt(0)?.toUpperCase()}</span>}
        </div>
        <div className="user-hero-info">
          <p className="user-hero-type">{isOwner ? 'Trang của tôi' : 'Nghệ sĩ'}</p>
          <h1 className="user-hero-name">{user.name}</h1>
          <p className="user-hero-stats">
            <span><Music size={13} /> {songs.length} bài</span>
            <span><ListMusic size={13} /> {playlists.length} playlist</span>
          </p>
          {isOwner && (
            <Link href="/profile" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700', marginTop: '8px', display: 'inline-block' }}>
              ✏️ Chỉnh sửa thông tin cá nhân →
            </Link>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="user-tabs">
        <button className={tab === 'songs' ? 'active' : ''} onClick={() => setTab('songs')}>
          <Music size={15} /> Bài hát <span className="tab-count">{songs.length}</span>
        </button>
        <button className={tab === 'playlists' ? 'active' : ''} onClick={() => setTab('playlists')}>
          <ListMusic size={15} /> Playlist <span className="tab-count">{playlists.length}</span>
        </button>
      </div>

      {/* ── Songs ── */}
      {tab === 'songs' && (
        <div className="user-song-list">
          {songs.length === 0 && <p style={{ color: 'var(--text-muted)', padding: '20px 0' }}>Chưa có bài hát nào.</p>}
          {songs.map((song: any, i: number) => (
            <div key={song.id}>
              {/* Edit form */}
              {editingSong?.id === song.id ? (
                <div className="song-edit-form glass">
                  <div className="form-group">
                    <label>Tên bài hát</label>
                    <input value={editingSong.title} onChange={e => setEditingSong({ ...editingSong, title: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Nghệ sĩ</label>
                    <input value={editingSong.artist} onChange={e => setEditingSong({ ...editingSong, artist: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Lời bài hát</label>
                    <textarea rows={5} value={editingSong.lyrics || ''} onChange={e => setEditingSong({ ...editingSong, lyrics: e.target.value })} style={{ resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={saveEdit} className="btn-save" style={{ flex: 1 }}><Save size={15} /> Lưu</button>
                    <button onClick={() => setEditingSong(null)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)' }}><X size={15} /></button>
                  </div>
                </div>
              ) : (
                <div className="user-song-row" onClick={() => playSong(song, songs)}>
                  <span className="user-song-num">{i + 1}</span>
                  <div className="user-song-thumb">
                    {song.image_url ? <img src={song.image_url} alt={song.title} /> : <Music size={18} opacity={0.4} />}
                  </div>
                  <div className="user-song-meta">
                    <div className="user-song-title">{song.title}</div>
                    <div className="user-song-artist">
                      {song.artist}
                      {song.status === 'PENDING' && <span style={{ marginLeft: 6, fontSize: '0.65rem', color: 'orange', fontWeight: 800 }}>● Chờ duyệt</span>}
                    </div>
                  </div>
                  <Play size={15} style={{ opacity: 0.35, flexShrink: 0 }} />
                  {/* Owner controls */}
                  {isOwner && (
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => setEditingSong({ ...song })} className="btn-edit" title="Sửa" style={{ padding: '6px', borderRadius: '8px' }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deleteSong(song.id, song.title)} className="btn-delete" title="Xoá" style={{ padding: '6px', borderRadius: '8px' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Playlists ── */}
      {tab === 'playlists' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
          {playlists.length === 0 && <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', padding: '20px 0' }}>Chưa có playlist nào.</p>}
          {playlists.map((p: any) => (
            <Link key={p.id} href={`/playlist/${p.id}`} className="song-card">
              <div style={{ width: '100%', aspectRatio: '1', background: 'linear-gradient(135deg, #1db954, #191414)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <ListMusic size={48} color="white" opacity={0.35} />
              </div>
              <div style={{ fontWeight: '700', wordBreak: 'break-word' }}>{p.name}</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{p.song_count ?? 0} bài hát</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
