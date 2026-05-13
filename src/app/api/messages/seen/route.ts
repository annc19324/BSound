import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Add the column if it doesn't exist (one-time setup)
const ensureColumn = async () => {
  try {
    await query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_seen_chat') THEN
          ALTER TABLE users ADD COLUMN last_seen_chat TIMESTAMP DEFAULT '1970-01-01 00:00:00';
        END IF;
      END $$;
    `);
  } catch (e) {
    console.error('Migration error:', e);
  }
};

export async function POST() {
  await ensureColumn();
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    await query(
      'UPDATE users SET last_seen_chat = NOW() WHERE id = $1',
      [decoded.id]
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
