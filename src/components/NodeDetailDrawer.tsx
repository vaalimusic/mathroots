import React, { useState, useEffect } from 'react';
import { MathNode, WhyDepthLevel, PresentationMode } from '../types';
import { MathFormula } from './MathFormula';
import { checkMathAnswer } from '../utils/mathEngine';
import confetti from 'canvas-confetti';
import { VisualBalanceScale } from './visuals/VisualBalanceScale';
import { VisualParabolaPlotter } from './visuals/VisualParabolaPlotter';
import { VisualAreaModel } from './visuals/VisualAreaModel';
import { VisualNumberLine } from './visuals/VisualNumberLine';
import { VisualFractionBar } from './visuals/VisualFractionBar';
import { VisualPythagoras } from './visuals/VisualPythagoras';
import { VisualTrigCircle } from './visuals/VisualTrigCircle';
import { VisualDerivativeTangent } from './visuals/VisualDerivativeTangent';
import { VisualExpLog } from './visuals/VisualExpLog';
import { NodeIntuitionSandbox } from './NodeIntuitionSandbox';
import { AudioVoiceNarrator } from './AudioVoiceNarrator';
import {
  X,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowDown,
  RotateCcw,
  BookOpen,
  GraduationCap,
  Baby,
  Code,
  Lightbulb,
  Check,
  AlertCircle,
  Compass,
  Scale,
  Binary,
  Layers,
  Activity,
  Maximize2,
  GitFork,
  GitBranch,
  ArrowRight,
  ArrowUp
} from 'lucide-react';
import { fetchAi } from '../context/UserAiContext';

interface NodeDetailDrawerProps {
  node: MathNode | null;
  isOpen: boolean;
  isMastered: boolean;
  allNodes?: MathNode[];
  onClose: () => void;
  onToggleMastered: (nodeId: string) => void;
  onNavigateToNode: (nodeId: string) => void;
  onOpenVisualLab?: (tab?: any) => void;
  onOpenStepSolver?: (node: MathNode) => void;
  onDontUnderstand?: (node: MathNode) => void;
  onOpenSyntaxInspector?: (expression?: string, xVal?: number) => void;
}

