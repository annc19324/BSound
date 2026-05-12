import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn.' });
    }

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await query('UPDATE users SET reset_token = $1, reset_expires = $2 WHERE id = $3', [token, expires, user.id]);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'BSound - Khôi phục mật khẩu',
      text: `Bạn nhận được email này vì yêu cầu khôi phục mật khẩu.\n\nBấm vào link sau để đặt lại mật khẩu:\n${resetUrl}\n\nLink có hiệu lực trong 1 giờ.`,
    });

    return NextResponse.json({ message: 'Email khôi phục đã được gửi.' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
