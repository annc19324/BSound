'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';
import { Music, ListMusic, Heart, Play, User } from 'lucide-react';
import Link from 'next/link';

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<'songs' | 'playlists'>('songs');
  const { playSong } = usePlayer();

  useEffect(() => {
    fetch(`/api/user/${id}`)
      .then(r => r.json())
      .then(setData);
  }, [id]);

  if (!data) return (
    <div className="fade-in" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
      <div className="loader" style={{ margin: '0 auto' }} />
    </div>
  );

  if (data.error) return (
    <div className="fade-in" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
      Không tìm thấy người dùng.
    </div>
  );

  const { user, songs, playlists } = data;

  return (
    <div className="fade-in">
      {/* ── Hero ── */}
      <div className="user-hero">
        <div className="user-hero-avatar">
          {user.image_url
            ? <img src={user.image_url} alt={user.name} />
            : <span>{user.name?.charAt(0)?.toUpperCase()}</span>
          }
        </div>
        <div className="user-hero-info">
          <p className="user-hero-type">Nghệ sĩ</p>
          <h1 className="user-hero-name">{user.name}</h1>
          <p className="user-hero-stats">
            <span><Music size={13} /> {songs.length} bài</span>
            <span><ListMusic size={13} /> {playlists.length} playlist</span>
          </p>
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
          {songs.length === 0 && (
            <p style={{ color: 'var(--text-muted)', padding: '20px 0' }}>Chưa có bài hát nào.</p>
          )}
          {songs.map((song: any, i: number) => (
            <div key={song.id} className="user-song-row" onClick={() => playSong(song, songs)}>
              <span className="user-song-num">{i + 1}</span>
              <div className="user-song-thumb">
                {song.image_url
                  ? <img src={song.image_url} alt={song.title} />
                  : <Music size={18} opacity={0.4} />
                }
              </div>
              <div className="user-song-meta">
                <div className="user-song-title">{song.title}</div>
                <div className="user-song-artist">{song.artist}</div>
              </div>
              <Play size={16} style={{ opacity: 0.4, flexShrink: 0 }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Playlists ── */}
      {tab === 'playlists' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
          {playlists.length === 0 && (
            <p style={{ color: 'var(--text-muted)', padding: '20px 0', gridColumn: '1/-1' }}>Chưa có playlist nào.</p>
          )}
          {playlists.map((p: any) => (
            <Link key={p.id} href={`/playlist/${p.id}`} className="song-card">
              <div style={{
                width: '100%', aspectRatio: '1',
                background: 'linear-gradient(135deg, #1db954, #191414)',
                borderRadius: '10px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: '10px'
              }}>
                <ListMusic size={48} color="white" opacity={0.35} />
              </div>
              <div style={{ fontWeight: '700', wordBreak: 'break-word' }}>{p.name}</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {p.song_count ?? 0} bài hát
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
