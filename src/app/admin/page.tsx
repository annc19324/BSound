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

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'songs') {
        const res = await fetch('/api/admin/songs');
        const data = await res.json();
        setSongs(data);
      } else if (activeTab === 'users') {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        setUsers(data);
      } else if (activeTab === 'ads') {
        const res = await fetch('/api/admin/ads');
        const data = await res.json();
        setAds(data);
      }
    } catch (e) {
      console.error(e);
    }
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

    setEditingItem(null);
    setEditImage(null);
    setEditImagePreview(null);
    fetchData();
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImage(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const updateSongStatus = async (id: number, status: string) => {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('status', status);
    await fetch('/api/admin/songs', { method: 'PATCH', body: formData });
    fetchData();
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Xác nhận xóa?')) return;
    const endpoint = activeTab === 'songs' ? '/api/admin/songs' : '/api/admin/users';
    await fetch(`${endpoint}?id=${id}`, { method: 'DELETE' });
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

  return (
    <div>
      <div className="fade-in admin-container">
        <header className="admin-header">
        <h1>Quản Trị BSound</h1>
        <div className="admin-tabs">
          <button className={activeTab === 'songs' ? 'active' : ''} onClick={() => setActiveTab('songs')}><Music size={18} /> Bài hát</button>
          <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}><Users size={18} /> Người dùng</button>
          <button className={activeTab === 'ads' ? 'active' : ''} onClick={() => setActiveTab('ads')}><Megaphone size={18} /> Quảng cáo</button>
        </div>
      </header>

      <main className="admin-content">
        {activeTab === 'songs' && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Tiêu đề</th>
                  <th>Nghệ sĩ</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {songs.map(s => (
                  <tr key={s.id}>
                    <td><img src={s.image_url || '/default-song.png'} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} /></td>
                    <td>{s.title}</td>
                    <td>{s.artist}</td>
                    <td><span className={`status-badge ${s.status.toLowerCase()}`}>{s.status}</span></td>
                    <td>
                      <div className="action-btns">
                        {s.status === 'PENDING' && (
                          <button onClick={() => updateSongStatus(s.id, 'APPROVED')} className="btn-approve"><Check size={16} /></button>
                        )}
                        <button onClick={() => { setEditingItem(s); setEditImagePreview(s.image_url); }} className="btn-edit"><Edit2 size={16} /></button>
                        <button onClick={() => deleteItem(s.id)} className="btn-delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Tên</th>
                  <th>Email</th>
                  <th>Quyền</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><img src={u.image_url || '/default-avatar.png'} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} /></td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      <div className="action-btns">
                        <button onClick={() => setEditingItem(u)} className="btn-edit"><Edit2 size={16} /></button>
                        <button onClick={() => deleteItem(u.id)} className="btn-delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="ads-grid">
            <form onSubmit={handleAddAd} className="ad-form-premium glass">
              <h3>Tạo Quảng Cáo</h3>
              <input type="text" placeholder="Nội dung thông báo..." value={newAd.content} onChange={e => setNewAd({ ...newAd, content: e.target.value })} required />
              <input type="text" placeholder="Link ảnh (nếu có)..." value={newAd.image_url} onChange={e => setNewAd({ ...newAd, image_url: e.target.value })} />
              <button type="submit" className="btn-primary">Kích hoạt ngay</button>
            </form>
            <div className="ads-list">
              {ads.map(ad => (
                <div key={ad.id} className="ad-card glass">
                  <p>{ad.content}</p>
                  <button onClick={() => fetch(`/api/admin/ads?id=${ad.id}`, { method: 'DELETE' }).then(fetchData)} className="btn-delete"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="modal-overlay" onClick={() => { setEditingItem(null); setEditImage(null); setEditImagePreview(null); }}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chỉnh sửa {activeTab === 'songs' ? 'bài hát' : 'người dùng'}</h2>
              <button onClick={() => { setEditingItem(null); setEditImage(null); setEditImagePreview(null); }}><X /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="edit-form-grid">
              {activeTab === 'songs' ? (
                <>
                  <div className="edit-left">
                    <div className="edit-artwork-picker">
                       <label className="artwork-preview">
                         <img src={editImagePreview || '/default-song.png'} alt="Preview" />
                         <div className="overlay-camera"><Camera size={24} /></div>
                         <input type="file" hidden accept="image/*" onChange={handleEditImageChange} />
                       </label>
                    </div>
                    <div className="form-group">
                      <label>Tên bài hát</label>
                      <input type="text" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Nghệ sĩ</label>
                      <input type="text" value={editingItem.artist} onChange={e => setEditingItem({...editingItem, artist: e.target.value})} />
                    </div>
                    <button type="submit" className="btn-save"><Save size={18} /> Lưu bài hát</button>
                  </div>
                  <div className="edit-right">
                    <div className="form-group" style={{ height: '100%' }}>
                      <label>Lời bài hát</label>
                      <textarea value={editingItem.lyrics} onChange={e => setEditingItem({...editingItem, lyrics: e.target.value})} style={{ height: '140px', resize: 'none' }} />
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ width: '100%' }}>
                  <div className="form-group">
                    <label>Tên người dùng</label>
                    <input type="text" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Quyền hạn</label>
                    <select value={editingItem.role} onChange={e => setEditingItem({...editingItem, role: e.target.value})}>
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-save" style={{ marginTop: '20px' }}><Save size={18} /> Cập nhật người dùng</button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-container { padding: 40px; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .admin-tabs { display: flex; gap: 12px; }
        .admin-tabs button { display: flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 50px; background: rgba(255,255,255,0.05); font-weight: 700; transition: 0.3s; }
        .admin-tabs button.active { background: var(--primary); color: black; }

        .admin-table-wrapper { background: rgba(255,255,255,0.02); border-radius: 20px; border: 1px solid var(--glass-border); overflow: hidden; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 16px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .admin-table th { color: var(--primary); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; }

        .action-btns { display: flex; gap: 10px; }
        .action-btns button { padding: 8px; border-radius: 10px; background: rgba(255,255,255,0.05); transition: 0.2s; }
        .btn-approve:hover { background: #00ff00; color: black; }
        .btn-edit:hover { background: var(--primary); color: black; }
        .btn-delete:hover { background: #ff4444; color: black; }

        .status-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 900; }
        .status-badge.pending { background: rgba(255,165,0,0.1); color: orange; }
        .status-badge.approved { background: rgba(0,255,0,0.1); color: #00ff00; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 10px; overflow: hidden; }
        .modal-content { width: 100%; max-width: 600px; padding: 20px; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        .modal-content::-webkit-scrollbar { width: 6px; }
        .modal-content::-webkit-scrollbar-track { background: transparent; }
        .modal-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        
        .edit-form-grid { display: grid; grid-template-columns: 140px 1fr; gap: 20px; align-items: flex-start; }
        .edit-left, .edit-right { display: flex; flex-direction: column; gap: 12px; }
        
        .edit-artwork-picker { width: 100%; aspect-ratio: 1; margin-bottom: 8px; }
        .artwork-preview { position: relative; width: 100%; height: 100%; display: block; border-radius: 16px; overflow: hidden; cursor: pointer; border: 2px dashed var(--glass-border); }
        .artwork-preview img { width: 100%; height: 100%; object-fit: cover; }
        .overlay-camera { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.3s; }
        .artwork-preview:hover .overlay-camera { opacity: 1; }

        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 0.8rem; color: var(--text-muted); font-weight: 700; }
        .form-group input, .form-group textarea, .form-group select { padding: 10px 12px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px; color: white; width: 100%; font-family: inherit; transition: 0.3s; font-size: 0.9rem; }
        .form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(243, 186, 47, 0.2); outline: none; background: rgba(0,0,0,0.4); }
        .btn-save { background: var(--primary); color: black; font-weight: 800; padding: 10px; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; transition: 0.3s; border: none; cursor: pointer; }
        .btn-save:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(243, 186, 47, 0.3); }
        
        @media (max-width: 768px) {
          .edit-form-grid { grid-template-columns: 1fr; }
          .modal-content { max-height: 90vh; overflow-y: auto; }
        }

        .ads-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        .ad-form-premium { padding: 32px; display: flex; flex-direction: column; gap: 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
        .ad-form-premium input { width: 100%; padding: 14px; background: transparent; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; color: white; font-family: inherit; transition: 0.3s; }
        .ad-form-premium input:focus { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(243, 186, 47, 0.2); outline: none; }
        .ad-card { padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
        .btn-primary { padding: 14px; border-radius: 12px; background: var(--primary); color: black; font-weight: 800; border: none; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 15px rgba(243, 186, 47, 0.2); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(243, 186, 47, 0.4); }
      `}</style>
    </div>
  );
}
