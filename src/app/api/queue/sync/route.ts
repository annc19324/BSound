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

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await query('SELECT queue, next_up_queue, current_index FROM user_player_state WHERE user_id = $1', [user.id]);
  if (result.rows.length === 0) {
    return NextResponse.json({ queue: [], nextUpQueue: [], currentIndex: -1 });
  }

  return NextResponse.json({
    queue: result.rows[0].queue || [],
    nextUpQueue: result.rows[0].next_up_queue || [],
    currentIndex: result.rows[0].current_index
  });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { queue, nextUpQueue, currentIndex } = await req.json();

  // Upsert
  const check = await query('SELECT user_id FROM user_player_state WHERE user_id = $1', [user.id]);
  if (check.rows.length === 0) {
    await query(
      'INSERT INTO user_player_state (user_id, queue, next_up_queue, current_index) VALUES ($1, $2, $3, $4)',
      [user.id, JSON.stringify(queue), JSON.stringify(nextUpQueue), currentIndex]
    );
  } else {
    await query(
      'UPDATE user_player_state SET queue = $1, next_up_queue = $2, current_index = $3, updated_at = CURRENT_TIMESTAMP WHERE user_id = $4',
      [JSON.stringify(queue), JSON.stringify(nextUpQueue), currentIndex, user.id]
    );
  }

  return NextResponse.json({ success: true });
}
