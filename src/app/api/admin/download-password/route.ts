import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    if (String(payload.role).toUpperCase() !== 'ADMIN') return null;
    return payload;
  } catch {
    return null;
  }
}

// Ensure the settings table exists (idempotent)
async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureTable();
  const res = await query(`SELECT value FROM app_settings WHERE key = 'download_password'`);
  const password = res.rows[0]?.value ?? null;
  return NextResponse.json({ password });
}

export async function POST(request: Request) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureTable();
  const { password } = await request.json();
  if (!password || typeof password !== 'string' || !password.trim()) {
    return NextResponse.json({ error: 'Mật khẩu không hợp lệ' }, { status: 400 });
  }

  await query(`
    INSERT INTO app_settings (key, value)
    VALUES ('download_password', $1)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `, [password.trim()]);

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureTable();
  await query(`DELETE FROM app_settings WHERE key = 'download_password'`);
  return NextResponse.json({ success: true });
}
