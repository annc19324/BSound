'use client';

import React, { useEffect, useState, use } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Play, Music, Trash2, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [songs, setSongs] = useState<any[]>([]);
  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [selectedSongIds, setSelectedSongIds] = useState<number[]>([]);
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

  const addSong = async (songId: number, silent = false) => {
    const res = await fetch(`/api/playlists/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song_id: songId }),
    });
    if (res.ok && !silent) {
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
  );

  const toggleSongSelection = (songId: number) => {
    setSelectedSongIds(prev => 
      prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId]
    );
  };

  const handleAddSelected = async () => {
    if (selectedSongIds.length === 0) return;
    for (const songId of selectedSongIds) {
      await addSong(songId, true);
    }
    toast.success(`Đã thêm ${selectedSongIds.length} bài hát vào playlist`);
    setSelectedSongIds([]);
    loadPlaylistSongs();
  };

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
            placeholder="Tìm kiếm để lọc bài hát..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '0.95rem' }} 
          />
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '8px', background: 'rgba(0,0,0,0.2)' }}>
          {filteredAvailable.map(song => (
            <label 
              key={song.id} 
              style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s', borderBottom: '1px solid rgba(255,255,255,0.02)' }} 
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} 
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <input 
                type="checkbox" 
                checked={selectedSongIds.includes(song.id)}
                onChange={() => toggleSongSelection(song.id)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '1rem' }}>{song.title}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{song.artist}</div>
              </div>
            </label>
          ))}
          {filteredAvailable.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Không còn bài hát nào để thêm.
            </div>
          )}
        </div>

        <button
          onClick={handleAddSelected}
          disabled={selectedSongIds.length === 0}
          style={{
            marginTop: '16px',
            width: '100%',
            padding: '14px',
            borderRadius: '8px',
            background: selectedSongIds.length > 0 ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
            color: selectedSongIds.length > 0 ? 'black' : 'var(--text-muted)',
            fontWeight: 'bold',
            fontSize: '1rem',
            border: 'none',
            cursor: selectedSongIds.length > 0 ? 'pointer' : 'not-allowed',
            transition: 'var(--transition-smooth)'
          }}
        >
          Thêm {selectedSongIds.length > 0 ? `${selectedSongIds.length} bài hát` : ''} vào playlist
        </button>
      </div>
    </div>
  );
}
