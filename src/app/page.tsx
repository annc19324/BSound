import { query } from '@/lib/db';
import Link from 'next/link';
import SongGrid from '@/components/SongGrid';
import DownloadAppButton from '@/components/DownloadAppButton';

// Bypass build-time prerendering since DB might not be accessible during build
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch songs and playlists in parallel directly from DB
  const [songsRes, playlistsRes] = await Promise.all([
    query(`
      SELECT s.*, u.name AS uploader_name
      FROM songs s
      LEFT JOIN users u ON u.id = s.uploader_id
      WHERE s.status = 'APPROVED'
      ORDER BY s.created_at DESC
    `),
    query('SELECT id, name FROM playlists ORDER BY created_at DESC'),
  ]);

  const songs = songsRes.rows;
  const playlists = playlistsRes.rows;

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px', lineHeight: 1, margin: 0 }}>
            B <span style={{ color: 'var(--primary)' }}>Sound</span>
          </h1>
          <DownloadAppButton />
        </div>
        <form action="/search" style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '10px 20px', border: '1px solid var(--glass-border)', flex: 1, minWidth: '200px', maxWidth: '400px' }}>
          <input type="text" name="q" placeholder="Tìm kiếm bài hát, nghệ sĩ..." style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '0.9rem' }} />
        </form>
      </header>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Mới cập nhật</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              {songs.length} bài hát
            </span>
          </div>
          <Link href="/upload" style={{ color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.7rem' }}>
            + Đăng nhạc
          </Link>
        </div>

        {/* SongGrid handles all client-side interactions (play, menu, playlist) */}
        <SongGrid songs={songs} playlists={playlists} />
      </section>
    </div>
  );
}
