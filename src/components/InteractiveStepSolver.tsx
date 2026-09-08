import React, { useState, useEffect, useMemo } from 'react';
import { MathNode, MathTree, PresentationMode } from '../types';
import { renderTeX, diagnoseLinearStepError } from '../utils/mathEngine';
import { MathFormula } from './MathFormula';
import { AudioVoiceNarrator } from './AudioVoiceNarrator';
import {
  Scale,
  Code2,
  BookOpen,
  Box,
  Shapes,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Check,
  X,
  ChevronDown,
  Layers,
  Target
} from 'lucide-react';

interface InteractiveStepSolverProps {
  tree?: MathTree;
  activeNode?: MathNode | null;
  onSelectNode?: (node: MathNode) => void;
  onWhyClickPrerequisite?: (nodeId: string) => void;
  onMarkMastered?: (nodeId: string) => void;
  onClose?: () => void;
  onDontUnderstand?: (node: MathNode) => void;
  onOpenSyntaxInspector?: (expression?: string, xVal?: number) => void;
}

export const InteractiveStepSolver: React.FC<InteractiveStepSolverProps> = ({
  tree,
  activeNode,
  onSelectNode,
  onWhyClickPrerequisite,
  onMarkMastered,
  onClose,
  onDontUnderstand,
  onOpenSyntaxInspector,
}) => {
  // Current node inside solver: fallback to tree goal or first node
  const selectedOrFallbackNode = useMemo<MathNode>(() => {
    if (activeNode) return activeNode;
    if (tree?.nodes && tree.nodes.length > 0) {
      const goal = tree.nodes.find((n) => n.type === 'goal');
      return goal || tree.nodes[0];
    }
    // Static canonical fallback
    return {
      id: 'canonical_linear_2x',
      title: 'Уравнение 2x + 4 = 10',
      formula: '2x + 4 = 10',
      layer: 3,
      type: 'goal',
      branch: 'main',
      x: 0,
      y: 0,
      requires: [],
      explanationHuman: 'Линейное уравнение — это весы в равновесии. Находим неизвестный вес x.',
      formalRule: 'Свойства равенства: a = b ⟹ a - c = b - c, и a · c = b · c',
      visualSteps: ['2x + 4 = 10', '2x = 6', 'x = 3'],
      whyCanIDoThis: 'Любая операция, симметрично примененная к обеим частям равенства, сохраняет истинность.',
      practiceExercise: {
        question: 'Чему равен x в уравнении 2x = 6?',
        expectedAnswer: '3',
        hint: 'Разделите обе части на 2',
      },
    };
  }, [activeNode?.id, tree?.id]);

  const [currentNode, setCurrentNode] = useState<MathNode>(selectedOrFallbackNode);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [presentationMode, setPresentationMode] = useState<PresentationMode>('balance');
  const [userCustomInput, setUserCustomInput] = useState('');
  const [showNodeSelector, setShowNodeSelector] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<{
    status: 'idle' | 'correct' | 'error';
    text: string;
    prereqId?: string;
  }>({ status: 'idle', text: '' });

  // AI Step hint state
  const [isAiLoadingStep, setIsAiLoadingStep] = useState(false);
  const [aiStepHint, setAiStepHint] = useState<string | null>(null);

  // Update current node if parent activeNode changes
  useEffect(() => {
    if (activeNode) {
      setCurrentNode(activeNode);
      setCurrentStepIndex(0);
      setUserCustomInput('');
      setVerificationFeedback({ status: 'idle', text: '' });
      setAiStepHint(null);
    }
  }, [activeNode?.id]);

  const fetchAiStepHint = async () => {
    setIsAiLoadingStep(true);
    setAiStepHint(null);
    try {
      const response = await fetch('/api/ai/explain-why', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeTitle: currentNode.title,
          formula: currentStep.equation,
          stepContext: `Как сделать следующий шаг: ${currentStep.actionPrompt}`,
          level: 'school',
        }),
      });
      const data = await response.json();
      if (data.success && data.explanation) {
        setAiStepHint(
          data.explanation.shortAnswer || data.explanation.detailedExplanation || 'Используйте симметричные свойства равенства.'
        );
      } else {
        setAiStepHint(currentStep.description);
      }
    } catch {
      setAiStepHint(currentStep.description);
    } finally {
      setIsAiLoadingStep(false);
    }
  };

  // Dynamic step generator for the current node
  const steps = useMemo(() => {
    const isCanonical =
      currentNode.formula.replace(/\s+/g, '') === '2x+4=10' ||
      currentNode.id === 'canonical_linear_2x' ||
      currentNode.id === 'lin2_goal';

    if (isCanonical) {
      return [
        {
          id: 0,
          title: 'Исходное уравнение',
          equation: '2x + 4 = 10',
          subEquation: '',
          leftSide: '2x + 4',
          rightSide: '10',
          description:
            'Уравнение представляет собой идеальное равновесие двух чаш весов. Слева две неизвестные коробки x и 4 гири, справа 10 гирь.',
          leftWeight: 10,
          rightWeight: 10,
          leftBoxes: 2,
          leftUnits: 4,
          rightUnits: 10,
          actionPrompt: 'Как изолировать слагаемое 2x от мешающей четверки (+4)?',
          nextActionLabel: 'Вычесть 4 из обеих частей (-4)',
          whyConceptId: 'lin2_prop_equality',
          whyRule: '\\text{Свойства равенства: } a = b \\implies a - c = b - c',
          story:
            'На столе стоят две одинаковые запечатанные коробки с подарками и ещё 4 золотые монеты. Все это вместе весит ровно 10 грамм. Мы хотим узнать, сколько золота спрятано внутри каждой коробки.',
          code: 'const solve = (x: number) => 2 * x + 4 === 10;\n// Ищем такое x, при котором тождество возвращает true',
          geometryDesc: 'Отрезок длины 10 разбит на две равные части x и отрезок длины 4: [x][x][4] = 10',
        },
        {
          id: 1,
          title: 'Шаг 1: Вычитание 4 из обеих частей',
          equation: '2x = 6',
          subEquation: '2x + 4 - 4 = 10 - 4',
          leftSide: '2x',
          rightSide: '6',
          description:
            'Мы сняли 4 гири с обеих чаш весов. Равновесие сохранилось! Слева остались только 2 коробки [x][x], а справа осталось 6 гирь.',
          leftWeight: 6,
          rightWeight: 6,
          leftBoxes: 2,
          leftUnits: 0,
          rightUnits: 6,
          actionPrompt: 'Две коробки дают 6 единиц. Как узнать вес одной коробки?',
          nextActionLabel: 'Разделить обе части на 2 (:2)',
          whyConceptId: 'lin2_concept_2x',
          whyRule: '\\text{Смысл записи } 2x: 2 \\cdot x = 6 \\implies x = 6 / 2',
          story:
            'Сначала убираем 4 открытые монеты с обеих сторон стола. Теперь на столе лежат только две закрытые коробки, а напротив них — ровно 6 монет!',
          code: 'const step1 = (2 * x + 4) - 4 === 10 - 4;\nassert(2 * x === 6);',
          geometryDesc: 'Убрали 4 с обеих сторон. Остались два одинаковых отрезка x общей длиной 6: [x][x] = 6',
        },
        {
          id: 2,
          title: 'Шаг 2: Деление обеих частей на 2',
          equation: 'x = 3',
          subEquation: '\\frac{2x}{2} = \\frac{6}{2}',
          leftSide: 'x',
          rightSide: '3',
          description:
            'Мы разделили содержимое каждой чаши пополам. Теперь на левой чаше один [x], а на правой ровно 3 гири!',
          leftWeight: 3,
          rightWeight: 3,
          leftBoxes: 1,
          leftUnits: 0,
          rightUnits: 3,
          actionPrompt: 'Корень найден: x = 3. Теперь обязательно проверим результат!',
          nextActionLabel: 'Выполнить верификацию подстановкой',
          whyConceptId: 'lin2_mult',
          whyRule: '\\text{Деление — операция, обратная умножению: } \\frac{a \\cdot x}{a} = x',
          story:
            'Если две одинаковые коробки стоят 6 монет, то в одной коробке находится ровно половина: 6 разделить на 2 равно 3 монеты.',
          code: 'const x = 6 / 2;\nassert(x === 3);',
          geometryDesc: 'Делим отрезок 6 пополам. Длина одного сегмента x ровно 3 единицы: [x] = 3',
        },
        {
          id: 3,
          title: 'Шаг 3: Верификация решения подстановкой',
          equation: '2 \\cdot (3) + 4 = 10 \\implies 10 = 10',
          subEquation: '2(3) + 4 = 6 + 4 = 10 \\quad (\\text{Истина!})',
          leftSide: '2(3) + 4',
          rightSide: '10',
          description:
            'Подставляем найденный x = 3 в 2x + 4 = 10. Внимание: буква x полностью исчезает, уступая место числу 3 в скобках. Скобка 2(3) означает неявное умножение: 2 × 3 = 6, затем 6 + 4 = 10!',
          leftWeight: 10,
          rightWeight: 10,
          leftBoxes: 0,
          leftUnits: 10,
          rightUnits: 10,
          actionPrompt: 'Решение математически подтверждено: обе чаши весов равны 10!',
          nextActionLabel: 'Завершить и отметить как освоенное',
          whyConceptId: 'lin2_verify',
          whyRule: '\\text{Определение корня уравнения: } 2(3) + 4 = 2 \\cdot 3 + 4 = 10 \\quad (10 = 10)',
          story:
            'Открываем коробки: в каждой по 3 монеты. 2 коробки по 3 монеты дают 6 монет (2 × 3 = 6), плюс 4 монеты на столе = ровно 10 монет!',
          code: 'const x = 3;\nexpect(2 * x + 4).toBe(10); // 2 * 3 + 4 === 10',
          geometryDesc: 'Проверяем отрезки: 2 отрезка по 3 плюс отрезок длины 4 дают ровно 10.',
        },
      ];
    }

    // Dynamic steps for any arbitrary node
    const vSteps = currentNode.visualSteps && currentNode.visualSteps.length > 0
      ? currentNode.visualSteps
      : [currentNode.formula];

    const result = vSteps.map((vStep, idx) => {
      const eqOnly = vStep.includes(':') && vStep.includes('=') ? vStep.split(':').slice(1).join(':').trim() : vStep;
      const parts = eqOnly.includes('=') ? eqOnly.split('=') : [eqOnly, ''];
      const leftSide = parts[0].trim();
      const rightSide = parts[1] ? parts[1].trim() : 'Тождество';

      return {
        id: idx,
        title: idx === 0 ? 'Исходное выражение' : `Шаг ${idx}: Преобразование`,
        equation: vStep,
        subEquation: idx > 0 ? `${vSteps[idx - 1]} \\longrightarrow ${vStep}` : '',
        leftSide,
        rightSide,
        description:
          idx === 0
            ? currentNode.explanationHuman || 'Анализируем исходную формулу и составляющие части.'
            : `Применяем математическое преобразование: переход к ${vStep}.`,
        leftWeight: 10,
        rightWeight: 10,
        leftBoxes: 1,
        leftUnits: 0,
        rightUnits: 1,
        actionPrompt:
          idx < vSteps.length - 1
            ? `Как перейти к следующему виду: ${vSteps[idx + 1]}?`
            : 'Финальный вид достигнут. Проверьте строгость перехода!',
        nextActionLabel:
          idx < vSteps.length - 1 ? `Перейти к шагу ${idx + 2}` : 'Завершить разбор и освоить',
        whyConceptId: currentNode.requires?.[0] || currentNode.id,
        whyRule: currentNode.formalRule || 'Аксиоматическое свойство числовых равенств',
        story: `Наглядный смысл: ${currentNode.whyCanIDoThis || currentNode.explanationHuman}`,
        code: `// Инвариант преобразования шага ${idx + 1}\nconst step${idx + 1} = () => {\n  // Формула: ${vStep}\n  return true;\n};`,
        geometryDesc: `Геометрическая интерпретация формулы ${vStep}: сохранение площадей и длин.`,
      };
    });

    return result;
  }, [currentNode]);

  const currentStep = steps[currentStepIndex] || steps[0];

  // Test custom input step
  const handleCheckUserStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCustomInput.trim()) return;

    const cleanedUser = userCustomInput.trim().toLowerCase().replace(/\s+/g, '');

    // If practice exercise answer exists, test against it
    if (currentNode.practiceExercise) {
      const cleanedExpected = currentNode.practiceExercise.expectedAnswer
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '');
      if (cleanedUser === cleanedExpected || cleanedUser.includes(cleanedExpected)) {
        setVerificationFeedback({
          status: 'correct',
          text: 'Отлично! Ответ абсолютно верный! Переход выполнен строго по правилу.',
        });
        if (onMarkMastered) onMarkMastered(currentNode.id);
        return;
      }
    }

    // Default linear step diagnostic
    const result = diagnoseLinearStepError(currentNode.formula || '2x + 4 = 10', userCustomInput);
    if (result.isCorrect) {
      setVerificationFeedback({
        status: 'correct',
        text: result.feedback,
      });
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      }
    } else {
      setVerificationFeedback({
        status: 'error',
        text: result.feedback,
        prereqId: result.prerequisiteNodeId,
      });
    }
  };

  const advanceStep = () => {
    setVerificationFeedback({ status: 'idle', text: '' });
    setUserCustomInput('');
    setAiStepHint(null);
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      if (onMarkMastered) onMarkMastered(currentNode.id);
      setCurrentStepIndex(0);
    }
  };

  // Node type label
  const getTypeBadge = (type: MathNode['type']) => {
    switch (type) {
      case 'goal':
        return { label: 'Цель задачи', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'step':
        return { label: 'Шаг решения', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'axiom':
        return { label: 'Аксиома', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'bridge':
        return { label: 'Мост', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      default:
        return { label: 'Понятие', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    }
  };

  const typeInfo = getTypeBadge(currentNode.type);

  return (
    <div id="interactive-step-solver-view" className="flex flex-col h-full bg-[#050507] text-[#e2e8f0] p-4 md:p-6 overflow-y-auto">
      {/* Top Header Bar with Back Button & Card Selector */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-white/[0.08] gap-3">
        <div className="flex items-center gap-3">
          {/* Back to Canvas Map Button */}
          {onClose && (
            <button
              id="btn-solver-back-to-map"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white text-xs font-semibold transition-colors border border-white/[0.08]"
              title="Вернуться назад к карте знаний"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              <span>Карта знаний</span>
            </button>
          )}

          {/* Scale Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold shadow-sm">
            <Scale className="w-3.5 h-3.5 text-indigo-400" />
            <span>Разбор с весами:</span>
          </div>

          {/* Node Dropdown Selector */}
          {tree && tree.nodes.length > 0 && (
            <div className="relative">
              <button
                id="btn-solver-select-node"
                onClick={() => setShowNodeSelector(!showNodeSelector)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#121626] hover:bg-[#1a2136] text-white rounded-xl text-xs font-bold border border-white/[0.12] transition-colors shadow-sm"
                title="Выбрать другой блок для разбора"
              >
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${typeInfo.color}`}>
                  {typeInfo.label}
                </span>
                <span className="max-w-[160px] sm:max-w-[220px] truncate">{currentNode.title}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {showNodeSelector && (
                <div className="absolute left-0 mt-2 w-80 max-h-96 overflow-y-auto bg-[#0d101a] rounded-2xl border border-white/[0.12] shadow-2xl p-2 z-50 space-y-1 backdrop-blur-xl">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-white/[0.06] mb-1">
                    <span>Выберите блок для разбора</span>
                    <span className="text-indigo-400">{tree.nodes.length} блоков</span>
                  </div>
                  {tree.nodes.map((n) => {
                    const nBadge = getTypeBadge(n.type);
                    const isCur = n.id === currentNode.id;
                    return (
                      <button
                        key={n.id}
                        onClick={() => {
                          setCurrentNode(n);
                          if (onSelectNode) onSelectNode(n);
                          setCurrentStepIndex(0);
                          setShowNodeSelector(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                          isCur
                            ? 'bg-indigo-600/30 text-white font-bold border border-indigo-500/40'
                            : 'text-slate-300 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex flex-col truncate pr-2">
                          <span className="truncate">{n.title}</span>
                          <span className="text-[10.5px] font-mono text-emerald-400 truncate">
                            {n.formula}
                          </span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-medium border shrink-0 ${nBadge.color}`}>
                          {nBadge.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Formula Display & Mastered Button */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#0d101a] rounded-xl border border-white/[0.08] text-xs font-mono text-emerald-300 shadow-inner">
            <MathFormula math={currentNode.formula} />
          </div>

          {onDontUnderstand && (
            <button
              id="btn-solver-dont-understand"
              onClick={() => onDontUnderstand(currentNode)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors shadow-sm active:scale-95"
              title="Не понимаю этот концепт: запустить диагностику корней"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Не понимаю</span>
            </button>
          )}

          {onMarkMastered && (
            <button
              id="btn-solver-toggle-mastered"
              onClick={() => onMarkMastered(currentNode.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors shadow-sm"
              title="Отметить этот блок как освоенный"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Освоено</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Закрыть разбор"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Selector Tabs (5 Способов представления) */}
      <div className="flex items-center gap-1.5 mt-4 p-1.5 bg-[#0d101a] rounded-xl border border-white/[0.08] overflow-x-auto">
        <button
          id="btn-mode-balance"
          onClick={() => setPresentationMode('balance')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
            presentationMode === 'balance'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>1. Весы (Баланс)</span>
        </button>

        <button
          id="btn-mode-symbolic"
          onClick={() => setPresentationMode('symbolic')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
            presentationMode === 'symbolic'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>2. Символьный вид</span>
        </button>

        <button
          id="btn-mode-story"
          onClick={() => setPresentationMode('story')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
            presentationMode === 'story'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>3. Текстовая история</span>
        </button>

        <button
          id="btn-mode-code"
          onClick={() => setPresentationMode('code')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
            presentationMode === 'code'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>4. Для программиста</span>
        </button>

        <button
          id="btn-mode-geometry"
          onClick={() => setPresentationMode('geometry')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
            presentationMode === 'geometry'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shapes className="w-3.5 h-3.5" />
          <span>5. Геометрия / Модели</span>
        </button>

        {onOpenSyntaxInspector && (
          <button
            id="btn-open-syntax-guide-solver"
            onClick={() => onOpenSyntaxInspector('2x + 10', 3)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors whitespace-nowrap"
            title="Что делать со скобками в 2(3), куда исчезает x и почему пишут 2(3) + 10"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Что значат скобки 2(3)?</span>
          </button>
        )}
      </div>

      {/* Main Interactive Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 flex-1">
        {/* Left 7 Cols: Interactive Visualizer & Scale */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Main Visualizer Card */}
          <div className="bg-[#0d101a] border border-white/[0.08] rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[350px]">
            {/* Step Indicator Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5">
              {steps.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    idx === currentStepIndex
                      ? 'bg-emerald-500 text-white ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-500/30'
                      : idx < currentStepIndex
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/[0.05] text-slate-500 hover:bg-white/[0.1]'
                  }`}
                  title={s.title}
                >
                  {idx === steps.length - 1 && steps.length > 2 ? '✓' : idx + 1}
                </button>
              ))}
            </div>

            {/* Audio Step Narrator */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <AudioVoiceNarrator
                textToSpeak={`Шаг ${currentStepIndex + 1}: ${currentStep.title}. ${currentStep.equation}. ${currentStep.actionPrompt}`}
                label="Озвучить шаг"
                size="sm"
              />
            </div>

            {/* Current Math Target Display */}
            <div className="text-center my-4">
              <div
                className="text-2xl md:text-3xl font-serif text-white tracking-wide"
                dangerouslySetInnerHTML={{ __html: renderTeX(currentStep.equation, true) }}
              />
              {currentStep.subEquation && (
                <div
                  className="text-sm font-serif text-indigo-400 mt-1"
                  dangerouslySetInnerHTML={{ __html: renderTeX(currentStep.subEquation) }}
                />
              )}

              {/* Dedicated Parentheses Explainer Banner for 2(3) */}
              {(currentStep.equation.includes('(') || (currentStep.subEquation && currentStep.subEquation.includes('('))) && (
                <div className="w-full max-w-xl mx-auto mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                  <div className="flex items-start gap-2.5">
                    <span className="text-base leading-none mt-0.5">💡</span>
                    <div>
                      <div className="font-bold text-amber-300 text-xs">
                        Что делать с числом в скобках?
                      </div>
                      <div className="text-slate-300 text-[11px] leading-snug">
                        В записи <span className="font-mono text-emerald-300 font-bold">2(3)</span> скобка вплотную означает <strong className="text-white">неявное умножение</strong>: <span className="font-mono text-white font-bold">2 × 3 = 6</span>. Буква x полностью исчезла!
                      </div>
                    </div>
                  </div>

                  {onOpenSyntaxInspector && (
                    <button
                      onClick={() => onOpenSyntaxInspector('2x + 10', 3)}
                      className="shrink-0 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shadow-sm transition-all flex items-center gap-1"
                    >
                      <span>Гид по скобкам</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 1. Presentation Mode: Balance Scale (ВЕСЫ) */}
            {presentationMode === 'balance' && (
              <div className="w-full flex flex-col items-center mt-2">
                {/* Visual Scale Drawing */}
                <div className="relative w-80 h-40 flex flex-col items-center justify-end">
                  {/* Scale Beam */}
                  <div className="w-72 h-2.5 bg-gradient-to-r from-slate-600 via-indigo-400 to-slate-600 rounded-full relative shadow-md">
                    {/* Center Fulcrum Indicator */}
                    <div className="absolute left-1/2 -top-2.5 -translate-x-1/2 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                  </div>

                  {/* Base Triangle */}
                  <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[36px] border-b-slate-700 mt-0 shadow-lg" />

                  {/* Left Pan (Suspended) */}
                  <div className="absolute left-2 top-4 flex flex-col items-center">
                    <div className="flex items-end gap-1 mb-1 min-h-[44px]">
                      {currentStep.leftBoxes !== undefined && currentStep.leftBoxes > 0 && (
                        Array.from({ length: currentStep.leftBoxes }).map((_, i) => (
                          <div
                            key={`box-${i}`}
                            className="w-9 h-9 rounded-lg bg-indigo-600 border border-indigo-400 text-white flex items-center justify-center font-bold text-sm shadow-md animate-bounce"
                            style={{ animationDelay: `${i * 120}ms` }}
                          >
                            x
                          </div>
                        ))
                      )}
                      {currentStep.leftUnits !== undefined && currentStep.leftUnits > 0 && (
                        Array.from({ length: currentStep.leftUnits }).map((_, i) => (
                          <div
                            key={`lunit-${i}`}
                            className="w-4 h-4 rounded-full bg-amber-400 border border-amber-300 shadow-sm"
                            title="1 единица"
                          />
                        ))
                      )}
                      {/* Generic left side label if no specific box/units */}
                      {currentStep.leftBoxes === undefined && currentStep.leftUnits === undefined && (
                        <div className="px-2.5 py-1 bg-indigo-600/30 rounded-lg border border-indigo-400/40 text-xs font-mono text-indigo-200">
                          {currentStep.leftSide || 'Левая часть'}
                        </div>
                      )}
                    </div>
                    {/* Hanging String & Plate */}
                    <div className="w-0.5 h-6 bg-slate-500" />
                    <div className="w-28 h-2 bg-slate-600 rounded-full shadow" />
                    <span className="text-[10px] text-slate-400 font-mono mt-1">Левая чаша</span>
                  </div>

                  {/* Right Pan (Suspended) */}
                  <div className="absolute right-2 top-4 flex flex-col items-center">
                    <div className="flex flex-wrap max-w-[100px] justify-center items-end gap-1 mb-1 min-h-[44px]">
                      {currentStep.rightUnits !== undefined && currentStep.rightUnits > 0 && (
                        Array.from({ length: currentStep.rightUnits }).map((_, i) => (
                          <div
                            key={`runit-${i}`}
                            className="w-4 h-4 rounded-full bg-emerald-400 border border-emerald-300 shadow-sm"
                            title="1 единица"
                          />
                        ))
                      )}
                      {/* Generic right side label */}
                      {currentStep.rightUnits === undefined && (
                        <div className="px-2.5 py-1 bg-emerald-600/30 rounded-lg border border-emerald-400/40 text-xs font-mono text-emerald-200">
                          {currentStep.rightSide || 'Правая часть'}
                        </div>
                      )}
                    </div>
                    {/* Hanging String & Plate */}
                    <div className="w-0.5 h-6 bg-slate-500" />
                    <div className="w-28 h-2 bg-slate-600 rounded-full shadow" />
                    <span className="text-[10px] text-slate-400 font-mono mt-1">Правая чаша</span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 mt-4 text-center max-w-md bg-[#070912] p-2.5 rounded-xl border border-white/[0.06]">
                  {currentStep.description}
                </div>
              </div>
            )}

            {/* 2. Presentation Mode: Symbolic */}
            {presentationMode === 'symbolic' && (
              <div className="flex flex-col items-center gap-3 p-4 text-center">
                <div className="text-sm text-slate-300 max-w-md">
                  Алгебраическая запись каждого шага эквивалентного преобразования:
                </div>
                <div className="p-4 bg-[#050507] rounded-xl border border-white/[0.08] font-mono text-sm text-emerald-300 space-y-1.5 w-full max-w-md">
                  {steps.map((s, idx) => (
                    <div
                      key={s.id}
                      className={`p-1.5 rounded-lg transition-colors ${
                        idx === currentStepIndex
                          ? 'bg-indigo-600/20 text-white font-bold border border-indigo-500/40'
                          : 'text-slate-400'
                      }`}
                    >
                      {idx + 1}. {s.equation}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Presentation Mode: Story */}
            {presentationMode === 'story' && (
              <div className="p-4 bg-[#050507] rounded-xl border border-white/[0.08] text-sm text-slate-300 max-w-md space-y-2">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>Наглядная история:</span>
                </div>
                <p className="leading-relaxed">{currentStep.story}</p>
              </div>
            )}

            {/* 4. Presentation Mode: Code */}
            {presentationMode === 'code' && (
              <div className="w-full max-w-md p-4 bg-[#050507] rounded-xl border border-white/[0.08] font-mono text-xs text-indigo-300">
                <div className="text-slate-500 mb-2">// Алгебраический инвариант на TypeScript</div>
                <pre className="whitespace-pre-wrap leading-relaxed">{currentStep.code}</pre>
              </div>
            )}

            {/* 5. Presentation Mode: Geometry */}
            {presentationMode === 'geometry' && (
              <div className="w-full max-w-md p-4 flex flex-col items-center gap-3">
                <div className="text-xs text-slate-300 text-center">
                  {currentStep.geometryDesc}
                </div>
                <div className="w-full h-8 bg-slate-800 rounded-lg flex overflow-hidden border border-white/[0.1] shadow-inner">
                  <div className="w-[50%] bg-indigo-600 flex items-center justify-center text-xs font-bold text-white border-r border-indigo-400">
                    Левая часть: {currentStep.leftSide}
                  </div>
                  <div className="w-[50%] bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                    Правая часть: {currentStep.rightSide}
                  </div>
                </div>
                <div className="text-xs font-mono text-emerald-400 text-center">
                  Равенство сохранено: Левая часть ≡ Правая часть
                </div>
              </div>
            )}
          </div>

          {/* Interactive Step Input & Error Verifier */}
          <div className="bg-[#0d101a] border border-white/[0.08] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {currentNode.practiceExercise ? 'Самопроверка концепта:' : 'Проверь свой следующий шаг:'}
              </span>
              <span className="text-[11px] text-slate-400">
                {currentNode.practiceExercise?.question || 'Введи математическое преобразование'}
              </span>
            </div>

            <form onSubmit={handleCheckUserStep} className="flex gap-2">
              <input
                type="text"
                value={userCustomInput}
                onChange={(e) => setUserCustomInput(e.target.value)}
                placeholder={
                  currentNode.practiceExercise?.hint
                    ? `Подсказка: ${currentNode.practiceExercise.hint}`
                    : 'Введи свой ответ (например 2x=6 или 3)...'
                }
                className="flex-1 bg-[#050507] border border-white/[0.1] rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <span>Проверить</span>
              </button>
            </form>

            {/* Diagnostic Feedback */}
            {verificationFeedback.status !== 'idle' && (
              <div
                className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  verificationFeedback.status === 'correct'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {verificationFeedback.status === 'correct' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p>{verificationFeedback.text}</p>
                  {verificationFeedback.prereqId && onWhyClickPrerequisite && (
                    <button
                      onClick={() => onWhyClickPrerequisite(verificationFeedback.prereqId!)}
                      className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 font-semibold text-[11px] transition-colors"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>Исследовать причину на графе знаний</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Step Controls & Foundational "Почему?" */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Action Prompt Card */}
          <div className="bg-[#0d101a] border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Шаг {currentStepIndex + 1} из {steps.length}
                </span>
                <span className="text-xs text-slate-400">{currentStep.title}</span>
              </div>

              <h2 className="text-base font-bold text-white mt-2">{currentStep.actionPrompt}</h2>

              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {currentStep.description}
              </p>

              {/* AI Step Tutor Hint */}
              <div className="mt-3">
                {!aiStepHint ? (
                  <button
                    onClick={fetchAiStepHint}
                    disabled={isAiLoadingStep}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1 px-2.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isAiLoadingStep ? 'animate-spin' : ''}`} />
                    <span>{isAiLoadingStep ? 'ИИ думает...' : '✨ Подсказка ИИ: почему этот шаг?'}</span>
                  </button>
                ) : (
                  <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs text-indigo-200 leading-relaxed animate-in fade-in duration-200 space-y-1">
                    <div className="flex items-center justify-between font-bold text-indigo-300">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Совет от ИИ-наставника
                      </span>
                      <button
                        onClick={() => setAiStepHint(null)}
                        className="text-slate-400 hover:text-white text-[10px]"
                      >
                        Скрыть
                      </button>
                    </div>
                    <p className="whitespace-pre-line text-slate-200">{aiStepHint}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Advance Action Button */}
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={advanceStep}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                <span>{currentStep.nextActionLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {currentStepIndex > 0 && (
                <button
                  onClick={() => setCurrentStepIndex(0)}
                  className="w-full py-2 px-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Сбросить к началу</span>
                </button>
              )}
            </div>
          </div>

          {/* "Почему?" Foundational Law Card */}
          <div className="bg-gradient-to-br from-indigo-950/40 via-[#0d101a] to-[#050507] border border-indigo-500/20 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-300">Фундаментальное правило</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Корни графа
              </span>
            </div>

            <div
              className="text-sm font-serif text-white my-2"
              dangerouslySetInnerHTML={{ __html: renderTeX(currentStep.whyRule) }}
            />

            <p className="text-xs text-slate-400 leading-relaxed">
              {currentNode.whyCanIDoThis ||
                'Этот шаг не взят с потолка — он опирается на свойства равенства и фундаментальные арифметические законы.'}
            </p>

            {onWhyClickPrerequisite && (
              <button
                onClick={() => onWhyClickPrerequisite(currentStep.whyConceptId)}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-indigo-300 font-semibold text-xs border border-white/[0.08] transition-colors flex items-center justify-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>Исследовать «Почему?» на графе знаний</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
