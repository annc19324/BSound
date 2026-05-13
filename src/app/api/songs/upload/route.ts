import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { sendApprovalNotification } from '@/lib/mail';

// This endpoint now only receives metadata + Cloudinary URLs (no file buffers)
// Files are uploaded directly from the client to Cloudinary using a signed signature
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const body = await request.json();

    const { title, artist, lyrics, fileUrl, imageUrl } = body;

    if (!fileUrl || !title || !artist) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const status = decoded.role === 'ADMIN' ? 'APPROVED' : 'PENDING';
    const approver_id = decoded.role === 'ADMIN' ? decoded.id : null;

    const result = await query(
      'INSERT INTO songs (title, artist, file_url, image_url, lyrics, status, uploader_id, approver_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [title, artist, fileUrl, imageUrl || null, lyrics || null, status, decoded.id, approver_id]
    );

    if (status === 'PENDING') {
      await sendApprovalNotification(title, artist);
    }

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
