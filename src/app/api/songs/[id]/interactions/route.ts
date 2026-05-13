import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// GET — get user's current interaction for this song
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ userInteraction: null });
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const res = await query(
      'SELECT type FROM song_interactions WHERE user_id = $1 AND song_id = $2',
      [decoded.id, id]
    );
    return NextResponse.json({ userInteraction: res.rows[0]?.type || null });
  } catch {
    return NextResponse.json({ userInteraction: null });
  }
}

// POST — like/dislike/view
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { type } = await request.json(); // 'LIKE' | 'DISLIKE' | 'VIEW'

    // VIEW — no auth required
    if (type === 'VIEW') {
      await query('UPDATE songs SET views = views + 1 WHERE id = $1', [id]);
      const r = await query('SELECT views FROM songs WHERE id = $1', [id]);
      return NextResponse.json({ views: r.rows[0]?.views });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // Check current interaction
    const existing = await query(
      'SELECT type FROM song_interactions WHERE user_id = $1 AND song_id = $2',
      [decoded.id, id]
    );

    if (existing.rows[0]?.type === type) {
      // Toggle off — remove interaction
      await query('DELETE FROM song_interactions WHERE user_id = $1 AND song_id = $2', [decoded.id, id]);
    } else {
      // Upsert
      await query(`
        INSERT INTO song_interactions (user_id, song_id, type)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, song_id) DO UPDATE SET type = $3
      `, [decoded.id, id, type]);
    }

    const likes = await query('SELECT COUNT(*) FROM song_interactions WHERE song_id = $1 AND type = $2', [id, 'LIKE']);
    const dislikes = await query('SELECT COUNT(*) FROM song_interactions WHERE song_id = $1 AND type = $2', [id, 'DISLIKE']);
    await query('UPDATE songs SET likes = $1, dislikes = $2 WHERE id = $3', [
      likes.rows[0].count, dislikes.rows[0].count, id
    ]);

    const newType = existing.rows[0]?.type === type ? null : type;
    return NextResponse.json({
      likes: parseInt(likes.rows[0].count),
      dislikes: parseInt(dislikes.rows[0].count),
      userInteraction: newType
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
