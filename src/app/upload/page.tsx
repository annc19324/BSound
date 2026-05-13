'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, UploadCloud, FileMusic } from 'lucide-react';

// Upload a file directly to Cloudinary using a signed URL from our API
async function uploadToCloudinaryDirect(
  file: File,
  folder: string,
  resourceType: 'image' | 'video' = 'image',
  onProgress?: (pct: number) => void
): Promise<string> {
  // 1. Get signed params from our server
  const sigRes = await fetch(`/api/songs/upload-signature?folder=${folder}`);
  if (!sigRes.ok) throw new Error('Không lấy được chữ ký upload');
  const { signature, timestamp, cloudName, apiKey } = await sigRes.json();

  // 2. Upload directly to Cloudinary (bypasses Vercel completely)
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', apiKey);
  fd.append('timestamp', String(timestamp));
  fd.append('signature', signature);
  fd.append('folder', folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // Use explicit resource_type endpoint (video handles mp3/mp4/wav, image handles jpg/png)
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
          // If uploaded as video but we want audio, transform URL to .mp3
          if (resourceType === 'video' && !url.endsWith('.mp3')) {
            // Cloudinary URL transformation: insert f_mp3 before the version segment
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

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');   // what's currently uploading
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!file) { setMessage('Lỗi: Vui lòng chọn file nhạc.'); return; }
    setLoading(true);
    setProgress(0);

    try {
      // 1. Upload audio/video directly to Cloudinary as 'video' resource type
      //    (Cloudinary's 'video' type handles mp3, mp4, wav, etc.)
      setStage('nhạc');
      const fileUrl = await uploadToCloudinaryDirect(file, 'bsound', 'video', setProgress);

      // 2. Upload image if provided
      let imageUrl: string | null = null;
      if (image) {
        setStage('ảnh bìa');
        setProgress(0);
        imageUrl = await uploadToCloudinaryDirect(image, 'bsound_images', 'image');
      }

      // 3. Save metadata to our DB (tiny JSON request — no 413 risk)
      setStage('lưu bài');
      const res = await fetch('/api/songs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, artist, lyrics, fileUrl, imageUrl }),
      });

      if (res.ok) {
        setMessage('Đăng nhạc thành công! Đang chuyển hướng...');
        setTimeout(() => router.push('/'), 1500);
      } else {
        const data = await res.json();
        setMessage(`Lỗi: ${data.error || 'Đã có lỗi xảy ra'}`);
      }
    } catch (err: any) {
      setMessage(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
      setStage('');
      setProgress(0);
    }
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
                Đang tải {stage} {progress > 0 ? `${progress}%` : '...'}
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
