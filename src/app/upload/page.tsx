'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, UploadCloud, FileMusic } from 'lucide-react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setImage(selected);
    if (selected) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(selected);
    } else {
      setImagePreview(null);
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!file) { setMessage('Lỗi: Vui lòng chọn file nhạc.'); return; }
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('lyrics', lyrics);
    if (image) formData.append('image', image);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/songs/upload', true);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      setLoading(false);
      if (xhr.status === 201) {
        setMessage('Đăng nhạc thành công! Đang chuyển hướng...');
        setTimeout(() => router.push('/'), 1500);
      } else {
        const data = JSON.parse(xhr.responseText);
        setMessage(`Lỗi: ${data.error || 'Đã có lỗi xảy ra'}`);
      }
    };
    xhr.onerror = () => { setLoading(false); setMessage('Lỗi kết nối.'); };
    xhr.send(formData);
  };

  return (
    <div className="fade-in upload-page">
      <div className="upload-header">
        <h1>Đăng Bài Hát Mới</h1>
      </div>

      <form onSubmit={handleUpload} className="upload-card">
        {/* Two column top area */}
        <div className="top-grid">
          {/* Artwork */}
          <label className="artwork-picker">
            {imagePreview ? (
              <img src={imagePreview} alt="Artwork preview" />
            ) : (
              <div className="artwork-empty">
                <ImageIcon size={32} strokeWidth={1.5} />
                <span>Ảnh bìa</span>
                <small>Nhấn để chọn</small>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} hidden />
          </label>

          {/* Right side fields */}
          <div className="fields-col">
            <div className="field">
              <label>Tên bài hát</label>
              <input
                suppressHydrationWarning
                type="text"
                placeholder="Ví dụ: Nơi Này Có Anh..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Nghệ sĩ</label>
              <input
                suppressHydrationWarning
                type="text"
                placeholder="Ca sĩ, Rapper..."
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>File nhạc</label>
              <label className={`file-picker ${file ? 'has-file' : ''}`}>
                <FileMusic size={18} />
                <span>{file ? file.name : 'MP3 / WAV / MP4...'}</span>
                <input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                  hidden
                />
              </label>
            </div>
          </div>
        </div>

        {/* Lyrics */}
        <div className="field">
          <label>Lời bài hát</label>
          <textarea
            suppressHydrationWarning
            placeholder="Lời bài hát..."
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
          />
        </div>

        {/* Submit */}
        <div className="submit-area">
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? (
              <>
                <span className="spin" />
                Đang tải lên {progress}%
              </>
            ) : (
              <>
                <UploadCloud size={19} />
                Đăng Nhạc Ngay
              </>
            )}
          </button>
          {message && (
            <p className={`notice ${message.includes('Lỗi') ? 'err' : 'ok'}`}>{message}</p>
          )}
        </div>
      </form>

    </div>
  );
}
