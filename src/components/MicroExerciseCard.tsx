import React, { useState } from 'react';
import { CheckCircle2, HelpCircle, ArrowRight, Lightbulb, X, BookOpen } from 'lucide-react';
import { MathFormula } from './MathFormula';

interface MicroExerciseCardProps {
  question: string;
  formula?: string;
  expectedAnswer: string;
  hint?: string;
  onCorrect: () => void;
  onClose: () => void;
  onDeconstructBase?: () => void;
}

export const MicroExerciseCard: React.FC<MicroExerciseCardProps> = ({
  question,
  formula = '3x = 12',
  expectedAnswer = '4',
  hint = 'Чтобы найти один x, раздели обе части уравнения на 3: 12 / 3',
  onCorrect,
  onClose,
  onDeconstructBase,
}) => {
  const [answerInput, setAnswerInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'gentle_error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = answerInput.trim();

    if (clean === expectedAnswer) {
      setStatus('correct');
      setTimeout(() => {
        onCorrect();
      }, 1000);
    } else {
      setStatus('gentle_error');
      // Friendly messages per Section 21
      if (clean === '9' || clean === '15') {
        setErrorMessage('Похоже, здесь перепутано сложение/вычитание с делением. В 3x спрятано умножение.');
      } else {
        setErrorMessage('Этот шаг не сохраняет равенство. Похоже, здесь потерялась обратная операция.');
      }
    }
  };

  return (
    <div
      id="micro-exercise-card"
      className="bg-[#0e1220]/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl p-4 shadow-2xl shadow-black/80 max-w-xs w-full text-white text-xs select-none animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] mb-2">
        <span className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">
          Микро-задание узла
        </span>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="text-slate-200 mb-2 font-medium">
        {question || 'Найди x:'}
      </div>

      <div className="p-2.5 bg-[#060810] border border-white/[0.08] rounded-xl text-center font-mono text-base text-emerald-300 mb-3 shadow-inner">
        <MathFormula math={formula} />
      </div>

      {status !== 'correct' ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono font-bold">x =</span>
            <input
              type="text"
              value={answerInput}
              onChange={(e) => {
                setAnswerInput(e.target.value);
                if (status === 'gentle_error') setStatus('idle');
              }}
              placeholder="?"
              className="w-20 px-3 py-1.5 bg-[#070914] border border-white/20 focus:border-indigo-400 rounded-lg text-white font-mono text-center text-sm focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all"
            >
              Ответить
            </button>
          </div>

          {/* Gentle Error Feedback (Section 21) */}
          {status === 'gentle_error' && (
            <div className="p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-xl space-y-2 text-[11px] text-amber-200 animate-in fade-in duration-200">
              <div className="flex items-start gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="px-2 py-1 bg-white/[0.08] hover:bg-white/[0.14] text-amber-200 rounded-md font-medium text-[10px] transition-colors"
                >
                  Показать намёк
                </button>

                {onDeconstructBase && (
                  <button
                    type="button"
                    onClick={onDeconstructBase}
                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-md font-medium text-[10px] transition-colors"
                  >
                    Разобрать основу
                  </button>
                )}
              </div>
            </div>
          )}

          {showHint && (
            <div className="p-2 bg-indigo-950/40 border border-indigo-500/30 rounded-lg text-[10px] text-indigo-300">
              💡 {hint}
            </div>
          )}
        </form>
      ) : (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 flex items-center justify-center gap-2 font-bold animate-in zoom-in-95 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Верно! Ветка закреплена.</span>
        </div>
      )}
    </div>
  );
};
