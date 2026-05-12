'use client';

import React, { useEffect, useState, use } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Play, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';

export default function SongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [song, setSong] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const { playSong } = usePlayer();

  useEffect(() => {
    fetch(`/api/songs/${id}`)
      .then(res => res.json())
      .then(data => setSong(data));

    fetch(`/api/songs/${id}/comments`)
      .then(res => res.json())
      .then(data => setComments(data));
  }, [id]);

  const handleInteraction = async (type: 'LIKE' | 'DISLIKE') => {
    const res = await fetch(`/api/songs/${id}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    if (res.ok) {
      const data = await res.json();
      setSong({ ...song, likes: data.likes, dislikes: data.dislikes });
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const res = await fetch(`/api/songs/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment }),
    });
    if (res.ok) {
      const comment = await res.json();
      setComments([comment, ...comments]);
      setNewComment('');
    }
  };

  if (!song) return <div style={{ padding: '40px' }}>Đang tải...</div>;

  return (
    <div className="fade-in song-detail-container">
      <div className="song-header">
        <div className="song-artwork">
          {song.image_url ? (
            <img src={song.image_url} alt={song.title} />
          ) : (
            '🎵'
          )}
        </div>
        <div className="song-info-main">
          <p className="song-label">Bài hát</p>
          <h1 className="song-title-large">{song.title}</h1>
          <div className="song-meta-grid">
            <div className="meta-item"><span>Ca sĩ/Rapper:</span> <strong>{song.artist}</strong></div>
            <div className="meta-item"><span>Người đăng:</span> {song.uploader_name || 'Hệ thống'}</div>
            <div className="meta-item"><span>Người duyệt:</span> {song.approver_name || 'Admin'}</div>
            <div className="meta-item"><span>Ngày đăng:</span> {new Date(song.created_at).toLocaleDateString()}</div>
            <div className="meta-item"><span>Lượt nghe:</span> {song.views}</div>
          </div>
          
          <div className="song-actions">
            <button onClick={() => playSong(song)} className="btn-play">
              <Play fill="black" size={24} /> PHÁT
            </button>
            <div className="interaction-group">
              <button onClick={() => handleInteraction('LIKE')} className="btn-interaction">
                <ThumbsUp size={20} /> {song.likes}
              </button>
              <button onClick={() => handleInteraction('DISLIKE')} className="btn-interaction">
                <ThumbsDown size={20} /> {song.dislikes}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="song-content-grid">
        <div className="lyrics-section">
          <h2>Lời bài hát</h2>
          <div className="lyrics-box">
            {song.lyrics ? (
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: '1.8' }}>{song.lyrics}</pre>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Chưa có lời bài hát cho tác phẩm này.</p>
            )}
          </div>
        </div>

        <div className="comments-section">
          <h2><MessageSquare size={20} /> Bình luận ({comments.length})</h2>
          
          <form onSubmit={handleComment} className="comment-form">
            <input 
              type="text" 
              placeholder="Chia sẻ cảm nhận của bạn..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit">Gửi</button>
          </form>

          <div className="comments-list">
            {comments.map(c => (
              <div key={c.id} className="comment-item">
                <div className="comment-avatar" />
                <div className="comment-body">
                  <div className="comment-user">{c.user_name || 'Người dùng'}</div>
                  <div className="comment-text">{c.content}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .song-detail-container { padding: 20px; }
        .song-header { display: flex; gap: 40px; margin-bottom: 60px; align-items: flex-end; flex-wrap: wrap; }
        .song-artwork { width: 280px; height: 280px; background: #222; border-radius: 12px; display: flex; alignItems: center; justifyContent: center; font-size: 5rem; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .song-artwork img { width: 100%; height: 100%; object-fit: cover; }
        .song-info-main { flex: 1; min-width: 300px; }
        .song-label { text-transform: uppercase; font-size: 0.8rem; font-weight: 800; letter-spacing: 2px; color: var(--primary); }
        .song-title-large { font-size: clamp(2.5rem, 5vw, 4.5rem); margin: 10px 0; font-weight: 900; line-height: 1; }
        .song-meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 20px; color: var(--text-muted); font-size: 0.9rem; }
        .meta-item strong { color: white; }
        .song-actions { display: flex; gap: 20px; margin-top: 32px; align-items: center; flex-wrap: wrap; }
        .btn-play { background: var(--primary); color: black; padding: 16px 48px; border-radius: 40px; font-weight: 800; display: flex; gap: 12px; transition: 0.2s; }
        .btn-play:hover { transform: scale(1.05); }
        .interaction-group { display: flex; gap: 12px; }
        .btn-interaction { display: flex; gap: 8px; align-items: center; padding: 8px 16px; border-radius: 20px; background: rgba(255,255,255,0.05); }
        
        .song-content-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 60px; margin-top: 40px; }
        .lyrics-box { background: rgba(255,255,255,0.03); padding: 32px; border-radius: 16px; font-size: 1.1rem; color: #ddd; }
        
        .comment-form { display: flex; gap: 12px; margin-bottom: 30px; }
        .comment-form input { flex: 1; padding: 14px; background: #111; border: 1px solid var(--glass-border); color: white; border-radius: 8px; }
        .comment-form button { background: var(--primary); color: black; padding: 0 24px; border-radius: 8px; font-weight: 700; }
        .comment-item { display: flex; gap: 16px; margin-bottom: 20px; }
        .comment-avatar { width: 36px; height: 36px; background: #333; border-radius: 50%; }
        .comment-user { font-weight: 700; font-size: 0.9rem; margin-bottom: 4px; }
        .comment-text { font-size: 0.95rem; color: #ccc; }

        @media (max-width: 1024px) {
          .song-content-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .song-header { gap: 20px; justify-content: center; text-align: center; }
          .song-artwork { width: 220px; height: 220px; }
          .song-actions { justify-content: center; }
        }
      `}</style>
    </div>
  );
}
