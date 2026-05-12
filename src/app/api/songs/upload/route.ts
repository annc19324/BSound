import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { sendApprovalNotification } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const artist = formData.get('artist') as string;
    const lyrics = formData.get('lyrics') as string;
    const image = formData.get('image') as File | null;

    if (!file || !title || !artist) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Upload audio
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileUri = `data:${file.type};base64,${buffer.toString('base64')}`;
    const cloudinaryRes = await uploadToCloudinary(fileUri);
    
    let fileUrl = cloudinaryRes.secure_url;
    if (cloudinaryRes.resource_type === 'video') {
      fileUrl = fileUrl.replace(/\.[^/.]+$/, ".mp3");
    }

    // Upload image if provided
    let imageUrl = null;
    if (image) {
      const imgBytes = await image.arrayBuffer();
      const imgBuffer = Buffer.from(imgBytes);
      const imgUri = `data:${image.type};base64,${imgBuffer.toString('base64')}`;
      const imgRes = await uploadToCloudinary(imgUri, 'bsound_images');
      imageUrl = imgRes.secure_url;
    }

    const status = decoded.role === 'ADMIN' ? 'APPROVED' : 'PENDING';
    const approver_id = decoded.role === 'ADMIN' ? decoded.id : null;

    const result = await query(
      'INSERT INTO songs (title, artist, file_url, image_url, lyrics, status, uploader_id, approver_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [title, artist, fileUrl, imageUrl, lyrics, status, decoded.id, approver_id]
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
