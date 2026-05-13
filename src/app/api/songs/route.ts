import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT s.*, u.name AS uploader_name
      FROM songs s
      LEFT JOIN users u ON u.id = s.uploader_id
      WHERE s.status = 'APPROVED'
      ORDER BY s.created_at DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Fetch songs error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
