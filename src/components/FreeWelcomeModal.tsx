import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Heart,
  BookOpen,
  CheckCircle2,
  X,
  Layers,
  Scale,
  Zap,
  Printer,
  Compass,
  ArrowRight
} from 'lucide-react';

interface FreeWelcomeModalProps {
  onOpenGuide: () => void;
}

const STORAGE_KEY = 'mathroots_free_welcome_v1';

export const FreeWelcomeModal: React.FC<FreeWelcomeModalProps> = ({ onOpenGuide }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        // Small timeout for smooth entrance animation
        const timer = setTimeout(() => setIsOpen(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleClose = () => {
    try {
      if (dontShowAgain) {
        localStorage.setItem(STORAGE_KEY, 'true');
      }
    } catch {
      // ignore
    }
    setIsOpen(false);
  };

  const handleOpenGuideAndClose = () => {
    handleClose();
    onOpenGuide();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0a0d18] border border-indigo-500/40 rounded-3xl shadow-2xl shadow-indigo-950/80 overflow-hidden my-6 text-slate-100">
        {/* Glow decoration */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative p-6 sm:p-7 border-b border-white/[0.08] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
              <Sparkles className="w-6 h-6 text-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  math.everty.ru • 100% БЕСПЛАТНО
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Добро пожаловать в MathRoots!
              </h2>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          {/* Inspiring Statement */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-[#0c1020] border border-indigo-500/30">
            <p className="text-slate-200 leading-relaxed italic text-sm">
              «Книга природы написана на языке математики, а её буквы — геометрические фигуры и фундаментальные законы равенства.»
            </p>
            <div className="text-right text-[11px] text-indigo-300 font-semibold mt-1.5">
              — Галилео Галилей
            </div>
          </div>

          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p className="text-sm font-semibold text-white">
              Мы создали MathRoots с одной главной целью: сделать глубокое понимание математики доступным каждому человеку без преград, подписок и заучивания формул.
            </p>
            <p className="text-xs text-slate-400">
              Здесь любая сложная задача раскладывается до неделимых корней и фундаментальных аксиом (слой 0), а математические действия проверяются через физическое равновесие на чашечных весах.
            </p>
          </div>

          {/* Unlocked Features Highlights */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Все возможности платформы открыты для вас без ограничений:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">AI Декомпозитор корней</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Разбор любых уравнений на граф понятий</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">Интерактивные весы</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Наглядное сохранение баланса равенства</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">9 Визуальных лабораторий</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Интерактивные симуляции и геометрия</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">Шпаргалки и печать A4</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Конспекты KaTeX без водяных знаков</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 sm:p-6 border-t border-white/[0.08] bg-[#070912] flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Больше не показывать при входе</span>
          </label>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleOpenGuideAndClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 text-xs font-bold border border-white/[0.1] transition-colors flex items-center justify-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Инструкция</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-indigo-500 hover:from-emerald-500 hover:to-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-950/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Погрузиться в математику</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
