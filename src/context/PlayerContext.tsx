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
      const idx = queue.findIndex(s => s.id === song.id);
      if (idx !== -1) setCurrentIndex(idx);
    }
    
    if (audioRef.current) {
      audioRef.current.src = song.file_url;
      safePlay();
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

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
      if (isPlaying) audioRef.current.pause();
      else safePlay();
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
      currentSong, isPlaying, playSong, togglePlay,
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
