import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const result = await query(`
      SELECT s.* 
      FROM songs s 
      JOIN playlist_songs ps ON s.id = ps.song_id 
      WHERE ps.playlist_id = $1
    `, [id]);
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: playlist_id } = await params;
    const { song_id } = await request.json();
    
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await query(
      'INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [playlist_id, song_id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
