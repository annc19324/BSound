'use client';

import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setNewName(data.name);
        setLoading(false);
      });
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Đang cập nhật...');
    const formData = new FormData();
    formData.append('name', newName);

    const res = await fetch('/api/auth/me', { method: 'PATCH', body: formData });
    if (res.ok) {
      setMessage('Cập nhật thành công!');
      const updated = await res.json();
      setUser(updated);
    } else setMessage('Đã có lỗi xảy ra.');
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div className="fade-in prof-page">
      {/* Hero avatar + name */}
      <div className="prof-hero">
        <div className="prof-avatar-big">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="prof-hero-info">
          <h1 className="prof-name">{user?.name}</h1>
          <span className="prof-email">{user?.email}</span>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleUpdate} className="prof-card glass">
        <div className="prof-field">
          <label>Họ và tên</label>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
            placeholder="Nhập tên hiển thị..."
          />
        </div>
        <div className="prof-field">
          <label>Email</label>
          <input type="email" value={user?.email} disabled className="prof-disabled" />
        </div>
        <button type="submit" className="prof-save-btn">
          <Save size={17} />
          Lưu thay đổi
        </button>
        {message && (
          <p className={`prof-msg ${message.includes('Lỗi') ? 'err' : 'ok'}`}>{message}</p>
        )}
      </form>
    </div>
  );
}
