'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Music, Users, Megaphone, Check, X, Trash2, Edit2, Save, Camera, FileMusic, Key, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePlayer } from '@/context/PlayerContext';

async function uploadToCloudinaryDirect(
  file: File,
  folder: string,
  resourceType: 'image' | 'video' = 'image',
  onProgress?: (pct: number) => void
): Promise<string> {
  const sigRes = await fetch(`/api/songs/upload-signature?folder=${folder}`);
  if (!sigRes.ok) throw new Error('Không lấy được chữ ký upload');
  const { signature, timestamp, cloudName, apiKey } = await sigRes.json();

  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', apiKey);
  fd.append('timestamp', String(timestamp));
  fd.append('signature', signature);
  fd.append('folder', folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status === 200) {
          let url: string = res.secure_url;
          if (resourceType === 'video' && !url.endsWith('.mp3')) {
            url = url.replace('/upload/', '/upload/f_mp3/').replace(/\.[^/.]+$/, '.mp3');
          }
          resolve(url);
        } else {
          reject(new Error(`Cloudinary: ${res.error?.message || xhr.responseText}`));
        }
      } catch {
        reject(new Error(`Cloudinary lỗi (${xhr.status}): ${xhr.responseText.slice(0, 120)}`));
      }
    };
    xhr.onerror = () => reject(new Error('Lỗi kết nối Cloudinary'));
    xhr.send(fd);
  });
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'songs' | 'users' | 'ads' | 'dlpassword'>('songs');
  const [songs, setSongs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [newAd, setNewAd] = useState({ content: '', image_url: '' });
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editSound, setEditSound] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [stage, setStage] = useState<string>('');
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  // Download password state
  const [dlPassword, setDlPassword] = useState<string>('');
  const [dlPasswordCurrent, setDlPasswordCurrent] = useState<string | null>(null);
  const [dlPasswordSaving, setDlPasswordSaving] = useState(false);
  const [dlPasswordShow, setDlPasswordShow] = useState(false);
  const router = useRouter();
  const { playSong } = usePlayer();

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
      } else if (activeTab === 'dlpassword') {
        const res = await fetch('/api/admin/download-password');
        if (res.ok) {
          const data = await res.json();
          setDlPasswordCurrent(data.password);
          setDlPassword(data.password ?? '');
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    setUploadProgress(0);
    setStage('');

    try {
      const endpoint = activeTab === 'songs' ? '/api/admin/songs' : '/api/admin/users';
      let options: RequestInit = { method: 'PATCH' };

      if (activeTab === 'songs') {
        const formData = new FormData();
        formData.append('id', editingItem.id);
        formData.append('title', editingItem.title);
        formData.append('artist', editingItem.artist);
        formData.append('lyrics', editingItem.lyrics || '');

        if (editSound) {
          setStage('nhạc');
          const fileUrl = await uploadToCloudinaryDirect(editSound, 'bsound', 'video', setUploadProgress);
          formData.append('fileUrl', fileUrl);
        }

        if (editImage) {
          formData.append('image', editImage);
        }

        options.body = formData;
      } else {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(editingItem);
      }

      setStage('lưu bài');
      const res = await fetch(endpoint, options);
      if (res.ok) {
        toast.success('Đã cập nhật thành công');
        closeEdit();
        fetchData();
      } else {
        toast.error('Cập nhật thất bại');
      }
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message || 'Cập nhật thất bại'}`);
    } finally {
      setLoadingAction(false);
      setStage('');
      setUploadProgress(0);
    }
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setEditImage(file); setEditImagePreview(URL.createObjectURL(file)); }
  };

  const updateSongStatus = async (id: number, status: string) => {
    const endpoint = status === 'APPROVED' ? `/api/admin/approve/${id}` : `/api/admin/reject/${id}`;
    const res = await fetch(endpoint, { method: 'POST' });
    if (res.ok) {
      toast.success(status === 'APPROVED' ? 'Đã duyệt bài hát' : 'Đã từ chối bài hát');
      fetchData();
    } else {
      toast.error('Cập nhật thất bại');
    }
  };

  const deleteItem = async (id: number) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ margin: 0, fontSize: '0.85rem' }}>Xác nhận xoá mục này?</p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => toast.dismiss(t.id)}
            style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
          >
            Huỷ
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              const endpoint = activeTab === 'songs' ? `/api/admin/songs?id=${id}` : `/api/admin/users?id=${id}`;
              const res = await fetch(endpoint, { method: 'DELETE' });
              if (res.ok) {
                toast.success('Đã xoá thành công');
                fetchData();
              } else {
                toast.error('Có lỗi xảy ra khi xoá');
              }
            }}
            style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', background: '#ff4444', color: '#fff', fontWeight: '700' }}
          >
            Xoá
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAd),
    });
    if (res.ok) {
      toast.success('Đã thêm quảng cáo');
      setNewAd({ content: '', image_url: '' });
      fetchData();
    } else {
      toast.error('Thêm thất bại');
    }
  };

  const closeEdit = () => {
    setEditingItem(null);
    setEditImage(null);
    setEditImagePreview(null);
    setEditSound(null);
    setUploadProgress(0);
    setStage('');
    setLoadingAction(false);
  };

  const handleSaveDlPassword = async () => {
    if (!dlPassword.trim()) return;
    setDlPasswordSaving(true);
    try {
      const res = await fetch('/api/admin/download-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: dlPassword.trim() }),
      });
      if (res.ok) {
        toast.success('Đã lưu mã BSound thành công');
        setDlPasswordCurrent(dlPassword.trim());
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lưu thất bại');
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setDlPasswordSaving(false);
    }
  };

  const handleDeleteDlPassword = async () => {
    setDlPasswordSaving(true);
    try {
      const res = await fetch('/api/admin/download-password', { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xoá mã BSound');
        setDlPasswordCurrent(null);
        setDlPassword('');
      } else {
        toast.error('Xoá thất bại');
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setDlPasswordSaving(false);
    }
  };

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
          <button className={activeTab === 'dlpassword' ? 'active' : ''} onClick={() => setActiveTab('dlpassword')}>
            <Key size={16} /><span>Mật khẩu tải</span>
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
                  <div key={s.id} className="admin-card" onClick={() => playSong(s)} style={{ cursor: 'pointer' }}>
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
                    <div className="admin-card-actions" onClick={e => e.stopPropagation()}>
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

            {/* ── Download Password Tab ── */}
            {activeTab === 'dlpassword' && (
              <div style={{ maxWidth: 480 }}>
                <div className="ad-form glass" style={{ gap: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <Key size={20} color="var(--primary)" />
                    <h3 style={{ margin: 0 }}>Mật khẩu tải nhạc (Mã BSound)</h3>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    Người dùng cần nhập mã này để tải toàn bộ bài hát. Liên hệ quản trị viên để cấp mã.
                  </p>

                  {dlPasswordCurrent && (
                    <div style={{
                      padding: '12px 14px',
                      background: 'rgba(243,186,47,0.08)',
                      border: '1px solid rgba(243,186,47,0.2)',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: '0.85rem',
                    }}>
                      <Key size={14} color="var(--primary)" />
                      <span style={{ color: 'var(--text-muted)' }}>Mã hiện tại:</span>
                      <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace', letterSpacing: 2 }}>
                        {dlPasswordShow ? dlPasswordCurrent : '••••••••'}
                      </span>
                      <button
                        onClick={() => setDlPasswordShow(v => !v)}
                        style={{ marginLeft: 'auto', padding: 4, color: 'var(--text-muted)' }}
                        title={dlPasswordShow ? 'Ẩn' : 'Hiện'}
                      >
                        {dlPasswordShow ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Đặt mã mới</label>
                    <input
                      type="text"
                      placeholder="Nhập mã BSound mới..."
                      value={dlPassword}
                      onChange={e => setDlPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !dlPasswordSaving && handleSaveDlPassword()}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="btn-save"
                      style={{ flex: 1 }}
                      disabled={dlPasswordSaving || !dlPassword.trim()}
                      onClick={handleSaveDlPassword}
                    >
                      {dlPasswordSaving ? <><span className="spin" /> Đang lưu...</> : <><Save size={15} /> Lưu mã</>}
                    </button>
                    {dlPasswordCurrent && (
                      <button
                        onClick={handleDeleteDlPassword}
                        disabled={dlPasswordSaving}
                        style={{
                          padding: '10px 16px', borderRadius: 10,
                          background: 'rgba(255,68,68,0.1)', color: '#ff4444',
                          border: '1px solid rgba(255,68,68,0.2)',
                          fontWeight: 700, fontSize: '0.82rem',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <Trash2 size={15} /> Xoá mã
                      </button>
                    )}
                  </div>
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
                    <div className="form-group">
                      <label>File nhạc (đổi sound)</label>
                      <label className={`file-picker ${editSound ? 'has-file' : ''}`} style={{ width: '100%' }}>
                        <FileMusic size={18} />
                        <span style={{ fontSize: '0.75rem' }}>{editSound ? editSound.name : 'MP3 / WAV / MP4...'}</span>
                        <input
                          type="file"
                          accept="audio/*,video/*"
                          onChange={(e) => setEditSound(e.target.files?.[0] || null)}
                          hidden
                        />
                      </label>
                    </div>
                    <button type="submit" className="btn-save" disabled={loadingAction}>
                      {loadingAction ? (
                        <>
                          <span className="spin" />
                          Đang tải {stage} {uploadProgress > 0 ? `${uploadProgress}%` : '...'}
                        </>
                      ) : (
                        <>
                          <Save size={16} /> Lưu
                        </>
                      )}
                    </button>
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
