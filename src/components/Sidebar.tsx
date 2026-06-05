'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Home, Search, Library, PlusSquare, Heart, Music,
  LogOut, LogIn, UserPlus, X, CheckCircle, MessageSquare,
  Menu, User, LayoutDashboard, Bell, Download
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export default function Sidebar() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [user, setUser] = useState<any>(undefined);
  const [isOpen, setIsOpen] = useState(false);
  const [notif, setNotif] = useState({ pending: 0, messages: 0, userId: null as number | null });
  const router = useRouter();
  const pathname = usePathname();

  // Draggable FAB state - Default position at TOP
  const [fabPos, setFabPos] = useState({ x: 20, y: 80 });
  const [mounted, setMounted] = useState(false);
  const dragging = useRef(false);
  const startTouch = useRef({ x: 0, y: 0, fabX: 0, fabY: 0 });
  const fabRef = useRef<HTMLButtonElement>(null);
  const didDrag = useRef(false);

  // Load persisted FAB position on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('bsound_fab_pos');
    if (saved) {
      try {
        const pos = JSON.parse(saved);
        if (typeof pos.x === 'number' && typeof pos.y === 'number') setFabPos(pos);
      } catch (e) {}
    }
  }, []);

  // Save position whenever it changes
  useEffect(() => {
    if (fabPos.y !== -1) {
      localStorage.setItem('bsound_fab_pos', JSON.stringify(fabPos));
    }
  }, [fabPos]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
        const data = await res.json();
        if (res.ok && !data.error) setUser(data);
        else setUser(null);
      } catch { setUser(null); }
    };

    const fetchPlaylists = async () => {
      try {
        const res = await fetch('/api/playlists', { cache: 'no-store' });
        if (res.ok) setPlaylists(await res.json());
      } catch {}
    };

    const fetchNotif = async () => {
      try {
        const res = await fetch('/api/notifications', { cache: 'no-store' });
        if (res.ok) setNotif(await res.json());
      } catch {}
    };

    checkAuth();
    fetchPlaylists();
    fetchNotif();

    // Refresh notifications every 30s
    const interval = setInterval(fetchNotif, 30000);
    return () => clearInterval(interval);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    didDrag.current = false;
    const rect = fabRef.current!.getBoundingClientRect();
    startTouch.current = { x: e.clientX, y: e.clientY, fabX: rect.left, fabY: rect.top };
    fabRef.current!.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startTouch.current.x;
    const dy = e.clientY - startTouch.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag.current = true;
    const newX = Math.max(0, Math.min(window.innerWidth - 56, startTouch.current.fabX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 56, startTouch.current.fabY + dy));
    setFabPos({ x: newX, y: newY });
  };
  const onPointerUp = () => {
    dragging.current = false;
    if (!didDrag.current) setIsOpen(true);
  };

  const close = () => setIsOpen(false);
  const isActive = (path: string) => pathname === path ? 'active' : '';

  return (
    <>
      {/* Draggable circular FAB */}
      {mounted && !isOpen && (
        <button
          ref={fabRef}
          className="fab-menu"
          style={{ left: fabPos.x, top: fabPos.y, bottom: 'auto' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          aria-label="Mở menu"
        >
          <Menu size={22} />
          {/* Notification dot on FAB */}
          {(notif.pending > 0) && (
            <span className="fab-notif-dot">{notif.pending}</span>
          )}
        </button>
      )}

      {isOpen && <div className="sidebar-backdrop" onClick={close} />}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>

        {/* ── Logo ── */}
        <div className="sb-logo-row">
          <Link href="/" onClick={close} className="sb-logo-link">
            <img src="/bsound.png" alt="BSound" className="sb-logo-img" />
            <span className="sb-logo-text">BSound</span>
          </Link>
          <button className="mobile-close" onClick={close}><X size={22} /></button>
        </div>

        {/* ── Social links ── */}
        <div className="sb-social-row">
          <a href="https://web.facebook.com/annc19324/" target="_blank" rel="noopener noreferrer" className="sb-social-btn sb-social-fb" title="Facebook">
            {/* Facebook SVG icon */}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
          <a href="https://www.youtube.com/@annc19324" target="_blank" rel="noopener noreferrer" className="sb-social-btn sb-social-yt" title="YouTube">
            {/* YouTube SVG icon */}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
          <a href="https://www.tiktok.com/@annc19324" target="_blank" rel="noopener noreferrer" className="sb-social-btn sb-social-tt" title="TikTok">
            {/* TikTok SVG icon */}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
          </a>
        </div>

        {/* ── Auth / Profile ── */}
        <div className="sb-section">
          {user === undefined && (
            <div className="sb-skeleton">
              <div className="sk-avatar" /><div className="sk-text" />
            </div>
          )}
          {user === null && (
            <div className="sb-auth-box glass">
              <Link href="/login" className="sb-auth-btn sb-login" onClick={close}>
                <LogIn size={15} /> Đăng nhập
              </Link>
              <Link href="/register" className="sb-auth-btn sb-register" onClick={close}>
                <UserPlus size={15} /> Đăng ký
              </Link>
            </div>
          )}
          {user && (
            <Link href="/profile" className="sb-profile glass" onClick={close}>
              <div className="sb-avatar">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
              <span className="sb-username">{user.name}</span>
            </Link>
          )}
        </div>

        {/* ── Chat ── */}
        <div className="sb-section">
          <Link href="/chat" className="sb-chat-link" onClick={close}>
            <MessageSquare size={16} />
            <span>Kênh Chat Tổng</span>
            {notif.messages > 0 && <span className="sb-badge sb-badge-error">{notif.messages > 99 ? '99+' : notif.messages}</span>}
          </Link>
        </div>

        {/* ── Main Nav ── */}
        <nav className="sb-section sb-nav">
          <Link href="/"       className={`sb-item ${isActive('/')}`}       onClick={close}><Home size={18} /> Trang chủ</Link>
          <Link href="/search" className={`sb-item ${isActive('/search')}`} onClick={close}><Search size={18} /> Tìm kiếm</Link>
          <Link href="/library" className={`sb-item ${isActive('/library')}`} onClick={close}><Library size={18} /> Thư viện</Link>
          <Link href="/download" className={`sb-item ${isActive('/download')}`} onClick={close}><Download size={18} /> Tải toàn bộ bài hát</Link>
        </nav>

        {/* ── Ủng hộ ── */}
        <div className="sb-section" style={{ padding: '4px 2px' }}>
          <Link href="/donate" className="sb-chat-link" onClick={close} style={{ color: '#ff4444', borderColor: 'rgba(255, 68, 68, 0.2)', background: 'rgba(255, 68, 68, 0.08)' }}>
            <Heart size={16} fill="currentColor" />
            <span>Ủng hộ BSound</span>
          </Link>
        </div>

        {/* ── Personal ── */}
        <div className="sb-section">
          <div className="sb-label">Cá nhân</div>
          <Link href="/upload" className={`sb-item ${isActive('/upload')}`} onClick={close}>
            <PlusSquare size={18} /> Đăng nhạc
            {notif.pending > 0 && <span className="sb-badge sb-badge-warning">{notif.pending}</span>}
          </Link>
          <Link href="/liked" className={`sb-item ${isActive('/liked')}`} onClick={close}>
            <Heart size={18} /> Đã thích
          </Link>
          {/* Thông tin cá nhân */}
          {user && (
            <Link href="/profile" className={`sb-item ${isActive('/profile')}`} onClick={close}>
              <User size={18} /> Thông tin cá nhân
            </Link>
          )}
          {/* Trang cá nhân công khai */}
          {user && notif.userId && (
            <Link href={`/user/${notif.userId}`} className={`sb-item ${pathname.startsWith('/user/') ? 'active' : ''}`} onClick={close}>
              <LayoutDashboard size={18} /> Trang của tôi
            </Link>
          )}
          {user?.role?.trim().toUpperCase() === 'ADMIN' && (
            <Link href="/admin" className={`sb-item sb-admin ${isActive('/admin')}`} onClick={close}>
              <CheckCircle size={18} /> Quản lý
              {notif.pending > 0 && <span className="sb-badge sb-badge-warning">{notif.pending}</span>}
            </Link>
          )}
        </div>

        {/* ── Playlists ── */}
        {playlists.length > 0 && (
          <div className="sb-section" style={{ flex: 1, overflowY: 'auto' }}>
            <div className="sb-label">Playlist của bạn</div>
            {playlists.map(p => (
              <Link key={p.id} href={`/playlist/${p.id}`} className="sb-item" style={{ fontSize: '0.82rem' }} onClick={close}>
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
