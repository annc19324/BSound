import { query } from '@/lib/db';
import Link from 'next/link';
import SongGrid from '@/components/SongGrid';

// ISR: serve cached page instantly, refresh from DB every 30 seconds in background
// New songs will appear within ~30 seconds of being approved — no full redeploy needed
export const revalidate = 30;

export default async function Home() {
  // Fetch songs and playlists in parallel directly from DB
  const [songsRes, playlistsRes] = await Promise.all([
    query('SELECT * FROM songs WHERE status = $1 ORDER BY created_at DESC', ['APPROVED']),
    query('SELECT id, name FROM playlists ORDER BY created_at DESC'),
  ]);

  const songs = songsRes.rows;
  const playlists = playlistsRes.rows;

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px', lineHeight: 1 }}>
          B <span style={{ color: 'var(--primary)' }}>Sound</span>
        </h1>
      </header>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Mới cập nhật</h2>
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
