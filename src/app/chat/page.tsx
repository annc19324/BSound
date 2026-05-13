'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Send, MessageCircle, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(res => res.json()).then(data => setUser(data));
    fetchMessages();
    markAsSeen();
    
    // Fast polling for instant feel (1.5s)
    const interval = setInterval(fetchMessages, 1500); 
    return () => clearInterval(interval);
  }, []);

  const markAsSeen = () => {
    fetch('/api/messages/seen', { method: 'POST' }).catch(() => {});
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // Every time messages update, mark as seen if we are on this page
    markAsSeen();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      // Only update if there's a change to avoid unnecessary re-renders
      if (JSON.stringify(data) !== JSON.stringify(messages)) {
        setMessages(data);
      }
    } catch (e) {
      console.error('Failed to fetch messages');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const content = newMessage;
    setNewMessage('');

    // Optimistic Update: Add message immediately to the UI
    const tempMsg = {
      id: Date.now(),
      user_id: user.id,
      user_name: user.name,
      content: content,
      created_at: new Date().toISOString(),
      optimistic: true
    };
    setMessages(prev => [...prev, tempMsg]);

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content }),
    });

    if (res.ok) {
      fetchMessages();
    } else {
      // Remove optimistic message if failed
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      toast.error('Gửi tin nhắn thất bại');
    }
  };

  return (
    <div className="fade-in chat-container">
      <div className="chat-header glass">
        <MessageCircle className="text-primary" />
        <div>
          <h1>Phòng Chat Tổng</h1>
          <p>Nơi giao lưu của tất cả người dùng BSound</p>
        </div>
      </div>

      <div className="chat-window glass" ref={scrollRef}>
        {messages.map((msg, idx) => {
          const isOwn = user?.id === msg.user_id;
          return (
            <div key={msg.id || idx} className={`message-item ${isOwn ? 'own' : ''} ${msg.optimistic ? 'sending' : ''}`}>
              <div className="msg-avatar">
                {msg.user_name?.[0].toUpperCase() || 'U'}
              </div>
              <div className="msg-content">
                <div className="msg-info">
                  <span className="msg-user">{msg.user_name}</span>
                  <span className="msg-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="msg-bubble">{msg.content}</div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-area glass">
        <input 
          type="text" 
          placeholder="Viết tin nhắn của bạn..." 
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
        />
        <button type="submit" className="btn-send">
          <Send size={20} />
        </button>
      </form>

      <style jsx>{`
        .chat-container { max-width: 900px; margin: 0 auto; height: calc(100vh - 200px); display: flex; flex-direction: column; gap: 20px; }
        .chat-header { padding: 20px; display: flex; align-items: center; gap: 16px; border-radius: 20px; }
        .chat-header h1 { margin: 0; font-size: 1.5rem; }
        .chat-header p { margin: 0; font-size: 0.85rem; color: var(--text-muted); }

        .chat-window { flex: 1; overflow-y: auto; padding: 24px; border-radius: 20px; display: flex; flex-direction: column; gap: 20px; }
        .message-item { display: flex; gap: 12px; max-width: 80%; }
        .message-item.own { align-self: flex-end; flex-direction: row-reverse; }

        .msg-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--primary); color: black; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .message-item.own .msg-avatar { background: #333; color: white; }

        .msg-content { display: flex; flex-direction: column; gap: 4px; }
        .message-item.own .msg-content { align-items: flex-end; }
        
        .msg-info { display: flex; gap: 8px; align-items: center; font-size: 0.75rem; }
        .msg-user { font-weight: 700; }
        .msg-time { color: var(--text-muted); }

        .msg-bubble { padding: 12px 16px; border-radius: 18px; background: rgba(255,255,255,0.05); color: white; line-height: 1.4; word-break: break-word; }
        .message-item.own .msg-bubble { background: var(--primary); color: black; font-weight: 500; }
        .message-item.sending { opacity: 0.7; }

        .chat-input-area { padding: 16px; display: flex; gap: 12px; border-radius: 20px; align-items: center; }
        .chat-input-area input { flex: 1; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 12px; color: white; outline: none; }
        .btn-send { background: var(--primary); color: black; padding: 12px; border-radius: 12px; transition: 0.3s; }
        .btn-send:hover { transform: scale(1.05); }

        /* Custom Scrollbar */
        .chat-window::-webkit-scrollbar { width: 4px; }
        .chat-window::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 2px; }
      `}</style>
    </div>
  );
}
