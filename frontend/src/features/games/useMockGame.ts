import { useEffect, useState } from 'react';
import { MOCK_DRIVE } from './mockDrive';

/** The owner is keyed by game ID: changing games disposes the timer and resets playback. */
export function useMockGame(enabled: boolean) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const finished = step === MOCK_DRIVE.length - 1;

  useEffect(() => {
    if (!enabled || !playing || finished) return;
    const timer = window.setInterval(() => {
      setStep((current) => Math.min(current + 1, MOCK_DRIVE.length - 1));
    }, 3500 / speed);
    return () => window.clearInterval(timer);
  }, [enabled, playing, finished, speed]);

  useEffect(() => {
    if (!enabled || finished) setPlaying(false);
  }, [enabled, finished]);

  return {
    step,
    playing: enabled && playing && !finished,
    speed,
    finished,
    frame: MOCK_DRIVE[step],
    plays: MOCK_DRIVE.slice(0, step + 1),
    setSpeed,
    togglePlay: () => setPlaying((current) => !current),
    next: () => {
      setPlaying(false);
      setStep((current) => Math.min(current + 1, MOCK_DRIVE.length - 1));
    },
    restart: () => {
      setPlaying(false);
      setStep(0);
    },
    seek: (value: number) => {
      setPlaying(false);
      setStep(Math.max(0, Math.min(value, MOCK_DRIVE.length - 1)));
    },
  };
}
