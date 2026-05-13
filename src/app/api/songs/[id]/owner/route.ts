import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { revalidatePath } from 'next/cache';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try { return jwt.verify(token, process.env.JWT_SECRET!) as any; }
  catch { return null; }
}

// PATCH — owner edits their song (title, artist, lyrics)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { title, artist, lyrics } = await request.json();

  // Only owner or admin can edit
  const check = await query('SELECT uploader_id FROM songs WHERE id = $1', [id]);
  if (!check.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (check.rows[0].uploader_id !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await query(
    'UPDATE songs SET title = $1, artist = $2, lyrics = $3 WHERE id = $4',
    [title, artist, lyrics ?? null, id]
  );
  revalidatePath('/');
  return NextResponse.json({ success: true });
}

// DELETE — owner deletes their song
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const check = await query('SELECT uploader_id FROM songs WHERE id = $1', [id]);
  if (!check.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (check.rows[0].uploader_id !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Clean up relations then delete song
  await query('DELETE FROM song_interactions WHERE song_id = $1', [id]);
  await query('DELETE FROM playlist_songs WHERE song_id = $1', [id]);
  await query('DELETE FROM messages WHERE id IN (SELECT id FROM messages LIMIT 0)', []); // no-op placeholder
  await query('DELETE FROM songs WHERE id = $1', [id]);
  revalidatePath('/');
  return NextResponse.json({ success: true });
}
