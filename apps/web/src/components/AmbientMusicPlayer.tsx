'use client';

import { useEffect, useRef, useState } from 'react';

export default function AmbientMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const audio = new Audio('/audio/sm-ambient.mp3');
    audio.loop = true;
    audio.volume = 0.12;
    audioRef.current = audio;
    setIsReady(true);

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleMusic = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        localStorage.setItem('sm_events_music_enabled', 'false');
        return;
      }

      await audio.play();
      setIsPlaying(true);
      localStorage.setItem('sm_events_music_enabled', 'true');
    } catch {
      setIsPlaying(false);
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
        right: 18,
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
      <span>{isPlaying ? 'Pausar ambiente' : 'Activar ambiente'}</span>
    </button>
  );
}
