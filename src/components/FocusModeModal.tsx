import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  X,
  Sparkles,
  Compass,
  CornerDownRight,
  Lightbulb
} from 'lucide-react';
import { MathFormula } from './MathFormula';

interface FocusModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMasterFoundationNode?: (nodeId: string) => void;
}

interface DiagnosticStep {
  id: string;
  levelTitle: string;
  expression: string;
  question: string;
  options: Array<{ text: string; isCorrect: boolean; feedback?: string }>;
  explanation: string;
}

const DIAGNOSTIC_CHAIN: DiagnosticStep[] = [
  {
    id: 'step_goal',
    levelTitle: 'Вершина: Уравнение',
    expression: '2x + 4 = 10',
    question: 'Что означает запись «2x» в этом уравнении?',
    options: [
      { text: '2 + x (сложение)', isCorrect: false, feedback: 'Нет, при сложении пишется явный знак плюс.' },
      { text: '2 × x (умножение 2 на x)', isCorrect: true },
      { text: 'x² (возведение в квадрат)', isCorrect: false, feedback: 'Нет, x² — это x умножить на x.' },
      { text: 'Не знаю / сложно', isCorrect: false, feedback: 'Отлично! Спускаемся на уровень ниже.' },
    ],
    explanation: 'В алгебре знак умножения между числом и буквой принято опускать: 2x означает 2 умножить на неизвестное x.',
  },
  {
    id: 'step_mult_algebra',
    levelTitle: 'Уровень 2: Умножение коэффициента на x',
    expression: '2 \\times x',
    question: 'Если x — это неизвестная коробка, что значит 2 × коробка?',
    options: [
      { text: 'Две такие коробки (коробка + коробка)', isCorrect: true },
      { text: 'Коробка весом 2 кг', isCorrect: false, feedback: 'Вес коробки мы пока не знаем, это переменная.' },
      { text: 'Не знаю', isCorrect: false, feedback: 'Давай спустимся к самым простым числам без букв!' },
    ],
    explanation: 'Умножение на 2 — это просто взять предмет дважды: x + x = 2x.',
  },
  {
    id: 'step_foundation',
    levelTitle: 'Фундамент: Базовое умножение чисел',
    expression: '2 \\times 3 = ?',
    question: 'Сколько будет 2 умножить на 3 (то есть 3 + 3)?',
    options: [
      { text: '5', isCorrect: false, feedback: '5 — это 2 + 3, а нам нужно взять тройку два раза (3 + 3).' },
      { text: '6', isCorrect: true },
      { text: '8', isCorrect: false, feedback: '3 + 3 = 6.' },
    ],
    explanation: '2 × 3 = 6. Это фундаментальный факт арифметики. Фундамент найден!',
  },
];

