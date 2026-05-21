'use client';

import React from 'react';
import { Heart } from 'lucide-react';

export default function DonatePage() {
  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ff4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <Heart size={40} fill="currentColor" />
          Ủng hộ BSound
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '8px' }}>
          Nếu bạn yêu thích BSound, hãy ủng hộ để giúp duy trì máy chủ nhé!
        </p>
      </div>
      
      <div className="glass" style={{ padding: '32px', borderRadius: '24px', display: 'inline-block' }}>
        <img 
          src="/qr.jpg" 
          alt="Mã QR Ủng hộ" 
          style={{ 
            width: '100%', 
            maxWidth: '350px', 
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(255, 68, 68, 0.2)',
            border: '2px solid rgba(255, 68, 68, 0.3)'
          }} 
        />
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginTop: '24px' }}>Quét mã QR</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>Cảm ơn bạn rất nhiều! ❤️</p>
      </div>
    </div>
  );
}
