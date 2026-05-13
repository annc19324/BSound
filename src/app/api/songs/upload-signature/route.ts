import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET!);

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'bsound';

    const timestamp = Math.round(Date.now() / 1000);

    // Cloudinary signature: SHA-1 of sorted "key=val&..." string + API secret
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + process.env.CLOUDINARY_API_SECRET!)
      .digest('hex');

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
