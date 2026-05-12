import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json([]);
    
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const result = await query(`
      SELECT s.* 
      FROM songs s 
      JOIN song_interactions si ON s.id = si.song_id 
      WHERE si.user_id = $1 AND si.type = 'LIKE'
      ORDER BY s.created_at DESC
    `, [decoded.id]);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
