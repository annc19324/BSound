'use client';

import React, { useEffect, useState, use } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Play, ThumbsUp, ThumbsDown, MessageSquare, User, Send } from 'lucide-react';
import Link from 'next/link';

export default function SongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [song, setSong] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userInteraction, setUserInteraction] = useState<'LIKE' | 'DISLIKE' | null>(null);
  const { playSong } = usePlayer();

  useEffect(() => {
    fetch(`/api/songs/${id}`).then(r => r.json()).then(setSong);
    fetch(`/api/songs/${id}/comments`).then(r => r.json()).then(setComments);
    fetch(`/api/songs/${id}/interactions`).then(r => r.json()).then(d => setUserInteraction(d.userInteraction || null));
  }, [id]);

  const handleInteraction = async (type: 'LIKE' | 'DISLIKE') => {
    const res = await fetch(`/api/songs/${id}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    if (res.ok) {
      const d = await res.json();
      setSong((s: any) => ({ ...s, likes: d.likes, dislikes: d.dislikes }));
      setUserInteraction(d.userInteraction);
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
      const c = await res.json();
      setComments([c, ...comments]);
      setNewComment('');
    }
  };

  if (!song) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <div className="loader" />
    </div>
  );

  const CommentPanel = () => (
    <div className="song-comments-panel">
      <h2 className="song-comments-title">
        <MessageSquare size={18} /> Bình luận <span className="tab-count" style={{ marginLeft: 4 }}>{comments.length}</span>
      </h2>
      <form onSubmit={handleComment} className="comment-form">
        <input
          type="text"
          placeholder="Chia sẻ cảm nhận..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
        />
        <button type="submit"><Send size={16} /></button>
      </form>
      <div className="comments-list">
        {comments.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '16px 0' }}>Chưa có bình luận nào.</p>
        )}
        {comments.map(c => (
          <div key={c.id} className="comment-item">
            <div className="comment-avatar">
              {c.user_name ? c.user_name.charAt(0).toUpperCase() : <User size={14} />}
            </div>
            <div className="comment-body">
              <div className="comment-user">{c.user_name || 'Người dùng'}</div>
              <div className="comment-text">{c.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fade-in song-detail-root">
      {/* ── Main content ── */}
      <div className="song-detail-main">
        {/* Header */}
        <div className="song-header">
          <div className="song-artwork">
            {song.image_url ? <img src={song.image_url} alt={song.title} /> : '🎵'}
          </div>
          <div className="song-info-main">
            <p className="song-label">Bài hát</p>
            <h1 className="song-title-large">{song.title}</h1>
            <div className="song-meta-grid">
              <div className="meta-item"><span>Ca sĩ/Rapper:</span> <strong>{song.artist}</strong></div>
              {song.uploader_id && (
                <div className="meta-item">
                  <span>Người đăng:</span>{' '}
                  <Link href={`/user/${song.uploader_id}`} style={{ color: 'var(--primary)', fontWeight: '700' }}>
                    {song.uploader_name || 'Hệ thống'}
                  </Link>
                </div>
              )}
              <div className="meta-item"><span>Ngày đăng:</span> {new Date(song.created_at).toLocaleDateString('vi-VN')}</div>
              <div className="meta-item"><span>Lượt nghe:</span> {song.views}</div>
            </div>
            <div className="song-actions">
              <button onClick={() => playSong(song)} className="btn-play">
                <Play fill="black" size={20} /> PHÁT
              </button>
              <div className="interaction-group">
                <button onClick={() => handleInteraction('LIKE')}
                  className={`btn-interaction ${userInteraction === 'LIKE' ? 'active-like' : ''}`}>
                  <ThumbsUp size={18} fill={userInteraction === 'LIKE' ? 'currentColor' : 'none'} />
                  {song.likes ?? 0}
                </button>
                <button onClick={() => handleInteraction('DISLIKE')}
                  className={`btn-interaction ${userInteraction === 'DISLIKE' ? 'active-dislike' : ''}`}>
                  <ThumbsDown size={18} fill={userInteraction === 'DISLIKE' ? 'currentColor' : 'none'} />
                  {song.dislikes ?? 0}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lyrics + Mobile comments */}
        <div className="song-content-area">
          <div className="lyrics-section">
            <h2 style={{ marginBottom: '16px', fontWeight: '800' }}>Lời bài hát</h2>
            <div className="lyrics-box">
              {song.lyrics
                ? <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: '1.9', fontSize: '1rem' }}>{song.lyrics}</pre>
                : <p style={{ color: 'var(--text-muted)' }}>Chưa có lời bài hát.</p>
              }
            </div>
          </div>

          {/* Mobile comment section (below lyrics on small screens) */}
          <div className="song-comments-mobile">
            <CommentPanel />
          </div>
        </div>
      </div>

      {/* ── Desktop right sidebar: comments ── */}
      <aside className="song-comments-sidebar">
        <CommentPanel />
      </aside>
    </div>
  );
}
