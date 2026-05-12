'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError('Email không hợp lệ.');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải từ 6 ký tự.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        window.location.href = '/';
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '400px', margin: '100px auto' }}>
      <h1 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: '900' }}>Đăng nhập</h1>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '40px' }}>
        <input 
          type="email" 
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '12px' }}
          required
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input 
            type="password" 
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '12px' }}
            required
          />
          <div style={{ textAlign: 'right' }}>
            <Link href="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quên mật khẩu?</Link>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '16px', background: 'var(--primary)', color: 'black', fontWeight: '900', borderRadius: '40px', fontSize: '1rem', textTransform: 'uppercase' }}
        >
          {loading ? 'Đang xử lý...' : 'Tiếp tục'}
        </button>

        {error && <p style={{ color: '#ff4444', textAlign: 'center', fontSize: '0.9rem' }}>{error}</p>}
        
        <p style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '12px' }}>
          Chưa có tài khoản? <Link href="/register" style={{ color: 'var(--primary)', fontWeight: '700' }}>Đăng ký ngay</Link>
        </p>
      </form>
    </div>
  );
}
