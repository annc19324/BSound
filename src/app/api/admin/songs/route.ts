import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import cloudinary from '@/lib/cloudinary';

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

  const songs = await query(`
    SELECT s.*, u.name as uploader_name 
    FROM songs s 
    LEFT JOIN users u ON s.uploader_id = u.id 
    ORDER BY s.created_at DESC
  `);
  return NextResponse.json(songs.rows);
}

export async function PATCH(request: Request) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const id = formData.get('id');
  const status = formData.get('status');
  const title = formData.get('title');
  const artist = formData.get('artist');
  const lyrics = formData.get('lyrics');
  const image = formData.get('image') as File | null;

  if (status) {
    await query('UPDATE songs SET status = $1, approver_id = $2 WHERE id = $3', [status, admin.id, id]);
  } else {
    let imageUrl = null;
    if (image) {
      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const uploadResponse: any = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'bsound_songs' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });
      imageUrl = uploadResponse.secure_url;
    }

    if (imageUrl) {
      await query('UPDATE songs SET title = $1, artist = $2, lyrics = $3, image_url = $4 WHERE id = $5', [title, artist, lyrics, imageUrl, id]);
    } else {
      await query('UPDATE songs SET title = $1, artist = $2, lyrics = $3 WHERE id = $4', [title, artist, lyrics, id]);
    }
  }
  
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  await query('DELETE FROM songs WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
