import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendApprovalNotification = async (songTitle: string, artist: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // Admin email
    subject: '🎵 Yêu cầu duyệt nhạc mới: ' + songTitle,
    text: `Có bài hát mới đang chờ duyệt:\nTên: ${songTitle}\nNghệ sĩ: ${artist}\n\nVui lòng vào admin dashboard để xử lý.`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email send error:', error);
  }
};
