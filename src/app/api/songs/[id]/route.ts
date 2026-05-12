import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await query(`
      SELECT 
        s.*, 
        u1.name as uploader_name, 
        u2.name as approver_name 
      FROM songs s 
      LEFT JOIN users u1 ON s.uploader_id = u1.id 
      LEFT JOIN users u2 ON s.approver_id = u2.id 
      WHERE s.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    // Increment views
    await query('UPDATE songs SET views = views + 1 WHERE id = $1', [id]);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
