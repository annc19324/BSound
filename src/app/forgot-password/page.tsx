'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message || data.error);
    } catch (err) {
      setMessage('Lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '400px', margin: '100px auto', textAlign: 'center' }}>
      <h1>Quên mật khẩu?</h1>
      <p style={{ marginBottom: '32px' }}>Nhập email của bạn để nhận hướng dẫn khôi phục.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <input 
          type="email" 
          placeholder="Email của bạn" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required
          style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '12px' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '16px', background: 'var(--primary)', color: 'black', fontWeight: '800', borderRadius: '30px' }}
        >
          {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </button>
      </form>

      {message && <p style={{ marginTop: '24px', color: 'var(--primary)' }}>{message}</p>}
      
      <div style={{ marginTop: '32px' }}>
        <Link href="/login" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Quay lại Đăng nhập</Link>
      </div>
    </div>
  );
}
