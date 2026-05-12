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

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
  return NextResponse.json(users.rows);
}

export async function PATCH(request: Request) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, role } = await request.json();
  await query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  await query('DELETE FROM users WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