export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({
  node,
  isOpen,
  isMastered,
  allNodes = [],
  onClose,
  onToggleMastered,
  onNavigateToNode,
  onOpenVisualLab,
  onOpenStepSolver,
  onDontUnderstand,
  onOpenSyntaxInspector,
}) => {
  const [selectedDepth, setSelectedDepth] = useState<WhyDepthLevel>('school');
  const [activePresentation, setActivePresentation] = useState<PresentationMode>('balance');
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [userPracticeInput, setUserPracticeInput] = useState('');
  const [practiceFeedback, setPracticeFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showHint, setShowHint] = useState(false);
  const [showInteractiveVisual, setShowInteractiveVisual] = useState(true);
  const [customVisualType, setCustomVisualType] = useState<string | null>(null);

  // AI "Why can I do this?" state
  const [isAiExplaining, setIsAiExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<{
    shortAnswer?: string;
    detailedExplanation?: string;
    analogy?: string;
    axiomOrProof?: string;
    deeperQuestion?: string;
  } | null>(null);
  const [aiExplainError, setAiExplainError] = useState<string | null>(null);

  useEffect(() => {
    if (node) {
      setActiveStepIndex(0);
      setUserPracticeInput('');
      setPracticeFeedback('idle');
      setShowHint(false);
      setActivePresentation('balance');
      setShowInteractiveVisual(true);
      setCustomVisualType(null);
      setAiExplanation(null);
      setAiExplainError(null);
    }
  }, [node?.id]);

  // Connectedness & Lineage for current node
  const prerequisiteNodes = (node?.requires || [])
    .map((id) => allNodes.find((n) => n.id === id))
    .filter((n): n is MathNode => Boolean(n));

  const consequenceNodes = (allNodes || []).filter((n) =>
    node ? (n.requires || []).includes(node.id) : false
  );

  const handleFetchAiExplanation = async () => {
    if (!node) return;
    setIsAiExplaining(true);
    setAiExplainError(null);
    try {
      const res = await fetchAi('/api/ai/explain-why', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeTitle: node.title,
          formula: node.formula,
          stepContext: node.explanationHuman,
          level: selectedDepth,
        }),
      });
      const data = await res.json();
      if (data.success && data.explanation) {
        setAiExplanation(data.explanation);
      } else {
        setAiExplainError(data.error || 'Не удалось получить ответ ИИ-наставника');
      }
    } catch (err: any) {
      setAiExplainError(err.message || 'Ошибка связи с ИИ-сервером');
    } finally {
      setIsAiExplaining(false);
    }
  };

  if (!isOpen || !node) return null;

  const handleCheckPractice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!node.practiceExercise) return;

    const isCorrect = checkMathAnswer(userPracticeInput, node.practiceExercise.expectedAnswer);
    if (isCorrect) {
      setPracticeFeedback('correct');
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.7 },
      });
      if (!isMastered) {
        onToggleMastered(node.id);
      }
    } else {
      setPracticeFeedback('wrong');
    }
  };

  // Determine which interactive visual best matches this concept
  const getVisualType = () => {
    const id = node.id.toLowerCase();
    const formula = node.formula.toLowerCase();
    const title = node.title.toLowerCase();

    if (id.includes('trig') || formula.includes('sin') || formula.includes('cos') || title.includes('тригонометр') || title.includes('окружност')) {
      return 'trig';
    }
    if (id.includes('diff') || id.includes('deriv') || formula.includes('lim') || formula.includes('f\'') || title.includes('производн') || title.includes('касательн') || title.includes('секущ')) {
      return 'derivative';
    }
    if (id.includes('exp') || id.includes('log') || formula.includes('log') || formula.includes('ln') || formula.includes('a^x') || formula.includes('e^x') || title.includes('логарифм') || title.includes('экспонент') || title.includes('показател')) {
      return 'explog';
    }
    if (id.includes('parabola') || formula.includes('x^2') || formula.includes('x²') || title.includes('дискриминант') || title.includes('парабола')) {
      return 'parabola';
    }
    if (id.includes('fraction') || formula.includes('frac') || title.includes('дроб') || title.includes('доли')) {
      return 'fractions';
    }
    if (id.includes('pythagor') || title.includes('пифагор') || formula.includes('a^2 + b^2') || formula.includes('c^2')) {
      return 'pythagoras';
    }
    if (id.includes('mult') || id.includes('factor') || title.includes('умножен') || title.includes('множител') || title.includes('площад')) {
      return 'area';
    }
    if (id.includes('add') || id.includes('sub') || id.includes('natural') || title.includes('числовая') || title.includes('сложение') || title.includes('вычитание')) {
      return 'numberline';
    }
    return 'balance';
  };

  const visualType = customVisualType || getVisualType();

  // Self-contained instant level text
  const getCurrentLevelText = (): string => {
    if (node.depthExplanations && node.depthExplanations[selectedDepth]) {
      return node.depthExplanations[selectedDepth]!;
    }
    if (selectedDepth === 'novice') {
      return `На наглядных предметах: ${node.explanationHuman}`;
    }
    if (selectedDepth === 'school') {
      return `${node.formalRule}. Этот шаг необходим для сохранения равенства: ${node.whyCanIDoThis}`;
    }
    if (selectedDepth === 'university') {
      return `Аксиоматическое обоснование: ${node.formalRule}. Преобразование сохраняет эквивалентность на поле действительных чисел.`;
    }
    if (selectedDepth === 'programmer') {
      return `// Алгоритмический переход состояния:\nconst nextState = applyRule("${node.title}", state);\nassert(isValid(nextState));`;
    }
    return node.whyCanIDoThis;
  };

  return (
    <div
      id="node-detail-drawer"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[540px] bg-[#090b12] border-l border-white/[0.1] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200 text-slate-100"
    >
      {/* Top Header */}
      <div className="p-5 border-b border-white/[0.08] flex items-start justify-between gap-4 bg-[#0d101a]/90 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-white/[0.08] text-slate-300 border border-white/[0.06]">
              Уровень {node.layer}: {node.type === 'bridge' ? 'Мост' : node.type === 'goal' ? 'Цель' : 'Узел'}
            </span>
            {node.branch && (
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-medium border border-indigo-500/30">
                {node.branch}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white leading-tight">
            {node.title}
          </h2>
        </div>

        <button
          id="btn-close-drawer"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Formula Display Box */}
        <div className="p-4 bg-[#05060a] text-emerald-300 rounded-xl shadow-inner border border-white/[0.08] text-center">
          <div className="text-xs text-slate-400 mb-1 uppercase tracking-widest font-mono">
            Математическое выражение
          </div>
          <div className="text-lg py-1 overflow-x-auto">
            <MathFormula math={node.formula} displayMode={true} />
          </div>

          {onOpenStepSolver && (
            <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-center gap-2">
              <button
                id="btn-drawer-open-step-solver"
                onClick={() => {
                  onOpenStepSolver(node);
                  onClose();
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/30"
              >
                <Scale className="w-4 h-4 text-indigo-200" />
                <span>Разбор с весами ↗</span>
              </button>

              {onDontUnderstand && (
                <button
                  id="btn-drawer-dont-understand"
                  onClick={() => {
                    onDontUnderstand(node);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-600/20 hover:bg-rose-600/35 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-950/40 transition-all active:scale-95"
                  title="Запустить диагностику: найти точный пробел и точку опоры"
                >
                  <Compass className="w-4 h-4 text-rose-400" />
                  <span>Я не понимаю этот узел</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Parentheses & Implicit Multiplication Guide Banner */}
        {onOpenSyntaxInspector && (node.formula.includes('(') || node.formula.includes('2x') || node.id.includes('verify') || node.id.includes('concept_2x')) && (
          <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-indigo-950/30 to-purple-950/20 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">💡</span>
              <div>
                <span className="font-bold text-amber-300">Что делать со скобками в 2(3) или 2x?</span>
                <p className="text-[11px] text-slate-300">
                  Разбор неявного умножения, исчезновения буквы x при подстановке и порядка действий.
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenSyntaxInspector('2x + 10', 3)}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1"
            >
              <span>Смотреть разбор</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Section 1: Human Explanation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Человеческое объяснение сути
            </h3>
            <AudioVoiceNarrator
              textToSpeak={node.explanationHuman}
              label="Озвучить"
              size="sm"
            />
          </div>
          <p className="text-sm text-amber-200/90 leading-relaxed bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20">
            {node.explanationHuman}
          </p>
        </div>

        {/* Section 1.5: Intuition Sandbox, Real-World Analogy, & Cognitive Trap */}
        <div className="space-y-2">
          <NodeIntuitionSandbox node={node} />
        </div>

        {/* Section: Interactive Visual Sandbox */}
        <div className="space-y-2.5 pt-2 border-t border-white/[0.08]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Интерактивная наглядная модель
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInteractiveVisual(!showInteractiveVisual)}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                {showInteractiveVisual ? 'Скрыть' : 'Показать'}
              </button>
              {onOpenVisualLab && (
                <button
                  onClick={() => onOpenVisualLab(visualType)}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30 transition-colors"
                  title="Открыть в полной визуальной лаборатории"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Вся лаборатория</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Model Selector Pills */}
          {showInteractiveVisual && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'balance', label: 'Весы' },
                { id: 'parabola', label: 'Парабола' },
                { id: 'numberline', label: 'Прямая' },
                { id: 'fractions', label: 'Дроби' },
                { id: 'area', label: 'Площадь' },
                { id: 'pythagoras', label: 'Пифагор' },
                { id: 'trig', label: 'Тригонометрия' },
                { id: 'derivative', label: 'Производная' },
                { id: 'explog', label: 'Экспонента' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setCustomVisualType(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 ${
                    visualType === m.id
                      ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30 font-bold'
                      : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {showInteractiveVisual && (
            <div className="space-y-2">
              {visualType === 'balance' && <VisualBalanceScale />}
              {visualType === 'parabola' && <VisualParabolaPlotter />}
              {visualType === 'numberline' && <VisualNumberLine />}
              {visualType === 'area' && <VisualAreaModel />}
              {visualType === 'fractions' && <VisualFractionBar />}
              {visualType === 'pythagoras' && <VisualPythagoras />}
              {visualType === 'trig' && <VisualTrigCircle />}
              {visualType === 'derivative' && <VisualDerivativeTangent />}
              {visualType === 'explog' && <VisualExpLog />}
            </div>
          )}
        </div>

        {/* Multi-modal Presentations (5 Modes: Balance, Symbolic, Story, Code, Geometry) */}
        {node.presentations && (
          <div className="space-y-2.5 pt-2 border-t border-white/[0.08]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Мультимодальное представление
            </h3>

            {/* Mode selection pills */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-[#05060a] rounded-xl border border-white/[0.06]">
              {node.presentations.balance && (
                <button
                  onClick={() => setActivePresentation('balance')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activePresentation === 'balance'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Весы</span>
                </button>
              )}
              {node.presentations.symbolic && (
                <button
                  onClick={() => setActivePresentation('symbolic')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activePresentation === 'symbolic'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Binary className="w-3.5 h-3.5" />
                  <span>Символы</span>
                </button>
              )}
              {node.presentations.story && (
                <button
                  onClick={() => setActivePresentation('story')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activePresentation === 'story'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>История</span>
                </button>
              )}
              {node.presentations.code && (
                <button
                  onClick={() => setActivePresentation('code')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activePresentation === 'code'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Код</span>
                </button>
              )}
              {node.presentations.geometry && (
                <button
                  onClick={() => setActivePresentation('geometry')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activePresentation === 'geometry'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Геометрия</span>
                </button>
              )}
            </div>

            {/* Mode content */}
            <div className="p-3.5 bg-[#0b0e17] rounded-xl border border-white/[0.08] text-xs text-slate-200 leading-relaxed font-mono">
              {node.presentations[activePresentation] || node.presentations.balance || node.presentations.symbolic}
            </div>
          </div>
        )}

        {/* Section 2: Visual Step-by-Step Breakdown */}
        {node.visualSteps && node.visualSteps.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Визуализация по шагам
              </h3>
              <span className="text-xs text-slate-400 font-medium font-mono">
                Шаг {activeStepIndex + 1} из {node.visualSteps.length}
              </span>
            </div>

            <div className="bg-[#0b0e17] p-4 rounded-xl border border-white/[0.08] space-y-3">
              <div className="space-y-2">
                {node.visualSteps.map((step, idx) => {
                  const isActive = idx === activeStepIndex;
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveStepIndex(idx)}
                      className={`p-2.5 rounded-lg border text-sm font-mono cursor-pointer transition-all flex items-center justify-between ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                          : 'bg-[#0e121e] text-slate-300 border-white/[0.06] hover:border-white/[0.15]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-5 h-5 rounded-full text-xs font-sans flex items-center justify-center font-bold ${
                            isActive ? 'bg-white text-indigo-700' : 'bg-white/[0.1] text-slate-300'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                      {isActive && <Check className="w-4 h-4" />}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activeStepIndex === 0}
                  className="px-3 py-1 text-xs font-semibold rounded-md border border-white/[0.1] text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.06] transition-colors"
                >
                  Назад
                </button>
                <button
                  onClick={() =>
                    setActiveStepIndex((prev) => Math.min(node.visualSteps.length - 1, prev + 1))
                  }
                  disabled={activeStepIndex === node.visualSteps.length - 1}
                  className="px-3 py-1 text-xs font-semibold rounded-md bg-indigo-600 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-500 shadow-sm transition-colors"
                >
                  Вперед
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Formal Rule */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            Формальное математическое правило
          </h3>
          <div className="text-xs text-slate-300 font-mono bg-[#0b0e17] p-3.5 rounded-xl border border-white/[0.08] leading-relaxed">
            {node.formalRule}
          </div>
        </div>

        {/* Section 4: The Core Mechanic "Почему я могу это сделать?" */}
        <div className="space-y-3 pt-2 border-t border-white/[0.08]">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              «Почему я могу это сделать?»
            </h3>
            <div className="flex items-center gap-2">
              <AudioVoiceNarrator
                textToSpeak={getCurrentLevelText()}
                label="Озвучить уровень"
                size="sm"
              />
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                4 уровня глубины
              </span>
            </div>
          </div>

          {/* Depth Selector Pills */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#05060a] rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setSelectedDepth('novice')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all ${
                selectedDepth === 'novice'
                  ? 'bg-[#14192b] text-white border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Baby className="w-3.5 h-3.5 text-amber-400" />
              <span>Новичок</span>
            </button>

            <button
              onClick={() => setSelectedDepth('school')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all ${
                selectedDepth === 'school'
                  ? 'bg-[#14192b] text-white border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Школьник</span>
            </button>

            <button
              onClick={() => setSelectedDepth('university')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all ${
                selectedDepth === 'university'
                  ? 'bg-[#14192b] text-white border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
              <span>Студент</span>
            </button>

            <button
              onClick={() => setSelectedDepth('programmer')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all ${
                selectedDepth === 'programmer'
                  ? 'bg-[#14192b] text-white border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5 text-emerald-400" />
              <span>Кодер</span>
            </button>
          </div>

          {/* Depth Explanation Box */}
          <div className="p-4 bg-[#0b0e17] rounded-xl border border-white/[0.08] space-y-2.5">
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {getCurrentLevelText()}
            </p>

            {/* AI Deep Query Action Button */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
              <button
                id="btn-ask-ai-why"
                onClick={handleFetchAiExplanation}
                disabled={isAiExplaining}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white border border-indigo-400/40 shadow-sm transition-all disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isAiExplaining ? 'animate-spin' : ''}`} />
                <span>
                  {isAiExplaining
                    ? 'ИИ анализирует фундаментальные корни...'
                    : `Спросить ИИ-наставника (уровень: ${selectedDepth})`}
                </span>
              </button>

              {aiExplanation && (
                <button
                  onClick={() => setAiExplanation(null)}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Свернуть ИИ
                </button>
              )}
            </div>

            {/* AI Explanation Error */}
            {aiExplainError && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{aiExplainError}</span>
              </div>
            )}

            {/* Render AI Dynamic Deep-Dive Response */}
            {aiExplanation && (
              <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-b from-indigo-950/40 to-[#070913] border border-indigo-500/30 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-2 text-xs font-bold text-indigo-300">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Глубокий разбор от Gemini ({selectedDepth}):</span>
                  </div>
                  <AudioVoiceNarrator
                    textToSpeak={`${aiExplanation.shortAnswer || ''}. ${aiExplanation.detailedExplanation || ''} ${aiExplanation.analogy ? `Аналогия: ${aiExplanation.analogy}` : ''}`}
                    label="Слушать ответ ИИ"
                    size="sm"
                  />
                </div>

                {aiExplanation.shortAnswer && (
                  <div className="p-2.5 rounded-lg bg-indigo-950/50 border border-indigo-500/20 text-xs font-semibold text-indigo-100 leading-snug">
                    {aiExplanation.shortAnswer}
                  </div>
                )}

                {aiExplanation.detailedExplanation && (
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                    {aiExplanation.detailedExplanation}
                  </p>
                )}

                {aiExplanation.analogy && (
                  <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
                    <span className="font-bold text-amber-300 block mb-0.5">Аналогия из жизни:</span>
                    {aiExplanation.analogy}
                  </div>
                )}

                {aiExplanation.axiomOrProof && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-200 leading-relaxed font-mono">
                    <span className="font-bold text-emerald-300 block mb-0.5 font-sans">
                      Аксиома / формальное доказательство:
                    </span>
                    {aiExplanation.axiomOrProof}
                  </div>
                )}

                {aiExplanation.deeperQuestion && (
                  <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-300 italic">
                    <span className="font-bold text-slate-400 not-italic block mb-0.5">
                      Вопрос для исследования корней:
                    </span>
                    «{aiExplanation.deeperQuestion}»
                  </div>
                )}
              </div>
            )}

            {/* Deeper Question to dig into roots */}
            {node.deeperQuestion && (
              <div className="mt-3 pt-3 border-t border-white/[0.08]">
                <div className="text-xs text-indigo-400 font-semibold mb-1 flex items-center gap-1">
                  <ArrowDown className="w-3.5 h-3.5" />
                  Копаем ещё глубже:
                </div>
                <p className="text-xs text-slate-400 italic">
                  {node.deeperQuestion}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Prerequisites Dependencies links */}
        {node.requires && node.requires.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Фундаментальные зависимости (Корни):
            </div>
            <div className="flex flex-wrap gap-2">
              {node.requires.map((reqId) => (
                <button
                  key={reqId}
                  onClick={() => onNavigateToNode(reqId)}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#0e121e] hover:bg-indigo-600/25 hover:text-indigo-300 border border-white/[0.08] font-medium transition-colors text-slate-300"
                >
                  <Compass className="w-3 h-3 text-slate-500" />
                  <span>Узел {reqId.replace('node_', '').replace('lin_', '').replace('surf_', '')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section 5: Mini Practice Action */}
        {node.practiceExercise && (
          <div className="space-y-3 pt-4 border-t border-white/[0.08] bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Мини-практика для закрепления
              </h3>
              {isMastered && (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Узел освоен!
                </span>
              )}
            </div>

            <p className="text-sm text-slate-200 font-medium">
              {node.practiceExercise.question}
            </p>

            <form onSubmit={handleCheckPractice} className="space-y-2.5">
              <div className="flex items-center gap-2">
                <input
                  id="practice-answer-input"
                  type="text"
                  value={userPracticeInput}
                  onChange={(e) => {
                    setUserPracticeInput(e.target.value);
                    setPracticeFeedback('idle');
                  }}
                  placeholder="Введи ответ (например: 3x+12)"
                  className="flex-1 px-3.5 py-2 text-sm font-mono rounded-lg border border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-[#060810] text-white placeholder-slate-500"
                />
                <button
                  id="btn-check-practice"
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md shadow-emerald-950/50 transition-colors"
                >
                  Проверить
                </button>
              </div>

              {practiceFeedback === 'correct' && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Верно! Математический движок подтвердил тождественность. Узел освоен!
                </div>
              )}

              {practiceFeedback === 'wrong' && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-300 bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/30">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    Пока не сошлось. Проверь знаки или порядок действий!
                  </div>
                  {!showHint && node.practiceExercise.hint && (
                    <button
                      type="button"
                      onClick={() => setShowHint(true)}
                      className="text-xs text-indigo-400 hover:underline font-medium"
                    >
                      Показать подсказку
                    </button>
                  )}
                </div>
              )}

              {showHint && node.practiceExercise.hint && (
                <div className="text-xs text-slate-300 bg-[#060810] p-2 rounded border border-white/[0.08]">
                  <span className="font-semibold text-slate-200">Подсказка: </span>
                  {node.practiceExercise.hint}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Section: Connectedness & Lineage (Связанность и корни) */}
        <div className="space-y-3 pt-3 border-t border-white/[0.08]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GitFork className="w-4 h-4 text-purple-400" />
              Связанность и генеалогия концепта
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Уровень {node.layer}
            </span>
          </div>

          {/* Incoming Prerequisites */}
          <div className="p-3.5 bg-[#080a14] rounded-xl border border-white/[0.08] space-y-2">
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <ArrowDown className="w-3.5 h-3.5" />
              <span>От чего зависит этот узел (Предшественники):</span>
            </div>
            {prerequisiteNodes.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-0.5">
                {prerequisiteNodes.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => onNavigateToNode(req.id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border border-amber-500/25 text-xs transition-colors text-left group"
                  >
                    <span className="font-semibold group-hover:text-white">{req.title}</span>
                    <span className="font-mono text-[10px] text-amber-300/80 bg-black/40 px-1.5 py-0.5 rounded">
                      {req.formula}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Это фундаментальный кирпичик (аксиома/базовое понятие). У него нет зависимостей ниже по древу.
              </p>
            )}
          </div>

          {/* Outgoing Consequences */}
          <div className="p-3.5 bg-[#080a14] rounded-xl border border-white/[0.08] space-y-2">
            <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Что открывает этот узел дальше (Следствия):</span>
            </div>
            {consequenceNodes.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-0.5">
                {consequenceNodes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onNavigateToNode(c.id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 border border-emerald-500/25 text-xs transition-colors text-left group"
                  >
                    <span className="font-semibold group-hover:text-white">{c.title}</span>
                    <span className="font-mono text-[10px] text-emerald-300/80 bg-black/40 px-1.5 py-0.5 rounded">
                      {c.formula}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Это верхний узел (цель задачи). Вся цепочка рассуждений ведёт к нему.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer toggle status */}
      <div className="p-4 border-t border-white/[0.08] bg-[#0b0e17] flex items-center justify-between">
        <button
          id="btn-manual-master-toggle"
          onClick={() => onToggleMastered(node.id)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            isMastered
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
              : 'bg-[#121624] text-slate-300 border border-white/[0.1] hover:border-white/20'
          }`}
        >
          <CheckCircle2 className={`w-4 h-4 ${isMastered ? 'text-emerald-400' : 'text-slate-500'}`} />
          {isMastered ? 'Отмечено как освоенное' : 'Отметить как освоенное'}
        </button>

        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};
