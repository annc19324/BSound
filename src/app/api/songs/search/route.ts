import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) return NextResponse.json([]);

  try {
    const result = await query(
      "SELECT * FROM songs WHERE status = 'APPROVED' AND (title ILIKE $1 OR artist ILIKE $1)",
      [`%${q}%`]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
