import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BSound',
    short_name: 'BSound',
    description: 'Nền tảng nghe nhạc trực tuyến',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#f3ba2f',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon.png', // Tạm thời dùng đường dẫn này, bạn cần có file icon thật trong thư mục public
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
