import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bsound.app',
  appName: 'BSound',
  webDir: 'public',
  server: {
    url: 'https://bsound.vercel.app',
    cleartext: true
  }
};

export default config;
