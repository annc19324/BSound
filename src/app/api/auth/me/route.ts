import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    console.log('Auth check: No token found in cookies');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    
    console.log('Auth check: Token verified for user ID:', payload.id);
    
    // Get user with stats
    const user = await query(`
      SELECT u.id, u.name, u.email, u.role, u.image_url, u.created_at,
      (SELECT COUNT(*) FROM songs WHERE uploader_id = u.id) as songs_count,
      (SELECT COUNT(*) FROM song_interactions WHERE user_id = u.id AND type = 'LIKE') as likes_count
      FROM users u 
      WHERE u.id = $1
    `, [payload.id]);

    if (user.rows.length === 0) {
      console.log('Auth check: User not found in database for ID:', payload.id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user.rows[0]);
  } catch (error: any) {
    console.error('Auth check: Token verification failed:', error.message);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload: decoded } = await jwtVerify(token, secret);
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const image = formData.get('image') as File | null;

    let imageUrl = null;
    if (image) {
      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const uploadResponse: any = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'bsound_avatars' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });
      imageUrl = uploadResponse.secure_url;
    }

    if (imageUrl) {
      await query('UPDATE users SET name = $1, image_url = $2 WHERE id = $3', [name, imageUrl, decoded.id]);
    } else {
      await query('UPDATE users SET name = $1 WHERE id = $2', [name, decoded.id]);
    }

    const updatedUser = await query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    return NextResponse.json(updatedUser.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 400 });
  }
}
