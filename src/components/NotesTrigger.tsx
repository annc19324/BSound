'use client';

import { StickyNote } from 'lucide-react';

export default function NotesTrigger() {
  return (
    <button 
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        document.dispatchEvent(new Event('open-notes'));
      }}
      title="Ghi chú"
      style={{
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid var(--glass-border)',
        color: 'var(--primary)',
        padding: '8px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
    >
      <StickyNote size={18} />
    </button>
  );
}
