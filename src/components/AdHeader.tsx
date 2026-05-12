'use client';

import React, { useEffect, useState } from 'react';

export default function AdHeader() {
  const [ad, setAd] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/ads')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const activeAd = data.find(item => item.active);
          setAd(activeAd || null);
        } else {
          setAd(null);
        }
      })
      .catch(() => {});
  }, []);

  if (!ad || !ad.active) return null;

  return (
    <div className="ad-header" style={{
      width: '100%',
      padding: '12px 24px',
      background: 'linear-gradient(90deg, var(--primary), #ffcc00)',
      color: 'black',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      fontWeight: '700',
      fontSize: '0.9rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {ad.image_url && <img src={ad.image_url} alt="ad" style={{ height: '30px', borderRadius: '4px' }} />}
      <span>{ad.content}</span>
      
      <style jsx>{`
        .ad-header {
          animation: slideDown 0.5s ease-out;
        }
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
