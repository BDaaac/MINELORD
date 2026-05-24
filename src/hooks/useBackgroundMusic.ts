import { useCallback, useEffect, useRef, useState } from "react";
import { PhaseResult, Screen } from "../game/types";

const DEFAULT_VOLUME = 0.25;
const BOSS_VOLUME = 0.5;
const WIN_VOLUME = 0.1;
const STORAGE_KEY = "minelord-audio-muted";

function readStoredMute() {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

function stopAudio(audio: HTMLAudioElement) {
  audio.pause();
  audio.currentTime = 0;
}

export function useBackgroundMusic(screen: Screen, result: PhaseResult) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userArmedRef = useRef(false);
  const fadeRef = useRef<number | null>(null);
  const [muted, setMuted] = useState(readStoredMute);

  useEffect(() => {
    const audio = new Audio("/assets/audio/background.m4a");
    audio.loop = true;
    audio.volume = DEFAULT_VOLUME;
    audio.muted = muted;
    audioRef.current = audio;

    return () => {
      if (fadeRef.current !== null) window.cancelAnimationFrame(fadeRef.current);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
    localStorage.setItem(STORAGE_KEY, String(muted));
    if (!muted && userArmedRef.current && audio.paused && result !== "lose") {
      void audio.play().catch(() => undefined);
    }
  }, [muted, result]);

  const playAfterInteraction = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || userArmedRef.current) return;
    userArmedRef.current = true;
    if (!muted && result !== "lose") {
      void audio.play().catch(() => undefined);
    }
  }, [muted, result]);

  useEffect(() => {
    window.addEventListener("pointerdown", playAfterInteraction, { once: true });
    window.addEventListener("keydown", playAfterInteraction, { once: true });
    return () => {
      window.removeEventListener("pointerdown", playAfterInteraction);
      window.removeEventListener("keydown", playAfterInteraction);
    };
  }, [playAfterInteraction]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (screen === "result" && result === "lose") {
      if (fadeRef.current !== null) window.cancelAnimationFrame(fadeRef.current);
      stopAudio(audio);
      return;
    }

    const target = screen === "boss" ? BOSS_VOLUME : screen === "result" && result === "win" ? WIN_VOLUME : DEFAULT_VOLUME;
    const start = audio.volume;
    const startedAt = performance.now();
    const duration = screen === "boss" || result === "win" ? 850 : 350;

    if (fadeRef.current !== null) window.cancelAnimationFrame(fadeRef.current);

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      audio.volume = start + (target - start) * progress;
      if (progress < 1) {
        fadeRef.current = window.requestAnimationFrame(tick);
      }
    };

    fadeRef.current = window.requestAnimationFrame(tick);

    if (userArmedRef.current && !muted && audio.paused) {
      void audio.play().catch(() => undefined);
    }
  }, [screen, result, muted]);

  const toggleMuted = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      if (!next) {
        userArmedRef.current = true;
        const audio = audioRef.current;
        if (audio && result !== "lose") void audio.play().catch(() => undefined);
      }
      return next;
    });
  }, [result]);

  return { muted, toggleMuted };
}
