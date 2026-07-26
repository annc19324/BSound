'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface Song {
  id: number;
  title: string;
  artist: string;
  file_url: string;
  image_url?: string;
  lyrics?: string;
  uploader_id?: number;
  uploader_name?: string;
}

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  playSong: (song: Song, queue?: Song[]) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  togglePlay: () => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
  progress: number;
  duration: number;
  seek: (time: number) => void;
  setSleepTimer: (minutes: number) => void;
  remainingTime: number | null;
  queue: Song[];
  currentIndex: number;
  isShuffle: boolean;
  toggleShuffle: () => void;
  repeatMode: 'OFF' | 'ONE' | 'ALL';
  toggleRepeat: () => void;
  nextSong: () => void;
  prevSong: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1); // 1 = 100%, 2 = 200%
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [insertOffset, setInsertOffset] = useState(1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'OFF' | 'ONE' | 'ALL'>('OFF');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const queueRef = useRef(queue);
  const isShuffleRef = useRef(isShuffle);
  const repeatModeRef = useRef(repeatMode);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { isShuffleRef.current = isShuffle; }, [isShuffle]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  const initWebAudio = () => {
    if (audioCtxRef.current || !audioRef.current) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createMediaElementSource(audioRef.current);
      const gain = ctx.createGain();
      source.connect(gain);
      gain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      gainNodeRef.current = gain;
      gain.gain.value = volume;
    } catch (e) {
      console.error('Web Audio init failed', e);
    }
  };

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous"; // Needed for Web Audio API with external URLs
    (audio as any).playsInline = true;        // Help iOS Safari with background play
    document.body.appendChild(audio); // BẮT BUỘC để Android hiện Media Controls ở thanh thông báo
    audioRef.current = audio;

    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEndedLocal = () => {
      if (repeatModeRef.current === 'ONE') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        nextSong();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEndedLocal);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEndedLocal);
      document.body.removeChild(audio);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
    if (audioRef.current) {
      // Keep internal volume at 1 and use gain node for boosting
      audioRef.current.volume = volume > 1 ? 1 : volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  const safePlay = async () => {
    if (audioRef.current) {
      initWebAudio();
      if (audioCtxRef.current?.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      try {
        await audioRef.current.play();
      } catch (e) {}
    }
  };

  const playSong = (song: Song, newQueue: Song[] = []) => {
    if (newQueue.length > 0) {
      setQueue(newQueue);
      setCurrentIndex(newQueue.findIndex(s => s.id === song.id));
    } else {
      const currentQueue = queueRef.current;
      const idx = currentQueue.findIndex(s => s.id === song.id);
      if (idx !== -1) {
        setCurrentIndex(idx);
      } else {
        setQueue([song]);
        setCurrentIndex(0);
      }
    }
    
    if (audioRef.current) {
      audioRef.current.src = song.file_url;
      safePlay();
      setCurrentSong(song);
      setIsPlaying(true);
      setInsertOffset(1);
      
      // Setup Media Session for background play on Safari/Mobile
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: song.title,
          artist: song.artist,
          album: 'BSound',
          artwork: song.image_url ? [
            { src: song.image_url, sizes: '512x512', type: 'image/jpeg' },
            { src: song.image_url, sizes: '512x512', type: 'image/png' }
          ] : []
        });
        navigator.mediaSession.playbackState = 'playing';
      }
    }
  };

  const addToQueue = (song: Song) => {
    const currentQueue = [...queueRef.current];
    const existsIdx = currentQueue.findIndex(s => s.id === song.id);
    
    // If it exists in the queue and is after the current index, we might not want to add it again, 
    // but the user wants to play it next. So we remove it from the old position and insert it next.
    if (existsIdx !== -1) {
      if (existsIdx === currentIndexRef.current) return; // Already playing
      currentQueue.splice(existsIdx, 1);
      if (existsIdx < currentIndexRef.current) {
        setCurrentIndex(prev => prev - 1);
      }
    }
    
    // Insert at currentIndex + insertOffset
    const insertIdx = currentIndexRef.current + insertOffset;
    currentQueue.splice(insertIdx, 0, song);
    setQueue(currentQueue);
    setInsertOffset(prev => prev + 1);
  };

  const removeFromQueue = (index: number) => {
    if (index === currentIndexRef.current) return; // Cannot remove playing song
    const currentQueue = [...queueRef.current];
    currentQueue.splice(index, 1);
    setQueue(currentQueue);
    if (index < currentIndexRef.current) {
      setCurrentIndex(prev => prev - 1);
    }
    if (index > currentIndexRef.current && index < currentIndexRef.current + insertOffset) {
      setInsertOffset(prev => prev - 1);
    }
  };

  // Setup Media Session Handlers
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => { safePlay(); setIsPlaying(true); navigator.mediaSession.playbackState = 'playing'; });
      navigator.mediaSession.setActionHandler('pause', () => { if (audioRef.current) audioRef.current.pause(); setIsPlaying(false); navigator.mediaSession.playbackState = 'paused'; });
      navigator.mediaSession.setActionHandler('previoustrack', () => prevSong());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextSong());
    }
  }, []);

  const nextSong = () => {
    const q = queueRef.current;
    if (q.length === 0) return;
    let nextIdx = currentIndexRef.current + 1;
    if (isShuffleRef.current) {
      nextIdx = Math.floor(Math.random() * q.length);
    } else if (nextIdx >= q.length) {
      if (repeatModeRef.current === 'ALL') nextIdx = 0;
      else { setIsPlaying(false); return; }
    }
    setCurrentIndex(nextIdx);
    playSong(q[nextIdx]);
  };

  const prevSong = () => {
    const q = queueRef.current;
    if (q.length === 0) return;
    let prevIdx = currentIndexRef.current - 1;
    if (prevIdx < 0) {
      if (repeatModeRef.current === 'ALL') prevIdx = q.length - 1;
      else return;
    }
    setCurrentIndex(prevIdx);
    playSong(q[prevIdx]);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
      } else {
        safePlay();
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleRepeat = () => {
    const modes: ('OFF' | 'ONE' | 'ALL')[] = ['OFF', 'ONE', 'ALL'];
    setRepeatMode(modes[(modes.indexOf(repeatMode) + 1) % 3]);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const setSleepTimer = (minutes: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (minutes === 0) { setRemainingTime(null); return; }
    let seconds = Math.floor(minutes * 60);
    setRemainingTime(seconds);
    timerRef.current = setInterval(() => {
      seconds -= 1;
      setRemainingTime(seconds);
      if (seconds <= 0) {
        if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); }
        clearInterval(timerRef.current!);
        setRemainingTime(null);
      }
    }, 1000);
  };

  return (
    <PlayerContext.Provider value={{
      currentSong, isPlaying, playSong, addToQueue, removeFromQueue, togglePlay,
      playbackSpeed, setPlaybackSpeed, volume, setVolume,
      progress, duration, seek, setSleepTimer, remainingTime,
      queue, currentIndex, isShuffle, toggleShuffle, repeatMode, toggleRepeat, nextSong, prevSong
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
};
