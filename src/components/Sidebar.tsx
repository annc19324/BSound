'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Search, Library, PlusSquare, Heart, Music, LogOut, LogIn, UserPlus, Menu, X, User, CheckCircle, MessageSquare } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export default function Sidebar() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [user, setUser] = useState<any>(undefined); // undefined means loading
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { 
          cache: 'no-store',
          credentials: 'include' 
        });
        const data = await res.json();
        console.log('Auth response in Sidebar:', res.status, data);
        if (res.ok && !data.error) {
          setUser(data);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth fetch error in Sidebar:', err);
        setUser(null);
      }
    };

    const fetchPlaylists = async () => {
      try {
        const res = await fetch('/api/playlists', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setPlaylists(data);
        }
      } catch (err) {}
    };

    checkAuth();
    fetchPlaylists();
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      <button className="mobile-toggle" onClick={() => setIsOpen(true)}>
        <Menu size={24} />
      </button>

      {isOpen && <div className="sidebar-backdrop" onClick={() => setIsOpen(false)} />}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>

        {/* ── Logo ── */}
        <div className="sb-logo-row">
          <Link href="/" onClick={() => setIsOpen(false)} className="sb-logo-link">
            <img src="/BSound.png" alt="BSound" className="sb-logo-img" />
            <span className="sb-logo-text">BSound</span>
          </Link>
          <button className="mobile-close" onClick={() => setIsOpen(false)}><X size={22} /></button>
        </div>

        {/* ── Auth / Profile ── */}
        <div className="sb-section">
          {user === undefined && (
            <div className="sb-skeleton">
              <div className="sk-avatar" />
              <div className="sk-text" />
            </div>
          )}
          {user === null && (
            <div className="sb-auth-box glass">
              <Link href="/login" className="sb-auth-btn sb-login" onClick={() => setIsOpen(false)}>
                <LogIn size={15} /> Đăng nhập
              </Link>
              <Link href="/register" className="sb-auth-btn sb-register" onClick={() => setIsOpen(false)}>
                <UserPlus size={15} /> Đăng ký
              </Link>
            </div>
          )}
          {user && (
            <Link href="/profile" className="sb-profile glass" onClick={() => setIsOpen(false)}>
              <div className="sb-avatar">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
              <span className="sb-username">{user.name}</span>
            </Link>
          )}
        </div>

        {/* ── Chat highlight ── */}
        <div className="sb-section">
          <Link href="/chat" className="sb-chat-link" onClick={() => setIsOpen(false)}>
            <MessageSquare size={16} />
            <span>Kênh Chat Tổng</span>
          </Link>
        </div>

        {/* ── Main Nav ── */}
        <nav className="sb-section sb-nav">
          <Link href="/"       className={`sb-item ${pathname === '/' ? 'active' : ''}`} onClick={() => setIsOpen(false)}><Home size={18} /> Trang chủ</Link>
          <Link href="/search" className={`sb-item ${pathname === '/search' ? 'active' : ''}`} onClick={() => setIsOpen(false)}><Search size={18} /> Tìm kiếm</Link>
          <Link href="/library" className={`sb-item ${pathname === '/library' ? 'active' : ''}`} onClick={() => setIsOpen(false)}><Library size={18} /> Thư viện</Link>
        </nav>

        {/* ── Personal ── */}
        <div className="sb-section">
          <div className="sb-label">Cá nhân</div>
          <Link href="/upload" className={`sb-item ${pathname === '/upload' ? 'active' : ''}`} onClick={() => setIsOpen(false)}><PlusSquare size={18} /> Đăng nhạc</Link>
          <Link href="/liked"  className={`sb-item ${pathname === '/liked'  ? 'active' : ''}`} onClick={() => setIsOpen(false)}><Heart size={18} /> Đã thích</Link>
          {user?.role?.trim().toUpperCase() === 'ADMIN' && (
            <Link href="/admin" className={`sb-item sb-admin ${pathname === '/admin' ? 'active' : ''}`} onClick={() => setIsOpen(false)}><CheckCircle size={18} /> Quản lý</Link>
          )}
        </div>

        {/* ── Playlists ── */}
        {playlists.length > 0 && (
          <div className="sb-section" style={{ flex: 1, overflowY: 'auto' }}>
            <div className="sb-label">Playlist của bạn</div>
            {playlists.map(p => (
              <Link key={p.id} href={`/playlist/${p.id}`} className="sb-item" style={{ fontSize: '0.82rem' }} onClick={() => setIsOpen(false)}>
                <Music size={15} /> {p.name}
              </Link>
            ))}
          </div>
        )}

        {/* ── Logout ── */}
        {user && (
          <div className="sb-section">
            <button onClick={handleLogout} className="sb-item sb-logout">
              <LogOut size={18} /> Đăng xuất
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
