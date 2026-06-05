'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Download, CheckSquare, Square, Music, Loader2, Key, Info, FolderOpen, FolderCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface Song {
  id: number;
  title: string;
  artist: string;
  file_url: string;
  image_url?: string;
}

// Extend Window type for File System Access API
declare global {
  interface Window {
    showDirectoryPicker?: (opts?: { mode?: string }) => Promise<FileSystemDirectoryHandle>;
  }
}

export default function DownloadPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [password, setPassword] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [fsApiSupported, setFsApiSupported] = useState(false);
  const abortRef = useRef(false);

  useEffect(() => {
    setFsApiSupported(typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function');

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

  const noneSelected = selected.size === 0;

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

  const handlePickFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker!({ mode: 'readwrite' });
      setDirHandle(handle);
      toast.success(`Đã chọn thư mục: ${handle.name}`);
    } catch (e: any) {
      if (e?.name !== 'AbortError') toast.error('Không thể chọn thư mục');
    }
  };

  /** Save a blob directly to the picked directory */
  const saveToDir = async (handle: FileSystemDirectoryHandle, filename: string, blob: Blob) => {
    const fileHandle = await handle.getFileHandle(filename, { create: true });
    const writable = await (fileHandle as any).createWritable();
    await writable.write(blob);
    await writable.close();
  };

  /** Legacy fallback: trigger browser download */
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

    // If FS API supported but no folder chosen, auto-open picker
    let activeDir = dirHandle;
    if (fsApiSupported && !activeDir) {
      try {
        activeDir = await window.showDirectoryPicker!({ mode: 'readwrite' });
        setDirHandle(activeDir);
        toast.success(`Đã chọn thư mục: ${activeDir.name}`);
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          toast.error('Bạn chưa chọn thư mục lưu');
          return;
        }
        activeDir = null; // Fallback to legacy download
      }
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
          const filename = sanitizeFilename(s.title, s.artist);

          if (activeDir) {
            await saveToDir(activeDir, filename, blob);
          } else {
            triggerDownload(blob, filename);
            await new Promise(r => setTimeout(r, 600)); // Avoid browser blocking
          }
        } catch {
          toast.error(`Không tải được: ${s.title}`);
        }
      }

      if (!abortRef.current) {
        toast.success(
          activeDir
            ? `Đã lưu ${total} bài vào "${activeDir.name}"!`
            : `Đã tải xong ${total} bài hát!`
        );
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

      {/* Action card: folder + password + button */}
      <div className="dl-action-card glass">

        {/* Folder picker row (only if FS API supported) */}
        {fsApiSupported && (
          <div className="dl-folder-row">
            <button
              className={`dl-folder-btn ${dirHandle ? 'selected' : ''}`}
              onClick={handlePickFolder}
              disabled={downloading}
              title="Chọn thư mục lưu nhạc"
            >
              {dirHandle ? <FolderCheck size={16} /> : <FolderOpen size={16} />}
              <span className="dl-folder-name">
                {dirHandle ? dirHandle.name : 'Chọn thư mục lưu'}
              </span>
            </button>
            {dirHandle && (
              <button
                className="dl-folder-clear"
                onClick={() => setDirHandle(null)}
                title="Bỏ chọn thư mục"
                disabled={downloading}
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Password + download button row */}
        <div className="dl-action-row">
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
                  ? `${downloadProgress.current}/${downloadProgress.total}...`
                  : 'Xử lý...'}
              </>
            ) : (
              <>
                <Download size={18} />
                Tải {selected.size > 0 ? `${selected.size} bài` : 'nhạc'}
              </>
            )}
          </button>
        </div>

        {/* Hint for unsupported browsers */}
        {!fsApiSupported && (
          <p className="dl-folder-hint">
            💡 Trình duyệt của bạn không hỗ trợ chọn thư mục. File sẽ tải vào thư mục Downloads mặc định.
          </p>
        )}
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
