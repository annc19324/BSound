import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Returns badge counts for the sidebar
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ pending: 0, messages: 0 });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // Latest message count (new messages since user's last-seen, use total for now)
    const msgRes = await query('SELECT COUNT(*) FROM messages');
    const messages = parseInt(msgRes.rows[0].count);

    let pending = 0;
    if (decoded.role === 'ADMIN') {
      // Admin sees all pending songs
      const pRes = await query("SELECT COUNT(*) FROM songs WHERE status = 'PENDING'");
      pending = parseInt(pRes.rows[0].count);
    } else {
      // Regular user sees their own pending songs
      const pRes = await query(
        "SELECT COUNT(*) FROM songs WHERE status = 'PENDING' AND uploader_id = $1",
        [decoded.id]
      );
      pending = parseInt(pRes.rows[0].count);
    }

    return NextResponse.json({ pending, messages, userId: decoded.id });
  } catch {
    return NextResponse.json({ pending: 0, messages: 0 });
  }
}
