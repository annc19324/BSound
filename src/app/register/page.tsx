'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.length < 2) {
      toast.error('Tên quá ngắn.');
      return;
    }
    if (!email.includes('@')) {
      toast.error('Email không hợp lệ.');
      return;
    }
    if (password.length < 6) {
      toast.error('Mật khẩu phải từ 6 ký tự.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        toast.success('Đăng ký thành công!');
        router.push('/login');
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '400px', margin: '100px auto' }}>
      <h1 style={{ textAlign: 'center' }}>Đăng ký</h1>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '40px' }}>
        <input 
          type="text" 
          placeholder="Họ và tên"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px' }}
          required
        />
        <input 
          type="email" 
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px' }}
          required
        />
        <input 
          type="password" 
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px' }}
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '16px', background: 'var(--primary)', color: 'black', fontWeight: '700', borderRadius: '30px' }}
        >
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          Đã có tài khoản? <a href="/login" style={{ color: 'var(--primary)' }}>Đăng nhập</a>
        </p>
      </form>
    </div>
  );
}
