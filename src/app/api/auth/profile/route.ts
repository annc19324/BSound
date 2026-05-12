import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const result = await query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { name, password } = await request.json();
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await query('UPDATE users SET name = $1, password = $2 WHERE id = $3', [name, hashedPassword, decoded.id]);
    } else {
      await query('UPDATE users SET name = $1 WHERE id = $2', [name, decoded.id]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
