import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function GET() {
  const result = await query('SELECT * FROM ads ORDER BY created_at DESC');
  return NextResponse.json(result.rows);
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    if (String(payload.role).toUpperCase() !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { content, image_url } = await request.json();
    
    // Deactivate old ads
    await query('UPDATE ads SET active = FALSE');
    
    const result = await query(
      'INSERT INTO ads (content, image_url) VALUES ($1, $2) RETURNING *',
      [content, image_url]
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE() {
    await query('UPDATE ads SET active = FALSE');
    return NextResponse.json({ success: true });
}
