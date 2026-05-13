import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // User basic info
    const userRes = await query(
      'SELECT id, name, email, role, image_url, created_at FROM users WHERE id = $1',
      [id]
    );
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Songs uploaded by user (approved only)
    const songsRes = await query(
      `SELECT s.*, u.name AS uploader_name
       FROM songs s
       LEFT JOIN users u ON u.id = s.uploader_id
       WHERE s.uploader_id = $1 AND s.status = 'APPROVED'
       ORDER BY s.created_at DESC`,
      [id]
    );

    // Public playlists of user
    const playlistsRes = await query(
      `SELECT p.*, COUNT(ps.song_id)::int AS song_count
       FROM playlists p
       LEFT JOIN playlist_songs ps ON ps.playlist_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [id]
    );

    return NextResponse.json({
      user: userRes.rows[0],
      songs: songsRes.rows,
      playlists: playlistsRes.rows,
    });
  } catch (error) {
    console.error('User profile error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
