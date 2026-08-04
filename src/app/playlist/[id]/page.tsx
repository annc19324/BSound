'use client';

import React, { useEffect, useState, use } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Play, Music, Trash2, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [songs, setSongs] = useState<any[]>([]);
  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [playlist, setPlaylist] = useState<any>(null);
  const { playSong } = usePlayer();

  const loadPlaylistSongs = () => {
    fetch(`/api/playlists/${id}`)
      .then(res => res.json())
      .then(data => setSongs(data));
  };

  useEffect(() => {
    loadPlaylistSongs();
    
    // Fetch all available songs to add
    fetch('/api/songs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAllSongs(data);
      });
  }, [id]);

  const addSong = async (songId: number) => {
    const res = await fetch(`/api/playlists/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song_id: songId }),
    });
    if (res.ok) {
      toast.success('Đã thêm bài hát');
      loadPlaylistSongs();
    }
  };

  const removeSong = async (songId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await fetch(`/api/playlists/${id}/songs/${songId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      toast.success('Đã xoá khỏi playlist');
      loadPlaylistSongs();
    }
  };

  const availableSongs = allSongs.filter(s => !songs.find(ps => ps.id === s.id));
  const filteredAvailable = availableSongs.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.artist.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5); // Show top 5 results

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
            id={`song-card-${song.id}`}
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
            <button 
              onClick={(e) => removeSong(song.id, e)}
              style={{ color: '#ff4444', padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.7 }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {songs.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Chưa có bài hát nào trong playlist này.</p>}
      </div>

      <div style={{ marginTop: '64px', borderTop: '1px solid var(--glass-border)', paddingTop: '32px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={20} /> Thêm bài hát vào My playlist
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px 16px', border: '1px solid var(--glass-border)', marginBottom: '16px' }}>
          <Search size={18} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
          <input 
            type="text" 
            placeholder="Tìm kiếm bài hát..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '0.95rem' }} 
          />
        </div>
        
        {searchQuery && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredAvailable.map(song => (
              <div key={song.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{song.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{song.artist}</div>
                </div>
                <button 
                  onClick={() => addSong(song.id)}
                  style={{ background: 'var(--primary)', color: 'black', border: 'none', padding: '6px 16px', borderRadius: '20px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Thêm
                </button>
              </div>
            ))}
            {filteredAvailable.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Không tìm thấy bài hát phù hợp.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
