'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Download, CheckSquare, Square, Music, Loader2, Lock, Key, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface Song {
  id: number;
  title: string;
  artist: string;
  file_url: string;
  image_url?: string;
}

export default function DownloadPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [password, setPassword] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    fetch('/api/download')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSongs(data);
          setSelected(new Set(data.map((s: Song) => s.id)));
        }
      })
      .catch(() => toast.error('Không tải được danh sách bài hát'))
      .finally(() => setLoadingSongs(false));
  }, []);

  const allSelected = songs.length > 0 && selected.size === songs.length;
  const noneSelected = selected.size === 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(songs.map(s => s.id)));
    }
  };

  const toggleSong = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sanitizeFilename = (title: string, artist: string) => {
    const raw = `${artist} - ${title}`;
    return raw.replace(/[<>:"/\\|?*]+/g, '_').replace(/\s+/g, ' ').trim() + '.mp3';
  };

  const handleDownload = async () => {
    if (!password.trim()) {
      toast.error('Vui lòng nhập mã BSound trước khi tải');
      return;
    }
    if (noneSelected) {
      toast.error('Vui lòng chọn ít nhất một bài hát');
      return;
    }

    setDownloading(true);
    abortRef.current = false;

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: password.trim(),
          songIds: Array.from(selected),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Xác thực thất bại');
        setDownloading(false);
        return;
      }

      const { songs: downloadSongs } = await res.json();
      const total = downloadSongs.length;
      setDownloadProgress({ current: 0, total });

      for (let i = 0; i < downloadSongs.length; i++) {
        if (abortRef.current) break;
        const s = downloadSongs[i];
        setDownloadProgress({ current: i + 1, total });

        try {
          const fileRes = await fetch(s.file_url);
          const blob = await fileRes.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = sanitizeFilename(s.title, s.artist);
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          // Small delay to avoid browser blocking multiple downloads
          await new Promise(r => setTimeout(r, 600));
        } catch {
          toast.error(`Không tải được: ${s.title}`);
        }
      }

      if (!abortRef.current) {
        toast.success(`Đã tải xong ${total} bài hát!`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setDownloading(false);
      setDownloadProgress(null);
    }
  };

  return (
    <div className="fade-in download-page">
      {/* Header */}
      <div className="dl-header">
        <div className="dl-header-icon">
          <Download size={28} />
        </div>
        <div>
          <h1 className="dl-title">Tải toàn bộ bài hát</h1>
          <p className="dl-subtitle">Tải nhạc về máy với mã BSound từ quản trị viên</p>
        </div>
      </div>

      {/* Notice */}
      <div className="dl-notice glass">
        <Info size={16} />
        <span>Tính năng này yêu cầu <strong>Mã BSound</strong>. Liên hệ quản trị viên để lấy mã tải nhạc.</span>
      </div>

      {/* Download button + password */}
      <div className="dl-action-card glass">
        <div className="dl-password-group">
          <Key size={18} className="dl-key-icon" />
          <input
            type="password"
            placeholder="Nhập mã BSound..."
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleDownload()}
            className="dl-password-input"
            autoComplete="off"
          />
        </div>

        <button
          className="dl-btn"
          onClick={handleDownload}
          disabled={downloading || noneSelected || loadingSongs}
        >
          {downloading ? (
            <>
              <Loader2 size={18} className="spin-anim" />
              {downloadProgress
                ? `Đang tải ${downloadProgress.current}/${downloadProgress.total}...`
                : 'Đang xử lý...'}
            </>
          ) : (
            <>
              <Download size={18} />
              Tải {selected.size > 0 ? `${selected.size} bài` : 'nhạc'}
            </>
          )}
        </button>
      </div>

      {/* Song list controls */}
      <div className="dl-list-header">
        <div className="dl-list-count">
          <Music size={15} />
          <span>{loadingSongs ? 'Đang tải...' : `${songs.length} bài hát`}</span>
          {!loadingSongs && <span className="dl-selected-count">({selected.size} đã chọn)</span>}
        </div>
        {!loadingSongs && songs.length > 0 && (
          <div className="dl-bulk-actions">
            <button className="dl-bulk-btn" onClick={() => setSelected(new Set(songs.map(s => s.id)))}>
              Chọn tất cả
            </button>
            <button className="dl-bulk-btn" onClick={() => setSelected(new Set())}>
              Bỏ chọn tất cả
            </button>
          </div>
        )}
      </div>

      {/* Song list */}
      <div className="dl-song-list">
        {loadingSongs ? (
          <div className="dl-skeleton-list">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="dl-skeleton-row">
                <div className="skel-box" style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="skel-box" style={{ height: 13, width: '60%' }} />
                  <div className="skel-box" style={{ height: 11, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : songs.length === 0 ? (
          <div className="dl-empty">
            <Music size={48} opacity={0.2} />
            <p>Chưa có bài hát nào</p>
          </div>
        ) : (
          songs.map(song => {
            const checked = selected.has(song.id);
            return (
              <div
                key={song.id}
                className={`dl-song-row ${checked ? 'checked' : ''}`}
                onClick={() => toggleSong(song.id)}
              >
                <div className="dl-checkbox">
                  {checked
                    ? <CheckSquare size={20} color="var(--primary)" />
                    : <Square size={20} color="var(--text-muted)" />}
                </div>
                <img
                  src={song.image_url || '/bsound.png'}
                  alt={song.title}
                  className="dl-song-img"
                />
                <div className="dl-song-info">
                  <div className="dl-song-title">{song.title}</div>
                  <div className="dl-song-artist">{song.artist}</div>
                </div>
                <div className="dl-song-icon">
                  <Download size={15} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
