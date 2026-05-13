'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Music, Users, Megaphone, Check, X, Trash2, Edit2, Save, Camera } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'songs' | 'users' | 'ads'>('songs');
  const [songs, setSongs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [newAd, setNewAd] = useState({ content: '', image_url: '' });
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'songs') {
        const res = await fetch('/api/admin/songs');
        setSongs(await res.json());
      } else if (activeTab === 'users') {
        const res = await fetch('/api/admin/users');
        setUsers(await res.json());
      } else if (activeTab === 'ads') {
        const res = await fetch('/api/admin/ads');
        setAds(await res.json());
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = activeTab === 'songs' ? '/api/admin/songs' : '/api/admin/users';
    if (activeTab === 'songs') {
      const formData = new FormData();
      formData.append('id', editingItem.id);
      formData.append('title', editingItem.title);
      formData.append('artist', editingItem.artist);
      formData.append('lyrics', editingItem.lyrics);
      if (editImage) formData.append('image', editImage);
      await fetch(endpoint, { method: 'PATCH', body: formData });
    } else {
      await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });
    }
    setEditingItem(null); setEditImage(null); setEditImagePreview(null);
    fetchData();
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setEditImage(file); setEditImagePreview(URL.createObjectURL(file)); }
  };

  const updateSongStatus = async (id: number, status: string) => {
    const endpoint = status === 'APPROVED' ? `/api/admin/approve/${id}` : `/api/admin/reject/${id}`;
    await fetch(endpoint, { method: 'POST' });
    fetchData();
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Xác nhận xoá?')) return;
    const endpoint = activeTab === 'songs' ? `/api/admin/songs?id=${id}` : `/api/admin/users?id=${id}`;
    await fetch(endpoint, { method: 'DELETE' });
    fetchData();
  };

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAd),
    });
    setNewAd({ content: '', image_url: '' });
    fetchData();
  };

  const closeEdit = () => { setEditingItem(null); setEditImage(null); setEditImagePreview(null); };

  return (
    <div className="fade-in admin-container">
      <header className="admin-header">
        <h1>Quản Trị</h1>
        <div className="admin-tabs">
          <button className={activeTab === 'songs' ? 'active' : ''} onClick={() => setActiveTab('songs')}>
            <Music size={16} /><span>Bài hát</span>
            {songs.length > 0 && <span className="tab-count">{songs.length}</span>}
          </button>
          <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
            <Users size={16} /><span>Người dùng</span>
            {users.length > 0 && <span className="tab-count">{users.length}</span>}
          </button>
          <button className={activeTab === 'ads' ? 'active' : ''} onClick={() => setActiveTab('ads')}>
            <Megaphone size={16} /><span>Quảng cáo</span>
            {ads.length > 0 && <span className="tab-count">{ads.length}</span>}
          </button>
        </div>
      </header>

      <main className="admin-content">
        {loading ? (
          <div className="admin-skeleton">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="admin-skeleton-row">
                <div className="skel-box skel-img" />
                <div className="skel-box skel-text" />
                <div className="skel-box skel-text-sm" />
                <div className="skel-box skel-badge" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* ── Songs Tab ── */}
            {activeTab === 'songs' && (
              <div className="admin-cards">
                {songs.map(s => (
                  <div key={s.id} className="admin-card">
                    <img
                      src={s.image_url || '/bsound.png'}
                      className="admin-card-img"
                      alt={s.title}
                    />
                    <div className="admin-card-body">
                      <div className="admin-card-title">{s.title}</div>
                      <div className="admin-card-sub">{s.artist}</div>
                      <span className={`status-badge ${s.status.toLowerCase()}`}>{s.status}</span>
                    </div>
                    <div className="admin-card-actions">
                      {s.status === 'PENDING' && (
                        <button onClick={() => updateSongStatus(s.id, 'APPROVED')} className="btn-approve" title="Duyệt">
                          <Check size={15} />
                        </button>
                      )}
                      <button onClick={() => { setEditingItem(s); setEditImagePreview(s.image_url); }} className="btn-edit" title="Sửa">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => deleteItem(s.id)} className="btn-delete" title="Xoá">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Users Tab ── */}
            {activeTab === 'users' && (
              <div className="admin-cards">
                {users.map(u => (
                  <div key={u.id} className="admin-card">
                    <div className="admin-avatar">
                      {u.image_url
                        ? <img src={u.image_url} alt={u.name} />
                        : <span>{u.name?.charAt(0)?.toUpperCase()}</span>
                      }
                    </div>
                    <div className="admin-card-body">
                      <div className="admin-card-title">{u.name}</div>
                      <div className="admin-card-sub">{u.email}</div>
                      <span className={`status-badge ${u.role === 'ADMIN' ? 'approved' : 'pending'}`}>{u.role}</span>
                    </div>
                    <div className="admin-card-actions">
                      <button onClick={() => setEditingItem(u)} className="btn-edit" title="Sửa">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => deleteItem(u.id)} className="btn-delete" title="Xoá">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Ads Tab ── */}
            {activeTab === 'ads' && (
              <div className="ads-layout">
                <form onSubmit={handleAddAd} className="ad-form glass">
                  <h3>Tạo Quảng Cáo</h3>
                  <div className="form-group">
                    <label>Nội dung</label>
                    <input type="text" placeholder="Thông báo..." value={newAd.content}
                      onChange={e => setNewAd({ ...newAd, content: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Link ảnh (tuỳ chọn)</label>
                    <input type="text" placeholder="https://..." value={newAd.image_url}
                      onChange={e => setNewAd({ ...newAd, image_url: e.target.value })} />
                  </div>
                  <button type="submit" className="btn-primary">Kích hoạt ngay</button>
                </form>
                <div className="ads-list">
                  {ads.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Chưa có quảng cáo nào.</p>}
                  {ads.map(ad => (
                    <div key={ad.id} className="ad-card glass">
                      <p>{ad.content}</p>
                      <button onClick={() => fetch(`/api/admin/ads?id=${ad.id}`, { method: 'DELETE' }).then(fetchData)}
                        className="btn-delete"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Edit Modal ── */}
      {editingItem && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chỉnh sửa {activeTab === 'songs' ? 'bài hát' : 'người dùng'}</h2>
              <button onClick={closeEdit}><X /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="edit-form-grid">
              {activeTab === 'songs' ? (
                <>
                  <div className="edit-left">
                    <label className="artwork-preview">
                      <img src={editImagePreview || '/bsound.png'} alt="Preview" />
                      <div className="overlay-camera"><Camera size={24} /></div>
                      <input type="file" hidden accept="image/*" onChange={handleEditImageChange} />
                    </label>
                    <div className="form-group">
                      <label>Tên bài hát</label>
                      <input type="text" value={editingItem.title}
                        onChange={e => setEditingItem({...editingItem, title: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Nghệ sĩ</label>
                      <input type="text" value={editingItem.artist}
                        onChange={e => setEditingItem({...editingItem, artist: e.target.value})} />
                    </div>
                    <button type="submit" className="btn-save"><Save size={16} /> Lưu</button>
                  </div>
                  <div className="edit-right">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Lời bài hát</label>
                      <textarea value={editingItem.lyrics || ''}
                        onChange={e => setEditingItem({...editingItem, lyrics: e.target.value})}
                        style={{ height: '160px', resize: 'none' }} />
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label>Tên người dùng</label>
                    <input type="text" value={editingItem.name}
                      onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Quyền hạn</label>
                    <select value={editingItem.role}
                      onChange={e => setEditingItem({...editingItem, role: e.target.value})}>
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-save"><Save size={16} /> Cập nhật</button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
