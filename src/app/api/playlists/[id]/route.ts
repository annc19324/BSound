import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try { return jwt.verify(token, process.env.JWT_SECRET!) as any; }
  catch { return null; }
}

// GET — songs in playlist
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await query(`
      SELECT s.*, u.name AS uploader_name
      FROM songs s
      JOIN playlist_songs ps ON s.id = ps.song_id
      LEFT JOIN users u ON u.id = s.uploader_id
      WHERE ps.playlist_id = $1
    `, [id]);
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// POST — add song to playlist
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playlist_id } = await params;
    const { song_id } = await request.json();
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await query(
      'INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [playlist_id, song_id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// PATCH — rename playlist
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name } = await request.json();
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await query(
      'UPDATE playlists SET name = $1 WHERE id = $2 AND user_id = $3',
      [name, id, user.id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// DELETE — delete playlist
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await query('DELETE FROM playlist_songs WHERE playlist_id = $1', [id]);
    await query('DELETE FROM playlists WHERE id = $1 AND user_id = $2', [id, user.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
