import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      'SELECT * FROM songs WHERE status = $1 ORDER BY created_at DESC',
      ['APPROVED']
    );
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Fetch songs error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
