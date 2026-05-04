'use client';

import { useEffect, useRef, useState } from 'react';

const MUSIC_STORAGE_KEY = 'sm_events_music_enabled';
const MUSIC_VOLUME_KEY = 'sm_events_music_volume';
const MUSIC_TIME_KEY = 'sm_events_music_current_time';
const MUSIC_RANDOMIZED_KEY = 'sm_events_music_randomized_once';

export default function AmbientMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const manualPauseRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [wasBlocked, setWasBlocked] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [volume, setVolume] = useState(14);

  useEffect(() => {
    const audio = new Audio('/audio/sm-ambient.mp3');
    const savedPreference = localStorage.getItem(MUSIC_STORAGE_KEY);
    const savedVolume = Number(localStorage.getItem(MUSIC_VOLUME_KEY) || 14);
    const safeVolume = Number.isFinite(savedVolume)
      ? Math.min(100, Math.max(0, savedVolume))
      : 14;

    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = safeVolume / 100;

    const restorePlaybackPosition = () => {
      const savedTime = Number(localStorage.getItem(MUSIC_TIME_KEY) || 0);
      const alreadyRandomized = localStorage.getItem(MUSIC_RANDOMIZED_KEY) === 'true';

      if (Number.isFinite(savedTime) && savedTime > 0 && savedTime < audio.duration - 2) {
        audio.currentTime = savedTime;
        return;
      }

      if (!alreadyRandomized && Number.isFinite(audio.duration) && audio.duration > 60) {
        const maxStart = Math.max(30, audio.duration - 30);
        const randomStart = Math.floor(Math.random() * maxStart);
        audio.currentTime = randomStart;
        localStorage.setItem(MUSIC_RANDOMIZED_KEY, 'true');
        localStorage.setItem(MUSIC_TIME_KEY, String(randomStart));
      }
    };

    audio.addEventListener('loadedmetadata', restorePlaybackPosition);

    const savePlaybackPosition = () => {
      if (Number.isFinite(audio.currentTime) && audio.currentTime > 0) {
        localStorage.setItem(MUSIC_TIME_KEY, String(audio.currentTime));
      }
    };

    audio.addEventListener('timeupdate', savePlaybackPosition);

    audioRef.current = audio;
    manualPauseRef.current = savedPreference === 'false';

    setVolume(safeVolume);
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
    window.addEventListener('scroll', startAfterInteraction, { once: false });

    return () => {
      window.removeEventListener('click', startAfterInteraction);
      window.removeEventListener('touchstart', startAfterInteraction);
      window.removeEventListener('keydown', startAfterInteraction);
      window.removeEventListener('scroll', startAfterInteraction);

      if (Number.isFinite(audio.currentTime) && audio.currentTime > 0) {
        localStorage.setItem(MUSIC_TIME_KEY, String(audio.currentTime));
      }

      audio.removeEventListener('loadedmetadata', restorePlaybackPosition);
      audio.removeEventListener('timeupdate', savePlaybackPosition);
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
        if (Number.isFinite(audio.currentTime) && audio.currentTime > 0) {
          localStorage.setItem(MUSIC_TIME_KEY, String(audio.currentTime));
        }

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

  const updateVolume = async (nextVolume: number) => {
    const safeVolume = Math.min(100, Math.max(0, nextVolume));
    const audio = audioRef.current;

    setVolume(safeVolume);
    localStorage.setItem(MUSIC_VOLUME_KEY, String(safeVolume));

    if (audio) {
      audio.volume = safeVolume / 100;
    }

    if (audio && audio.paused && !manualPauseRef.current && safeVolume > 0) {
      try {
        await audio.play();
        setIsPlaying(true);
        setWasBlocked(false);
        localStorage.setItem(MUSIC_STORAGE_KEY, 'true');
      } catch {
        setWasBlocked(true);
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: 14,
        bottom: 92,
        zIndex: 210,
        display: 'grid',
        placeItems: isExpanded ? undefined : 'center',
        gap: isExpanded ? 8 : 0,
        padding: isExpanded ? 12 : 0,
        borderRadius: isExpanded ? 18 : 999,
        border: '1px solid rgba(250, 204, 21, 0.24)',
        background: isExpanded ? 'rgba(2, 6, 23, 0.82)' : 'rgba(2, 6, 23, 0.42)',
        opacity: isExpanded ? 1 : 0.78,
        color: '#fde68a',
        boxShadow: '0 14px 30px rgba(0,0,0,0.28)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        minWidth: isExpanded ? 210 : 48,
        width: isExpanded ? 210 : 48,
        maxWidth: isExpanded ? 210 : 48,
        height: isExpanded ? 'auto' : 48,
        minHeight: isExpanded ? 'auto' : 48,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={toggleMusic}
        disabled={!isReady}
        aria-label={isPlaying ? 'Pausar música ambiente' : 'Activar música ambiente'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'space-between' : 'center',
          gap: isExpanded ? 8 : 0,
          width: '100%',
          padding: 0,
          border: 'none',
          background: 'transparent',
          color: '#fde68a',
          fontWeight: 900,
          cursor: isReady ? 'pointer' : 'not-allowed',
        }}
      >
        <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
              lineHeight: 1,
              fontSize: isExpanded ? 13 : 22,
            }}
          >
            {isExpanded ? (isPlaying ? '⏸ Pausar ambiente' : wasBlocked ? '♪ Activar ambiente' : '♪ Ambiente') : '♪'}
          </span>
        {isExpanded && (
          <span
            style={{
              color: isPlaying ? '#86efac' : '#fbbf24',
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            {isPlaying ? 'ON' : 'OFF'}
          </span>
        )}
      </button>

      {isExpanded && (
        <label
        style={{
          display: 'grid',
          gap: 5,
          color: '#cbd5e1',
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        Volumen {volume}%
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(event) => updateVolume(Number(event.target.value))}
          style={{
            width: '100%',
            accentColor: '#fbbf24',
            cursor: 'pointer',
          }}
        />
        </label>
      )}

      {isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          style={{
            border: '1px solid rgba(250, 204, 21, 0.18)',
            background: 'rgba(15, 23, 42, 0.5)',
            color: '#fde68a',
            borderRadius: 999,
            padding: '6px 8px',
            fontSize: 11,
            fontWeight: 900,
            cursor: 'pointer',
          }}
        >
          Plegar
        </button>
      )}
    </div>
  );
}
