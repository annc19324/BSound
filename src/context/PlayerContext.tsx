'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';

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
  playMode: 'NORMAL' | 'SHUFFLE' | 'REPEAT_ONE';
  togglePlayMode: () => void;
  nextUpQueue: Song[];
  removeFromNextUp: (index: number) => void;
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
  const [playMode, setPlayMode] = useState<'NORMAL' | 'SHUFFLE' | 'REPEAT_ONE'>('NORMAL');
  const [nextUpQueue, setNextUpQueue] = useState<Song[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<any>(null);

  const queueRef = useRef(queue);
  const playModeRef = useRef(playMode);
  const currentIndexRef = useRef(currentIndex);
  const nextUpQueueRef = useRef(nextUpQueue);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => {
    if (playMode !== undefined) playModeRef.current = playMode;
  }, [playMode]);
  useEffect(() => { nextUpQueueRef.current = nextUpQueue; }, [nextUpQueue]);

  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  // Load saved preferences on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('bsound_play_mode');
    if (savedMode === 'NORMAL' || savedMode === 'SHUFFLE' || savedMode === 'REPEAT_ONE') {
      setPlayMode(savedMode as 'NORMAL' | 'SHUFFLE' | 'REPEAT_ONE');
    } else {
      // Migrate old settings if exist
      const savedShuffle = localStorage.getItem('bsound_shuffle');
      if (savedShuffle === 'true') setPlayMode('SHUFFLE');
    }
  }, []);

  // Manage screen wake lock when playing state changes
  useEffect(() => {
    const handleWakeLock = async () => {
      try {
        if (isPlaying) {
          if (Capacitor.isNativePlatform()) {
            await KeepAwake.keepAwake();
          } else if ('wakeLock' in navigator) {
            wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          }
        } else {
          if (Capacitor.isNativePlatform()) {
            await KeepAwake.allowSleep();
          } else if (wakeLockRef.current) {
            await wakeLockRef.current.release();
            wakeLockRef.current = null;
          }
        }
      } catch (err) {
        console.error('Wake lock error:', err);
      }
    };

    handleWakeLock();

    // The browser releases wake locks when the tab is hidden, so we must re-acquire it when visible.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying) {
        handleWakeLock();
      }
    };

    if (!Capacitor.isNativePlatform()) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (!Capacitor.isNativePlatform()) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      // When unmounting, release it if possible
      if (!Capacitor.isNativePlatform() && wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, [isPlaying]);

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
      if (playModeRef.current === 'REPEAT_ONE') {
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
    setNextUpQueue(prev => [...prev, song]);
  };

  const removeFromNextUp = (index: number) => {
    setNextUpQueue(prev => prev.filter((_, i) => i !== index));
  };

  const removeFromQueue = (index: number) => {
    if (index === currentIndexRef.current) return; // Cannot remove playing song
    const currentQueue = [...queueRef.current];
    currentQueue.splice(index, 1);
    setQueue(currentQueue);
    if (index < currentIndexRef.current) {
      setCurrentIndex(prev => prev - 1);
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

  const nextSong = async () => {
    const q = queueRef.current;
    if (q.length === 0) return;

    if (playModeRef.current === 'REPEAT_ONE') {
      if (audioRef.current && currentIndexRef.current >= 0) {
        audioRef.current.currentTime = 0;
        safePlay();
        setIsPlaying(true);
      }
      return;
    }

    // NextUp has priority
    if (nextUpQueueRef.current.length > 0) {
      const nextUp = [...nextUpQueueRef.current];
      const nextSongToPlay = nextUp.shift()!;
      setNextUpQueue(nextUp);
      
      const newQ = [...q];
      newQ.splice(currentIndexRef.current + 1, 0, nextSongToPlay);
      setQueue(newQ);
      setCurrentIndex(currentIndexRef.current + 1);
      
      if (audioRef.current) {
        audioRef.current.src = nextSongToPlay.file_url;
        safePlay();
        setCurrentSong(nextSongToPlay);
        setIsPlaying(true);
      }
      return;
    }

    let nextIdx = currentIndexRef.current + 1;
    if (playModeRef.current === 'SHUFFLE') {
      nextIdx = Math.floor(Math.random() * q.length);
    } 

    if (nextIdx >= q.length) {
      try {
        const res = await fetch('/api/songs');
        if (res.ok) {
           const songs = await res.json();
           const unplayed = songs.filter((s: Song) => !q.some(qs => qs.id === s.id));
           const pool = unplayed.length > 0 ? unplayed : songs;
           if (pool.length > 0) {
             const randomSong = pool[Math.floor(Math.random() * pool.length)];
             const newQ = [...q, randomSong];
             setQueue(newQ);
             setCurrentIndex(newQ.length - 1);
             if (audioRef.current) {
                audioRef.current.src = randomSong.file_url;
                safePlay();
                setCurrentSong(randomSong);
                setIsPlaying(true);
             }
             return;
           }
        }
      } catch (e) {
         console.error(e);
      }
      setIsPlaying(false);
      return;
    }

    setCurrentIndex(nextIdx);
    const song = q[nextIdx];
    if (audioRef.current) {
      audioRef.current.src = song.file_url;
      safePlay();
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  const prevSong = () => {
    const q = queueRef.current;
    if (q.length === 0) return;
    let prevIdx = currentIndexRef.current - 1;
    if (prevIdx < 0) {
      return;
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

  const togglePlayMode = () => {
    setPlayMode(prev => {
      const modes: ('NORMAL' | 'SHUFFLE' | 'REPEAT_ONE')[] = ['NORMAL', 'SHUFFLE', 'REPEAT_ONE'];
      const next = modes[(modes.indexOf(prev) + 1) % 3];
      localStorage.setItem('bsound_play_mode', next);
      return next;
    });
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
      currentSong, isPlaying, playSong, addToQueue, removeFromQueue, nextUpQueue, removeFromNextUp, togglePlay,
      playbackSpeed, setPlaybackSpeed, volume, setVolume,
      progress, duration, seek, setSleepTimer, remainingTime,
      queue, currentIndex, playMode, togglePlayMode, nextSong, prevSong
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
