import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
  const messages = await query(`
    SELECT m.*, u.name as user_name 
    FROM messages m 
    JOIN users u ON m.user_id = u.id 
    ORDER BY m.created_at DESC 
    LIMIT 50
  `);
  return NextResponse.json(messages.rows.reverse());
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const { content } = await request.json();
    
    if (!content.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

    const result = await query(
      'INSERT INTO messages (user_id, content) VALUES ($1, $2) RETURNING id',
      [decoded.id, content]
    );

    return NextResponse.json({ success: true, id: result.rows[0].id });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
