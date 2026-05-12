import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const { type } = await request.json(); // 'LIKE' or 'DISLIKE'
    
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // Upsert interaction
    await query(`
      INSERT INTO song_interactions (user_id, song_id, type)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, song_id)
      DO UPDATE SET type = $3
    `, [decoded.id, id, type]);

    // Update counts (simple way)
    const likes = await query('SELECT COUNT(*) FROM song_interactions WHERE song_id = $1 AND type = $2', [id, 'LIKE']);
    const dislikes = await query('SELECT COUNT(*) FROM song_interactions WHERE song_id = $1 AND type = $2', [id, 'DISLIKE']);

    await query('UPDATE songs SET likes = $1, dislikes = $2 WHERE id = $3', [likes.rows[0].count, dislikes.rows[0].count, id]);

    return NextResponse.json({ likes: likes.rows[0].count, dislikes: dislikes.rows[0].count });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
