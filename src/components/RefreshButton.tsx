'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RefreshButton() {
  const router = useRouter();
  return (
    <button 
      onClick={() => router.refresh()} 
      style={{ 
        padding: '6px', 
        display: 'flex', 
        alignItems: 'center', 
        color: 'var(--text-muted)',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '50%',
        transition: '0.2s'
      }}
      title="Tải lại trang"
    >
      <RefreshCw size={18} />
    </button>
  );
}
