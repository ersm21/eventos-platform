'use client';

import { useEffect, useRef, useState } from 'react';

const MUSIC_STORAGE_KEY = 'sm_events_music_enabled';

export default function AmbientMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const manualPauseRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [wasBlocked, setWasBlocked] = useState(false);

  useEffect(() => {
    const audio = new Audio('/audio/sm-ambient.mp3');
    const savedPreference = localStorage.getItem(MUSIC_STORAGE_KEY);

    audio.loop = true;
    audio.volume = 0.14;
    audioRef.current = audio;
    manualPauseRef.current = savedPreference === 'false';
    setIsReady(true);

    const startMusic = async () => {
      if (manualPauseRef.current) return;

      try {
        await audio.play();
        setIsPlaying(true);
        setWasBlocked(false);
        localStorage.setItem(MUSIC_STORAGE_KEY, 'true');
      } catch {
        setIsPlaying(false);
        setWasBlocked(true);
      }
    };

    const startAfterInteraction = async () => {
      if (manualPauseRef.current || !audio.paused) return;
      await startMusic();
    };

    startMusic();

    window.addEventListener('click', startAfterInteraction);
    window.addEventListener('touchstart', startAfterInteraction);
    window.addEventListener('keydown', startAfterInteraction);

    return () => {
      window.removeEventListener('click', startAfterInteraction);
      window.removeEventListener('touchstart', startAfterInteraction);
      window.removeEventListener('keydown', startAfterInteraction);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleMusic = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    try {
      if (isPlaying) {
        manualPauseRef.current = true;
        audio.pause();
        setIsPlaying(false);
        setWasBlocked(false);
        localStorage.setItem(MUSIC_STORAGE_KEY, 'false');
        return;
      }

      manualPauseRef.current = false;
      await audio.play();
      setIsPlaying(true);
      setWasBlocked(false);
      localStorage.setItem(MUSIC_STORAGE_KEY, 'true');
    } catch {
      setIsPlaying(false);
      setWasBlocked(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleMusic}
      disabled={!isReady}
      aria-label={isPlaying ? 'Pausar música ambiente' : 'Activar música ambiente'}
      style={{
        position: 'fixed',
        left: 18,
        bottom: 18,
        zIndex: 100,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '11px 14px',
        borderRadius: 999,
        border: '1px solid rgba(250, 204, 21, 0.24)',
        background: 'rgba(2, 6, 23, 0.82)',
        color: '#fde68a',
        fontWeight: 900,
        cursor: isReady ? 'pointer' : 'not-allowed',
        boxShadow: '0 14px 30px rgba(0,0,0,0.28)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <span>{isPlaying ? '⏸' : '♪'}</span>
      <span>
        {isPlaying
          ? 'Pausar ambiente'
          : wasBlocked
            ? 'Activar ambiente'
            : 'Ambiente'}
      </span>
    </button>
  );
}
