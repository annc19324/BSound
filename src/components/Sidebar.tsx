'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Home, Search, Library, PlusSquare, Heart, Music,
  LogOut, LogIn, UserPlus, X, CheckCircle, MessageSquare,
  Menu, User, LayoutDashboard, Bell
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export default function Sidebar() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [user, setUser] = useState<any>(undefined);
  const [isOpen, setIsOpen] = useState(false);
  const [notif, setNotif] = useState({ pending: 0, messages: 0, userId: null as number | null });
  const router = useRouter();
  const pathname = usePathname();

  // Draggable FAB state
  const [fabPos, setFabPos] = useState({ x: 16, y: -1 });
  const dragging = useRef(false);
  const startTouch = useRef({ x: 0, y: 0, fabX: 0, fabY: 0 });
  const fabRef = useRef<HTMLButtonElement>(null);
  const didDrag = useRef(false);

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
      {!isOpen && (
        <button
          ref={fabRef}
          className="fab-menu"
          style={fabPos.y >= 0 ? { left: fabPos.x, bottom: 'auto', top: fabPos.y } : {}}
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
            {notif.messages > 0 && <span className="sb-badge">{notif.messages > 99 ? '99+' : notif.messages}</span>}
          </Link>
        </div>

        {/* ── Main Nav ── */}
        <nav className="sb-section sb-nav">
          <Link href="/"       className={`sb-item ${isActive('/')}`}       onClick={close}><Home size={18} /> Trang chủ</Link>
          <Link href="/search" className={`sb-item ${isActive('/search')}`} onClick={close}><Search size={18} /> Tìm kiếm</Link>
          <Link href="/library" className={`sb-item ${isActive('/library')}`} onClick={close}><Library size={18} /> Thư viện</Link>
        </nav>

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
