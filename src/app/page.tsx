import { query } from '@/lib/db';
import HomeClient from '@/components/HomeClient';

// Bypass build-time prerendering since DB might not be accessible during build
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch songs directly from DB
  const songsRes = await query(`
    SELECT s.*, u.name AS uploader_name
    FROM songs s
    LEFT JOIN users u ON u.id = s.uploader_id
    WHERE s.status = 'APPROVED'
    ORDER BY s.created_at DESC
  `);

  const songs = songsRes.rows;

  return <HomeClient initialSongs={songs} />;
}
