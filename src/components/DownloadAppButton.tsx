'use client';

import { useEffect, useState } from 'react';

export default function DownloadAppButton() {
  const [isApp, setIsApp] = useState(true); // Mặc định ẩn để tránh nháy màn hình (Hydration mismatch)

  useEffect(() => {
    // Kiểm tra xem có đang chạy trong app Capacitor hoặc Android WebView không
    const ua = navigator.userAgent.toLowerCase();
    const isCapacitor = typeof window !== 'undefined' && (
      (window as any).Capacitor?.isNative || 
      ua.includes('capacitor') || 
      ua.includes('wv') || // Dấu hiệu đặc trưng nhất của Android WebView
      (ua.includes('android') && ua.includes('version/')) // WebView mặc định trên một số bản Android
    );
    setIsApp(!!isCapacitor);
  }, []);

  if (isApp) return null;

  return (
    <a 
      href="/bsound.apk" 
      download="BSound.apk"
      style={{ 
        padding: '6px 14px', 
        background: 'var(--primary)', 
        color: 'black', 
        borderRadius: '20px', 
        fontSize: '0.8rem', 
        fontWeight: '800', 
        textDecoration: 'none', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px',
        transition: '0.2s',
        boxShadow: '0 4px 10px rgba(243, 186, 47, 0.2)'
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      Tải app cho Android
    </a>
  );
}
