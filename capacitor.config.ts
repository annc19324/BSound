import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bsound.app',
  appName: 'BSound',
  webDir: 'public',
  // Để build APK thật trỏ tới website của bạn, hãy uncomment cấu hình `server` bên dưới:
  // server: {
  //   url: 'https://đường-dẫn-deploy-của-bạn.vercel.app', // Thay bằng URL production (hoặc dùng 'http://10.0.2.2:3000' nếu chạy máy ảo Android giả lập localhost)
  //   cleartext: true
  // }
};

export default config;
