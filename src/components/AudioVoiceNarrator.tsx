import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Pause, Play, Square, FastForward, RotateCcw } from 'lucide-react';

interface AudioVoiceNarratorProps {
  textToSpeak: string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Converts mathematical formulas and symbols into natural Russian spoken text.
 */
function cleanMathForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\implies/g, ' следовательно, ')
    .replace(/\\cdot/g, ' умножить на ')
    .replace(/\\times/g, ' умножить на ')
    .replace(/\\pm/g, ' плюс-минус ')
    .replace(/\\sqrt\{([^}]+)\}/g, ' корень из $1 ')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, ' дробь $1 делить на $2 ')
    .replace(/x\^2/g, ' икс в квадрате ')
    .replace(/a\^2/g, ' а в квадрате ')
    .replace(/b\^2/g, ' б в квадрате ')
    .replace(/c\^2/g, ' ц в квадрате ')
    .replace(/\^2/g, ' в квадрате ')
    .replace(/\\mathbb\{N\}/g, ' множество натуральных чисел ')
    .replace(/\\sin\^2/g, ' синус в квадрате ')
    .replace(/\\cos\^2/g, ' косинус в квадрате ')
    .replace(/\\sin/g, ' синус ')
    .replace(/\\cos/g, ' косинус ')
    .replace(/\\tan/g, ' тангенс ')
    .replace(/\\approx/g, ' приближенно равно ')
    .replace(/\\neq/g, ' не равно ')
    .replace(/\\le/g, ' меньше либо равно ')
    .replace(/\\ge/g, ' больше либо равно ')
    .replace(/\\in/g, ' принадлежит ')
    .replace(/\\alpha/g, ' альфа ')
    .replace(/\\beta/g, ' бета ')
    .replace(/\\pi/g, ' пи ')
    .replace(/\$/g, ' ')
    .replace(/[{}]/g, ' ')
    .replace(/\\/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const AudioVoiceNarrator: React.FC<AudioVoiceNarratorProps> = ({
  textToSpeak,
  label = 'Озвучить объяснение',
  className = '',
  size = 'md',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [rate, setRate] = useState<number>(1.0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
    }
  }, []);

  const stopPlayback = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  // Cleanup on unmount or text change
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [textToSpeak, stopPlayback]);

  if (!isSupported) {
    return null;
  }

  const handleTogglePlay = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    if (isPlaying && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    // Start fresh playback
    window.speechSynthesis.cancel();

    const spokenText = cleanMathForSpeech(textToSpeak);
    if (!spokenText) return;

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utteranceRef.current = utterance;

    // Pick Russian voice if available
    const voices = window.speechSynthesis.getVoices();
    const ruVoice = voices.find((v) => v.lang.startsWith('ru') || v.name.includes('Russian'));
    if (ruVoice) {
      utterance.voice = ruVoice;
    }
    utterance.lang = 'ru-RU';
    utterance.rate = rate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const cycleRate = () => {
    const rates = [1.0, 1.25, 0.85];
    const nextIdx = (rates.indexOf(rate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setRate(newRate);
    if (isPlaying) {
      stopPlayback();
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 p-1 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 ${className}`}
    >
      <button
        type="button"
        onClick={handleTogglePlay}
        className={`flex items-center gap-1.5 rounded-lg font-semibold transition-all ${
          size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
        } ${
          isPlaying
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
            : 'hover:bg-indigo-500/20 text-indigo-200'
        }`}
        title={isPlaying ? (isPaused ? 'Возобновить' : 'Пауза') : 'Прослушать голосовое объяснение'}
      >
        {isPlaying && !isPaused ? (
          <>
            <Pause className="w-3.5 h-3.5 animate-pulse" />
            <span className="flex items-center gap-0.5">
              <span className="w-1 h-3 bg-white rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
          </>
        ) : isPlaying && isPaused ? (
          <>
            <Play className="w-3.5 h-3.5 text-amber-300" />
            <span>Пауза</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{label}</span>
          </>
        )}
      </button>

      {isPlaying && (
        <button
          type="button"
          onClick={stopPlayback}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Остановить"
        >
          <Square className="w-3 h-3" />
        </button>
      )}

      <button
        type="button"
        onClick={cycleRate}
        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-slate-400 hover:text-indigo-300 transition-colors"
        title="Скорость речи"
      >
        {rate}x
      </button>
    </div>
  );
};
