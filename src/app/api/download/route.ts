import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function getDownloadPassword(): Promise<string | null> {
  try {
    const res = await query(`SELECT value FROM app_settings WHERE key = 'download_password'`);
    return res.rows[0]?.value ?? null;
  } catch {
    return null;
  }
}

// GET: return all approved songs (for the song list UI, no auth needed)
export async function GET() {
  const songs = await query(`
    SELECT id, title, artist, file_url, image_url
    FROM songs
    WHERE status = 'APPROVED'
    ORDER BY created_at DESC
  `);
  return NextResponse.json(songs.rows);
}

// POST: validate password and return download URLs
export async function POST(request: Request) {
  const { password, songIds } = await request.json();

  const stored = await getDownloadPassword();
  if (!stored) {
    return NextResponse.json({ error: 'Tính năng tải nhạc chưa được kích hoạt. Liên hệ quản trị viên.' }, { status: 403 });
  }
  if (!password || password.trim() !== stored) {
    return NextResponse.json({ error: 'Mã BSound không đúng. Vui lòng liên hệ quản trị viên để lấy mã.' }, { status: 401 });
  }

  let songs;
  if (Array.isArray(songIds) && songIds.length > 0) {
    const placeholders = songIds.map((_: any, i: number) => `$${i + 1}`).join(', ');
    const res = await query(
      `SELECT id, title, artist, file_url FROM songs WHERE id IN (${placeholders}) AND status = 'APPROVED'`,
      songIds
    );
    songs = res.rows;
  } else {
    const res = await query(`SELECT id, title, artist, file_url FROM songs WHERE status = 'APPROVED' ORDER BY created_at DESC`);
    songs = res.rows;
  }

  return NextResponse.json({ songs });
}
