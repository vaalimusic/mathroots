import React, { useState } from 'react';
import {
  Sparkles,
  ArrowDown,
  CheckCircle2,
  HelpCircle,
  Play,
  RotateCcw,
  Layers,
  Check,
  Zap,
  BookOpen
} from 'lucide-react';
import { MathFormula } from './MathFormula';

export interface TaskGrowthCardProps {
  growthStage: number; // 0: initial task card, 1: step 1 (2x=6), 2: step 2 (x=3), 3: verified (10=10), 4: full foundation
  onAdvanceGrowth: () => void;
  onResetGrowth: () => void;
  onSolveSelf: () => void;
  onFullDecompose: () => void;
  onLaunchWhy: () => void;
  onLaunchFocusMode: () => void;
}

export const TaskGrowthCard: React.FC<TaskGrowthCardProps> = ({
  growthStage,
  onAdvanceGrowth,
  onResetGrowth,
  onSolveSelf,
  onFullDecompose,
  onLaunchWhy,
  onLaunchFocusMode,
}) => {
  const isComplete = growthStage >= 3;

  return (
    <div
      id="task-growth-card"
      className="bg-[#0b0e18]/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-indigo-950/40 text-white max-w-sm sm:max-w-md w-full select-none"
    >
      {/* Top Header Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] uppercase tracking-widest font-extrabold text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>Задача</span>
        </span>

        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400 font-mono">
            {growthStage === 0
              ? 'Старт'
              : growthStage === 1
              ? 'Шаг 1 из 2'
              : growthStage === 2
              ? 'Шаг 2 из 2'
              : 'Решено ✓'}
          </span>
          {growthStage > 0 && (
            <button
              onClick={onResetGrowth}
              className="p-1 text-slate-500 hover:text-white rounded-md hover:bg-white/[0.06] transition-colors ml-1"
              title="Сбросить анимацию дерева"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Equation Display */}
      <div className="text-center my-3">
        <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight drop-shadow-sm">
          2x + 4 = 10
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Цель: найти значение неизвестного x
        </p>
      </div>

      {/* Current Animated Step Highlights */}
      {growthStage >= 1 && (
        <div className="my-3 p-3 bg-[#060811] rounded-xl border border-white/[0.08] space-y-2 text-xs font-mono">
          {/* Step 1 */}
          <div className="flex items-center justify-between text-slate-200">
            <span className="text-indigo-400 font-semibold">1. Вычесть 4:</span>
            <span className="text-emerald-300 font-bold">2x = 6</span>
          </div>

          {/* Step 2 */}
          {growthStage >= 2 && (
            <div className="flex items-center justify-between text-slate-200 pt-1 border-t border-white/[0.06]">
              <span className="text-indigo-400 font-semibold">2. Разделить на 2:</span>
              <span className="text-emerald-300 font-bold">x = 3</span>
            </div>
          )}

          {/* Verification */}
          {growthStage >= 3 && (
            <div className="flex items-center justify-between text-emerald-400 pt-1 border-t border-white/[0.06]">
              <span>Проверка: 2(3)+4=10</span>
              <span className="font-bold">10 = 10 ✓</span>
            </div>
          )}
        </div>
      )}

      {/* Verification Success Box */}
      {isComplete && (
        <div className="my-3 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-start gap-2.5 animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold text-emerald-300">Решение подтверждено!</div>
            <div className="text-emerald-400/90 text-[11px] leading-relaxed">
              2 × 3 + 4 = 6 + 4 = 10. Тождество доказано.
            </div>
          </div>
        </div>
      )}

      {/* Main Buttons (Разобрать / Решить самому) */}
      <div className="space-y-2 pt-2 border-t border-white/[0.08]">
        {!isComplete ? (
          <div className="flex items-center gap-2">
            <button
              id="btn-advance-growth"
              onClick={onAdvanceGrowth}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{growthStage === 0 ? 'Разобрать' : 'Следующий шаг'}</span>
            </button>

            <button
              id="btn-solve-self"
              onClick={onSolveSelf}
              className="flex-1 py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 hover:text-white font-semibold text-xs border border-white/[0.08] active:scale-95 transition-all"
            >
              Решить самому
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              id="btn-why-growth-complete"
              onClick={onLaunchWhy}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-semibold border border-indigo-500/30 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Почему это работает?</span>
            </button>

            <button
              id="btn-restart-growth"
              onClick={onResetGrowth}
              className="py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-medium transition-colors"
            >
              Заново
            </button>
          </div>
        )}

        {/* Secondary Action: Разобрать до фундамента */}
        <div className="flex items-center justify-between pt-1">
          <button
            id="btn-full-decompose"
            onClick={onFullDecompose}
            className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 transition-colors"
          >
            <Layers className="w-3 h-3" />
            <span>Разобрать до фундамента</span>
          </button>

          <button
            id="btn-card-not-understand"
            onClick={onLaunchFocusMode}
            className="text-[11px] font-medium text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 transition-colors"
          >
            <HelpCircle className="w-3 h-3 text-rose-400" />
            <span>Я не понимаю</span>
          </button>
        </div>
      </div>
    </div>
  );
};
