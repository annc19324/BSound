import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json([], { status: 401 });
    
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const result = await query('SELECT * FROM playlists WHERE user_id = $1 ORDER BY created_at DESC', [decoded.id]);
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const result = await query(
      'INSERT INTO playlists (name, user_id) VALUES ($1, $2) RETURNING *',
      [name, decoded.id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
