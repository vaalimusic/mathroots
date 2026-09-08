import React, { useState } from 'react';
import { Sparkles, ArrowRight, X, Compass, CheckCircle2, TreeDeciduous } from 'lucide-react';

interface FirstUsageHeroProps {
  onSelectProblem: (problem: string) => void;
  onDismiss: () => void;
}

export const FirstUsageHero: React.FC<FirstUsageHeroProps> = ({
  onSelectProblem,
  onDismiss,
}) => {
  const [inputValue, setInputValue] = useState('2x + 4 = 10');

  const sampleQueries = [
    { label: '2x + 4 = 10', subtitle: 'Эталон ТЗ: линейное уравнение' },
    { label: '1/2 + 1/3', subtitle: 'Сложение дробей с разным знаменателем' },
    { label: 'x² - 5x + 6 = 0', subtitle: 'Квадратное уравнение (теорема Виета и дискриминант)' },
    { label: 'a² + b² = c²', subtitle: 'Теорема Пифагора и площади квадратов' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSelectProblem(inputValue.trim());
    }
  };

  return (
    <div
      id="first-usage-hero"
      className="absolute inset-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md transition-all select-none"
    >
      <div className="relative w-full max-w-xl bg-[#0d101d]/95 border border-white/[0.12] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/90 text-center">
        {/* Dismiss button */}
        <button
          id="btn-dismiss-hero"
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/[0.08] transition-colors"
          title="Свернуть на холст"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Minimalist Tech Tree Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-5">
          <TreeDeciduous className="w-4 h-4 text-emerald-400" />
          <span>Математическое дерево знаний</span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Что хочешь понять?
        </h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
          Любая сложная математическая задача состоит из простых элементов, а те — из неделимого фундамента счета.
        </p>

        {/* Main Input Field */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative flex items-center bg-[#07080f] rounded-2xl border-2 border-indigo-500/50 focus-within:border-indigo-400 shadow-inner p-1.5 transition-all">
            <input
              id="hero-problem-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Например: 2x + 4 = 10"
              className="w-full bg-transparent px-4 py-3 text-base sm:text-lg font-mono text-white placeholder-slate-500 focus:outline-none"
              autoFocus
            />
            <button
              id="btn-hero-submit"
              type="submit"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:brightness-110 active:scale-95 transition-all shrink-0"
            >
              <span>Разобрать</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick Sample Buttons */}
        <div className="text-left">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Попробовать пример:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sampleQueries.map((sample, idx) => (
              <button
                key={idx}
                id={`sample-query-${idx}`}
                onClick={() => onSelectProblem(sample.label)}
                className="flex flex-col text-left p-3 rounded-xl bg-white/[0.04] hover:bg-indigo-600/15 border border-white/[0.06] hover:border-indigo-500/40 transition-all group"
              >
                <div className="text-sm font-bold font-mono text-slate-200 group-hover:text-white transition-colors">
                  {sample.label}
                </div>
                <div className="text-[11px] text-slate-400 group-hover:text-slate-300 truncate">
                  {sample.subtitle}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
