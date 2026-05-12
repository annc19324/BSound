import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (decoded.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const result = await query(`
      SELECT s.*, u.name as uploader_name 
      FROM songs s 
      JOIN users u ON s.uploader_id = u.id 
      WHERE s.status = 'PENDING' 
      ORDER BY s.created_at ASC
    `);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