export const FocusModeModal: React.FC<FocusModeModalProps> = ({
  isOpen,
  onClose,
  onMasterFoundationNode,
}) => {
  // Phase: 'descending' (диагностика вниз) | 'foundation_found' | 'climbing' (подъем вверх) | 'completed'
  const [phase, setPhase] = useState<'descending' | 'foundation_found' | 'climbing' | 'completed'>('descending');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentStep = DIAGNOSTIC_CHAIN[currentIndex];

  const handleOptionClick = (optionIndex: number) => {
    setSelectedOptionIndex(optionIndex);
    const option = currentStep.options[optionIndex];

    if (phase === 'descending') {
      if (option.isCorrect) {
        // Correct at current level -> foundation reached!
        setFeedbackMessage('Верно! Этот уровень понятен.');
        if (currentIndex === DIAGNOSTIC_CHAIN.length - 1) {
          // Reached the very base
          setPhase('foundation_found');
          if (onMasterFoundationNode) onMasterFoundationNode('lin2_mult');
        } else {
          // If already knows 2x = 2 * x, let's confirm base and start climb
          setPhase('foundation_found');
        }
      } else {
        // Wrong or "Don't know" -> descend deeper!
        setFeedbackMessage(option.feedback || 'Давай спустимся глубже.');
        setTimeout(() => {
          if (currentIndex < DIAGNOSTIC_CHAIN.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setSelectedOptionIndex(null);
            setFeedbackMessage(null);
          } else {
            // Already at bottom, show explanation
            setPhase('foundation_found');
          }
        }, 1200);
      }
    } else if (phase === 'climbing') {
      if (option.isCorrect) {
        setFeedbackMessage('Отлично! Шаг понят и закреплен.');
        setTimeout(() => {
          if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
            setSelectedOptionIndex(null);
            setFeedbackMessage(null);
          } else {
            setPhase('completed');
          }
        }, 1000);
      } else {
        setFeedbackMessage(option.feedback || 'Попробуй еще раз.');
      }
    }
  };

  const handleStartClimbing = () => {
    setPhase('climbing');
    setSelectedOptionIndex(null);
    setFeedbackMessage(null);
  };

  const handleReset = () => {
    setPhase('descending');
    setCurrentIndex(0);
    setSelectedOptionIndex(null);
    setFeedbackMessage(null);
  };

  return (
    <div
      id="focus-mode-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 select-none"
    >
      <div className="relative w-full max-w-2xl bg-[#0d101a] border border-white/[0.14] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/95 text-white overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs uppercase tracking-wider font-bold text-rose-300">
              Focus Mode: Режим «Я не понимаю»
            </span>
          </div>

          <button
            id="btn-close-focus-mode"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Закрыть Focus Mode (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Breadcrumb Progress */}
        <div className="flex items-center justify-center gap-2 mb-6 font-mono text-xs">
          {DIAGNOSTIC_CHAIN.map((step, idx) => {
            const isCurrent = idx === currentIndex;
            const isCompleted = phase === 'climbing' ? idx >= currentIndex : idx < currentIndex;

            return (
              <React.Fragment key={step.id}>
                <div
                  className={`px-3 py-1 rounded-lg border transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white border-indigo-400 font-bold ring-2 ring-indigo-500/40'
                      : isCompleted
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                      : 'bg-white/[0.04] text-slate-500 border-white/[0.06]'
                  }`}
                >
                  {step.id === 'step_goal'
                    ? '2x + 4 = 10'
                    : step.id === 'step_mult_algebra'
                    ? '2 × x'
                    : '2 × 3'}
                </div>
                {idx < DIAGNOSTIC_CHAIN.length - 1 && (
                  <span className="text-slate-600">
                    {phase === 'climbing' ? '▲' : '▼'}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Main Content State Rendering */}
        {phase === 'descending' && (
          <div>
            <div className="text-center mb-6">
              <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider block mb-1">
                {currentStep.levelTitle}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
                Давай найдём первый понятный шаг
              </h2>
              <div className="inline-block px-5 py-2.5 bg-[#060810] border border-white/[0.1] rounded-2xl font-mono text-emerald-400 text-lg sm:text-xl shadow-inner my-2">
                <MathFormula math={currentStep.expression} />
              </div>
              <p className="text-sm text-slate-300 mt-2 max-w-lg mx-auto">
                {currentStep.question}
              </p>
            </div>

            {/* Diagnostic Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {currentStep.options.map((opt, optIdx) => {
                const isSelected = selectedOptionIndex === optIdx;
                return (
                  <button
                    key={optIdx}
                    id={`focus-option-${optIdx}`}
                    onClick={() => handleOptionClick(optIdx)}
                    className={`p-4 text-left rounded-2xl border text-sm font-medium transition-all ${
                      isSelected
                        ? opt.isCorrect
                          ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                          : 'bg-rose-950/80 border-rose-400 text-rose-200'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-200 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt.text}</span>
                      {isSelected && (
                        opt.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                        )
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Feedback alert */}
            {feedbackMessage && (
              <div className="p-3.5 bg-indigo-950/50 border border-indigo-500/30 rounded-xl text-xs text-indigo-200 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{feedbackMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Phase: Foundation Found */}
        {phase === 'foundation_found' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">
              Фундамент найден!
            </h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto mb-5 leading-relaxed">
              Мы нашли точку опоры: <strong>2 × 3 = 6</strong>. Ты понимаешь, что умножение — это повторное сложение. Теперь мы поднимемся снизу вверх прямо к исходной задаче.
            </p>

            <div className="p-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl max-w-md mx-auto mb-6 text-xs text-left space-y-2 font-mono text-slate-300">
              <div className="text-emerald-400 font-bold">Путь подъема вверх:</div>
              <div>1. 2 × 3 = 6 (Арифметика) ✓</div>
              <div>2. 2 × x = x + x (Переменные)</div>
              <div>3. 2x = 6 ⟹ x = 3 (Инверсия)</div>
              <div>4. 2x + 4 = 10 (Исходное уравнение)</div>
            </div>

            <button
              id="btn-start-climbing"
              onClick={handleStartClimbing}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-2"
            >
              <ArrowUp className="w-4 h-4" />
              <span>Начать подъем вверх к задаче</span>
            </button>
          </div>
        )}

        {/* Phase: Climbing Upwards */}
        {phase === 'climbing' && (
          <div>
            <div className="text-center mb-6">
              <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider block mb-1">
                Подъем вверх: {currentStep.levelTitle}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Шаг за шагом к победе
              </h2>
              <div className="inline-block px-5 py-2.5 bg-[#060810] border border-white/[0.1] rounded-2xl font-mono text-emerald-400 text-lg sm:text-xl shadow-inner my-2">
                <MathFormula math={currentStep.expression} />
              </div>
              <p className="text-sm text-slate-300 mt-2 max-w-lg mx-auto">
                {currentStep.explanation}
              </p>
            </div>

            <div className="space-y-2.5 mb-5">
              <div className="text-xs font-semibold text-slate-400 mb-1">
                Проверь себя для закрепления:
              </div>
              {currentStep.options.map((opt, optIdx) => {
                const isSelected = selectedOptionIndex === optIdx;
                return (
                  <button
                    key={optIdx}
                    id={`climb-option-${optIdx}`}
                    onClick={() => handleOptionClick(optIdx)}
                    className={`w-full p-3.5 text-left rounded-xl border text-sm font-medium transition-all ${
                      isSelected
                        ? opt.isCorrect
                          ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                          : 'bg-rose-950/80 border-rose-400 text-rose-200'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-200 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt.text}</span>
                      {isSelected && opt.isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {feedbackMessage && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feedbackMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Phase: Completed */}
        {phase === 'completed' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              <Sparkles className="w-8 h-8 text-emerald-400" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">
              Фундамент успешно освоен!
            </h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
              Теперь ты точно понимаешь, из чего состоит выражение <strong>2x + 4 = 10</strong>. Вернись к задаче и реши её до конца!
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                id="btn-return-to-task-from-focus"
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all flex items-center gap-2"
              >
                <span>↑ Вернуться к 2x + 4 = 10</span>
              </button>

              <button
                onClick={handleReset}
                className="px-4 py-3 rounded-xl bg-white/[0.06] text-slate-300 hover:text-white text-sm font-medium transition-colors"
              >
                Пройти ещё раз
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
