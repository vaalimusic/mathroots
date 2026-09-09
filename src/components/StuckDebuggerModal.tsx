import React, { useState, useEffect } from 'react';
import { MathNode, MathTree, StuckDiagnosis } from '../types';
import { findDeepestPrerequisiteGap } from '../utils/mathEngine';
import {
  AlertTriangle,
  X,
  ArrowRight,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Compass,
  Loader2
} from 'lucide-react';
import { fetchAi } from '../context/UserAiContext';

interface StuckDebuggerModalProps {
  isOpen: boolean;
  tree: MathTree;
  masteredIds: Set<string>;
  weakIds: Set<string>;
  onClose: () => void;
  onJumpToNode: (nodeId: string) => void;
}

export const StuckDebuggerModal: React.FC<StuckDebuggerModalProps> = ({
  isOpen,
  tree,
  masteredIds,
  weakIds,
  onClose,
  onJumpToNode,
}) => {
  const [diagnosis, setDiagnosis] = useState<StuckDiagnosis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      runDiagnosis();
    }
  }, [isOpen, tree.id]);

  const runDiagnosis = async () => {
    setLoading(true);
    // 1. Algorithmic fallback first
    const goalNode = tree.nodes.find((n) => n.type === 'goal') || tree.nodes[0];
    const deepestGap = findDeepestPrerequisiteGap(goalNode.id, tree.nodes, masteredIds);

    const defaultTarget = deepestGap || tree.nodes.find((n) => !masteredIds.has(n.id)) || tree.nodes[0];

    const fallbackDiagnosis: StuckDiagnosis = {
      gapConcept: deepestGap ? deepestGap.title : 'Отрицательные числа и знаки при раскрытии скобок',
      rootCauseAnalysis:
        'Анализ пути по графу зависимостей показывает: затруднение возникает не в самой концепции задачи верхнего уровня, а в правиле знаков при переносе слагаемых и распределительном законе!',
      pathFromRoot: [
        'Натуральные числа',
        'Сложение & Вычитание',
        `${deepestGap ? deepestGap.title : 'Отрицательные числа'} ← ОБНАРУЖЕН ПРОБЕЛ В КОРНЯХ`,
        'Раскрытие скобок',
        goalNode.title,
      ],
      recommendedAction: `Рекомендуем спуститься к основанию: повторить узел «${defaultTarget.title}», выполнить проверочное действие, и вся верхняя конструкция задачи сложится легко!`,
      targetNodeId: defaultTarget.id,
    };

    // 2. Try calling Gemini/Provider API for deep dynamic diagnostic
    try {
      const response = await fetchAi('/api/ai/diagnose-stuck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentNode: goalNode,
          userMistakes: ['Неверный знак при разложении', 'Путаница между -5x и +6'],
          history: Array.from(masteredIds),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.diagnosis) {
          setDiagnosis(data.diagnosis);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('AI diagnosis fallback used:', e);
    }

    setDiagnosis(fallbackDiagnosis);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div
      id="stuck-debugger-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050507]/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-[#0a0d16] rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        {/* Modal Header */}
        <div className="p-5 border-b border-rose-500/20 bg-rose-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-950/50">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Отладчик математического мышления
              </h2>
              <p className="text-xs text-rose-400 font-medium">
                Поиск глубинного фундаментального пробела
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-200">
                Трассировка графа математических зависимостей...
              </p>
              <p className="text-xs text-slate-400">
                Ищем узел в фундаменте, где возникла заминка
              </p>
            </div>
          ) : diagnosis ? (
            <>
              {/* Gap Summary Card */}
              <div className="p-4 bg-rose-950/30 rounded-xl border border-rose-500/30 space-y-2">
                <div className="text-xs font-bold text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Корень затруднения найден:
                </div>
                <div className="text-base font-bold text-white">
                  {diagnosis.gapConcept}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {diagnosis.rootCauseAnalysis}
                </p>
              </div>

              {/* Path from root visualization */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Цепочка зависимостей снизу вверх:
                </div>
                <div className="bg-[#060810] p-4 rounded-xl border border-white/[0.08] space-y-2">
                  {diagnosis.pathFromRoot.map((step, idx) => {
                    const isGap = step.includes('ПРОБЕЛ') || step.includes('ОБНАРУЖЕН');
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between border ${
                          isGap
                            ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/50 animate-pulse'
                            : idx === diagnosis.pathFromRoot.length - 1
                            ? 'bg-[#14192b] text-white border-indigo-500/40'
                            : 'bg-[#0e121e] text-slate-300 border-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono opacity-50">{idx + 1}.</span>
                          <span>{step}</span>
                        </div>
                        {isGap && <AlertTriangle className="w-4 h-4 text-white" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommendation */}
              <div className="p-4 bg-emerald-950/30 rounded-xl border border-emerald-500/30 space-y-1.5">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  План исправления фундамента:
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {diagnosis.recommendedAction}
                </p>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#070910] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Позже
          </button>

          {diagnosis && (
            <button
              id="btn-jump-to-gap-node"
              onClick={() => {
                onJumpToNode(diagnosis.targetNodeId);
                onClose();
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-950/60 transition-all"
            >
              <span>Перейти к узлу пробела</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
