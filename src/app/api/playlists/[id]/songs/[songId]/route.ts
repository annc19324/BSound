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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string, songId: string }> }
) {
  try {
    const { id, songId } = await params;
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Ensure the playlist belongs to the user
    const pl = await query('SELECT * FROM playlists WHERE id = $1 AND user_id = $2', [id, user.id]);
    if (pl.rows.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await query('DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2', [id, songId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
