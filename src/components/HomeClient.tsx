'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SongGrid from '@/components/SongGrid';
import DownloadAppButton from '@/components/DownloadAppButton';
import RefreshButton from '@/components/RefreshButton';
import NotesTrigger from '@/components/NotesTrigger';

export default function HomeClient({ initialSongs }: { initialSongs: any[] }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter songs based on search query
  const filteredSongs = initialSongs.filter(song => {
    const query = searchQuery.toLowerCase();
    return (
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query)
    );
  });

  return (
    <div className="fade-in">
      <header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        background: '#000000', // matches app background to prevent overlap issues
        paddingTop: '16px', // small padding to look good when scrolled
        paddingBottom: '16px',
        marginBottom: '16px',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '16px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px', lineHeight: 1, margin: 0 }}>
            B <span style={{ color: 'var(--primary)' }}>Sound</span>
            <RefreshButton />
            <NotesTrigger />
          </h1>
          <DownloadAppButton />
        </div>
        
        {/* Instant Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '10px 20px', border: '1px solid var(--glass-border)', flex: 1, minWidth: '200px', maxWidth: '400px' }}>
          <input 
            type="text" 
            placeholder="Tìm kiếm bài hát, nghệ sĩ..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '0.9rem' }} 
          />
        </div>
      </header>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Khám phá</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              {filteredSongs.length} bài hát
            </span>
          </div>
          <Link href="/upload" style={{ color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.7rem' }}>
            + Đăng nhạc
          </Link>
        </div>

        <SongGrid songs={filteredSongs} />
      </section>
    </div>
  );
}
