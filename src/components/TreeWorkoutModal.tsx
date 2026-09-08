import React, { useState, useMemo, useCallback } from 'react';
import { MathTree, MathNode } from '../types';
import { MathFormula } from './MathFormula';
import {
  WORKOUT_CATEGORIES,
  HANDCRAFTED_PROBLEMS,
  WorkoutProblem,
  ProblemDifficulty,
  generateDynamicWorkoutProblem,
} from '../data/workoutBank';
import { api } from '../utils/apiClient';
import {
  Trophy,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Compass,
  Lightbulb,
  Zap,
  Flame,
  Search,
  BookOpen,
  Filter,
  ChevronDown,
  ChevronUp,
  Layers,
  Award,
  RefreshCw,
  Scale,
} from 'lucide-react';

interface TreeWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tree: MathTree;
  masteredIds: Set<string>;
  onMarkMastered: (nodeId: string) => void;
  onNavigateToNode: (nodeId: string) => void;
  onOpenDontUnderstand?: (node: MathNode) => void;
  onOpenSyntaxInspector?: (expression?: string, xVal?: number) => void;
  onSelectTree?: (treeId: string) => void;
  onOpenStepSolver?: (problem: WorkoutProblem) => void;
}

type WorkoutTab = 'trainer' | 'library' | 'generator' | 'lab';

export const TreeWorkoutModal: React.FC<TreeWorkoutModalProps> = ({
  isOpen,
  onClose,
  tree,
  masteredIds,
  onMarkMastered,
  onNavigateToNode,
  onOpenDontUnderstand,
  onOpenSyntaxInspector,
  onSelectTree,
  onOpenStepSolver,
}) => {
  // Navigation Tabs: Trainer, Library of Breakdowns, Infinite Generator, Interactive Balance Lab
  const [activeTab, setActiveTab] = useState<WorkoutTab>('trainer');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [useTreeScopeOnly, setUseTreeScopeOnly] = useState<boolean>(false);

  // Gamification & Session State
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [xp, setXp] = useState<number>(0);
  const [score, setScore] = useState<number>(0);

  // Trainer Current Progress
  const [trainerIndex, setTrainerIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [expandedStepBreakdown, setExpandedStepBreakdown] = useState<boolean>(false);

  // Library Modal State (expanded problem in breakdown catalog)
  const [libraryExpandedId, setLibraryExpandedId] = useState<string | null>(null);

  // Infinite Generator State
  const [genProblem, setGenProblem] = useState<WorkoutProblem>(() =>
    generateDynamicWorkoutProblem('linear', 1)
  );
  const [genSelectedOpt, setGenSelectedOpt] = useState<number | null>(null);
  const [genIsAnswered, setGenIsAnswered] = useState<boolean>(false);
  const [genCount, setGenCount] = useState<number>(1);

  // Interactive Step & Balance Lab Presets & State
  const LAB_PRESETS = useMemo(
    () => [
      {
        id: 'lab_1',
        title: 'Весы: 2x + 4 = 10',
        initA: 2,
        initB: 4,
        initC: 10,
        description: 'Две неизвестные коробки [x][x] и 4 гири уравновешены 10 гирями.',
      },
      {
        id: 'lab_2',
        title: 'Весы: 3x + 6 = 21',
        initA: 3,
        initB: 6,
        initC: 21,
        description: 'Три коробки [x][x][x] и 6 гирь уравновешены 21 гирей.',
      },
      {
        id: 'lab_3',
        title: 'С вычитанием: 4x - 8 = 16',
        initA: 4,
        initB: -8,
        initC: 16,
        description: 'Чтобы убрать вычитание 8, нужно симметрично прибавить 8 к обеим чашам!',
      },
      {
        id: 'lab_4',
        title: 'Коэффициент 5: 5x + 15 = 40',
        initA: 5,
        initB: 15,
        initC: 40,
        description: 'Пять коробок [x] и 15 гирь уравновешены 40 гирями.',
      },
    ],
    []
  );

  const [labPresetIdx, setLabPresetIdx] = useState<number>(0);
  const [labA, setLabA] = useState<number>(2);
  const [labB, setLabB] = useState<number>(4);
  const [labC, setLabC] = useState<number>(10);
  const [labStepHistory, setLabStepHistory] = useState<
    Array<{ equation: string; action: string; rule: string }>
  >([
    {
      equation: '2x + 4 = 10',
      action: 'Исходное состояние весов',
      rule: 'Равновесие двух чаш: левая часть равна правой.',
    },
  ]);
  const [labFeedback, setLabFeedback] = useState<string>('');
  const [labSolved, setLabSolved] = useState<boolean>(false);

  const handleSelectLabPreset = useCallback(
    (idx: number) => {
      setLabPresetIdx(idx);
      const p = LAB_PRESETS[idx];
      setLabA(p.initA);
      setLabB(p.initB);
      setLabC(p.initC);
      const sign = p.initB >= 0 ? `+ ${p.initB}` : `- ${Math.abs(p.initB)}`;
      setLabStepHistory([
        {
          equation: `${p.initA}x ${sign} = ${p.initC}`,
          action: 'Исходное состояние весов',
          rule: 'Равновесие двух чаш: левая часть равна правой.',
        },
      ]);
      setLabFeedback('');
      setLabSolved(false);
    },
    [LAB_PRESETS]
  );

  const handleLabSubtractB = useCallback(() => {
    if (labB === 0) return;
    const newC = labC - labB;
    const oldB = labB;
    setLabC(newC);
    setLabB(0);
    const eq = `${labA}x = ${newC}`;
    setLabStepHistory((prev) => [
      ...prev,
      {
        equation: eq,
        action:
          oldB > 0
            ? `Вычли ${oldB} с обеих сторон`
            : `Прибавили ${Math.abs(oldB)} к обеим сторонам`,
        rule: 'Инвариантность равенства: a = b ⟹ a - c = b - c',
      },
    ]);
    setLabFeedback(
      oldB > 0
        ? `Сняли ${oldB} гирь с обеих чаш весов. Баланс сохранен!`
        : `Добавили ${Math.abs(oldB)} гирь к обеим чашам для компенсации.`
    );
  }, [labA, labB, labC]);

  const handleLabDivideByA = useCallback(() => {
    if (labB !== 0 || labA <= 1) return;
    const finalRoot = labC / labA;
    const oldA = labA;
    setLabA(1);
    setLabC(finalRoot);
    const eq = `x = ${finalRoot}`;
    setLabStepHistory((prev) => [
      ...prev,
      {
        equation: eq,
        action: `Разделили обе стороны на коэффициент ${oldA}`,
        rule: 'Деление обеих частей уравнения: a · x = b ⟹ x = b / a',
      },
    ]);
    setLabSolved(true);
    setXp((prev) => prev + 80);
    const preset = LAB_PRESETS[labPresetIdx];
    const sign = preset.initB >= 0 ? '+' : '-';
    setLabFeedback(
      `Корень найден: x = ${finalRoot}! Проверка: ${preset.initA}(${finalRoot}) ${sign} ${Math.abs(
        preset.initB
      )} = ${preset.initC} ✔ Тождество истинно! Скобка ${preset.initA}(${finalRoot}) означает умножение!`
    );
  }, [labA, labB, labC, labPresetIdx, LAB_PRESETS]);

  const handleLabReset = useCallback(() => {
    handleSelectLabPreset(labPresetIdx);
  }, [handleSelectLabPreset, labPresetIdx]);

  // Convert tree nodes into workout problems when user wants tree-only practice
  const treeNodesProblems = useMemo<WorkoutProblem[]>(() => {
    if (!tree || !tree.nodes) return [];
    return tree.nodes.map((node, idx) => {
      if (node.practiceExercise && node.practiceExercise.options && node.practiceExercise.options.length > 0) {
        const correctOpt = node.practiceExercise.expectedAnswer;
        const opts = [...node.practiceExercise.options];
        if (!opts.includes(correctOpt)) opts.push(correctOpt);
        const cIdx = opts.indexOf(correctOpt);
        return {
          id: `tree_${node.id}`,
          category: 'tree',
          categoryTitle: tree.title,
          difficulty: 'basic',
          title: node.title,
          formula: node.formula,
          question: node.practiceExercise.question,
          options: opts,
          correctIndex: cIdx >= 0 ? cIdx : 0,
          expectedAnswer: correctOpt,
          explanation: node.explanationHuman,
          stepByStepBreakdown: node.visualSteps || [node.formalRule],
          whyRule: node.whyCanIDoThis,
          cognitiveTrap: node.cognitiveTrap,
          realWorldAnalogy: node.realWorldAnalogy ? node.realWorldAnalogy.story : undefined,
          linkedTreeId: tree.id,
          linkedNodeId: node.id,
        };
      }

      // Default smart breakdown from node properties
      return {
        id: `tree_${node.id}`,
        category: 'tree',
        categoryTitle: tree.title,
        difficulty: (node.layer === 0 ? 'beginner' : node.layer <= 2 ? 'basic' : 'advanced') as ProblemDifficulty,
        title: node.title,
        formula: node.formula,
        question: `Каков математический смысл концепта «${node.title}»?`,
        options: [
          node.explanationHuman.slice(0, 85) + '...',
          'Произвольное соглашение математиков без строгого доказательства.',
          'Применимо исключительно к комплексным числам.',
          'Исключение из правил, работающее только при делении на ноль.',
        ],
        correctIndex: 0,
        expectedAnswer: node.explanationHuman,
        explanation: node.explanationHuman,
        stepByStepBreakdown: node.visualSteps || [
          `Смысл шага: ${node.explanationHuman}`,
          `Формальное правило: ${node.formalRule}`,
          `Обоснование: ${node.whyCanIDoThis}`,
        ],
        whyRule: node.whyCanIDoThis,
        cognitiveTrap: node.cognitiveTrap,
        realWorldAnalogy: node.realWorldAnalogy ? node.realWorldAnalogy.story : undefined,
        linkedTreeId: tree.id,
        linkedNodeId: node.id,
      };
    });
  }, [tree]);

  // Combined Active Question Pool for Trainer
  const trainerQuestions = useMemo<WorkoutProblem[]>(() => {
    if (useTreeScopeOnly) {
      return treeNodesProblems;
    }

    let pool = [...HANDCRAFTED_PROBLEMS];

    if (selectedCategory !== 'all') {
      pool = pool.filter((p) => p.category === selectedCategory);
    }

    if (selectedDifficulty !== 'all') {
      pool = pool.filter((p) => p.difficulty === selectedDifficulty);
    }

    // Add dynamic problems to ensure rich pool of at least 25 questions per topic
    const dynamicCount = Math.max(0, 25 - pool.length);
    for (let i = 1; i <= dynamicCount; i++) {
      pool.push(generateDynamicWorkoutProblem(selectedCategory, i + 50));
    }

    return pool;
  }, [useTreeScopeOnly, treeNodesProblems, selectedCategory, selectedDifficulty]);

  // Filtered Library Problems
  const libraryProblems = useMemo<WorkoutProblem[]>(() => {
    let pool = [...HANDCRAFTED_PROBLEMS];

    if (selectedCategory !== 'all') {
      pool = pool.filter((p) => p.category === selectedCategory);
    }

    if (selectedDifficulty !== 'all') {
      pool = pool.filter((p) => p.difficulty === selectedDifficulty);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      pool = pool.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.formula.toLowerCase().includes(q) ||
          p.question.toLowerCase().includes(q) ||
          p.explanation.toLowerCase().includes(q) ||
          p.whyRule.toLowerCase().includes(q)
      );
    }

    return pool;
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  // Current Trainer Problem
  const currentProblem: WorkoutProblem | undefined = trainerQuestions[trainerIndex];

  // Handlers
  const handleSelectOption = useCallback(
    (idx: number) => {
      if (isAnswered || !currentProblem) return;
      setSelectedOption(idx);
      setIsAnswered(true);

      const isCorrect = idx === currentProblem.correctIndex;
      // Record to production database
      api.recordWorkout(currentProblem.id, currentProblem.category, idx, isCorrect);

      if (isCorrect) {
        setScore((s) => s + 1);
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > bestStreak) setBestStreak(newStreak);

        // XP Calculation: base 50 + streak bonus
        const gainedXp = 50 + newStreak * 10;
        setXp((prev) => prev + gainedXp);

        if (currentProblem.linkedNodeId) {
          onMarkMastered(currentProblem.linkedNodeId);
        }
      } else {
        setStreak(0);
      }
    },
    [isAnswered, currentProblem, streak, bestStreak, onMarkMastered]
  );

  const handleNextProblem = useCallback(() => {
    if (trainerIndex < trainerQuestions.length - 1) {
      setTrainerIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setExpandedStepBreakdown(false);
    } else {
      setIsFinished(true);
    }
  }, [trainerIndex, trainerQuestions.length]);

  const handleRestartTrainer = useCallback(() => {
    setTrainerIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setStreak(0);
    setIsFinished(false);
    setExpandedStepBreakdown(false);
  }, []);

  const handleGenerateNewProblem = useCallback(() => {
    const nextCount = genCount + 1;
    setGenCount(nextCount);
    setGenProblem(generateDynamicWorkoutProblem(selectedCategory, nextCount));
    setGenSelectedOpt(null);
    setGenIsAnswered(false);
  }, [genCount, selectedCategory]);

  const handleGenSelectOption = useCallback(
    (idx: number) => {
      if (genIsAnswered) return;
      setGenSelectedOpt(idx);
      setGenIsAnswered(true);
      if (idx === genProblem.correctIndex) {
        setXp((prev) => prev + 60);
      }
    },
    [genIsAnswered, genProblem]
  );

  if (!isOpen) return null;

  return (
    <div
      id="tree-workout-modal"
      className="fixed inset-0 z-50 bg-[#05060c]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200 select-none"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0b0e18] border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#0e1222] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Zap className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 font-mono">
                  Математический Тренажер & Банк Разборов
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>100+ задач</span>
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white">
                {activeTab === 'trainer' && 'Интерактивный Квиз & Тренировка'}
                {activeTab === 'library' && 'Каталог сотен разобранных задач'}
                {activeTab === 'generator' && 'Бесконечный генератор задач с шагами'}
                {activeTab === 'lab' && 'Интерактивные Весы & Лаборатория Шагов'}
              </h2>
            </div>
          </div>

          {/* Gamification Badges & Close */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#14192b] border border-white/[0.08] rounded-xl text-xs font-bold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{xp} XP</span>
            </div>

            {streak > 1 && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-orange-500/20 border border-orange-500/40 rounded-xl text-xs font-black text-orange-400 animate-pulse">
                <Flame className="w-3.5 h-3.5 fill-orange-400" />
                <span>{streak}x</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher & Quick Navigation */}
        <div className="px-4 py-2.5 bg-[#090b14] border-b border-white/[0.06] flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('trainer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'trainer'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Тренажер (Квиз)</span>
            </button>

            <button
              onClick={() => setActiveTab('library')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'library'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>📚 Банк сотен разборов</span>
            </button>

            <button
              onClick={() => setActiveTab('generator')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'generator'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>🎲 Генератор на лету</span>
            </button>

            <button
              onClick={() => setActiveTab('lab')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'lab'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>⚖️ Весы & Шаги</span>
            </button>
          </div>

          {onOpenSyntaxInspector && (
            <button
              onClick={() => {
                onOpenSyntaxInspector('2x + 10', 3);
                onClose();
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1 shrink-0"
              title="Разбор записи 2(3)+10"
            >
              <HelpCircle className="w-3 h-3 text-amber-400" />
              <span className="hidden md:inline">Скобки 2(3)</span>
            </button>
          )}
        </div>

        {/* Categories Bar */}
        <div className="px-4 py-2 bg-[#0b0e1a] border-b border-white/[0.04] flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 text-xs">
          {WORKOUT_CATEGORIES.map((cat) => {
            const isSel = selectedCategory === cat.id && !useTreeScopeOnly;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setUseTreeScopeOnly(false);
                  setTrainerIndex(0);
                  setSelectedOption(null);
                  setIsAnswered(false);
                }}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                  isSel
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <span>{cat.title}</span>
              </button>
            );
          })}

          <button
            onClick={() => {
              setUseTreeScopeOnly(true);
              setTrainerIndex(0);
              setSelectedOption(null);
              setIsAnswered(false);
            }}
            className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ml-auto shrink-0 ${
              useTreeScopeOnly
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Layers className="w-3 h-3 text-emerald-400" />
            <span>Только текущее дерево: {tree.title.slice(0, 16)}...</span>
          </button>
        </div>

        {/* Progress Bar (Trainer Tab Only) */}
        {activeTab === 'trainer' && !isFinished && (
          <div className="w-full bg-[#080a14] h-1.5 overflow-hidden shrink-0">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500 transition-all duration-300"
              style={{
                width: `${((trainerIndex + (isAnswered ? 1 : 0)) / trainerQuestions.length) * 100}%`,
              }}
            />
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* ========================================================================= */}
          {/* TAB 1: TRAINER (QUIZ MODE) */}
          {/* ========================================================================= */}
          {activeTab === 'trainer' && (
            <>
              {!isFinished && currentProblem ? (
                <>
                  {/* Problem Header Info Card */}
                  <div className="p-4 bg-[#080a14] rounded-2xl border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">
                          {currentProblem.categoryTitle}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-300">
                          Вопрос {trainerIndex + 1} из {trainerQuestions.length}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            currentProblem.difficulty === 'beginner'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : currentProblem.difficulty === 'basic'
                              ? 'bg-blue-500/20 text-blue-400'
                              : currentProblem.difficulty === 'advanced'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {currentProblem.difficulty}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{currentProblem.title}</h3>
                    </div>

                    {/* Formula Render */}
                    <div className="px-4 py-2 bg-[#0e1220] rounded-xl border border-white/[0.1] font-mono text-emerald-300 text-sm text-center shadow-sm shrink-0">
                      <MathFormula math={currentProblem.formula} />
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed bg-[#0e1222]/60 p-3.5 rounded-xl border border-white/[0.06]">
                    {currentProblem.question}
                  </div>

                  {/* Options */}
                  <div className="space-y-2.5">
                    {currentProblem.options.map((opt, idx) => {
                      const isChosen = selectedOption === idx;
                      const isCorrect = idx === currentProblem.correctIndex;

                      let btnStyle =
                        'bg-[#0d101c] hover:bg-[#131726] border-white/[0.08] text-slate-200';

                      if (isAnswered) {
                        if (isCorrect) {
                          btnStyle =
                            'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-semibold ring-1 ring-emerald-500';
                        } else if (isChosen && !isCorrect) {
                          btnStyle =
                            'bg-rose-500/20 border-rose-500/60 text-rose-200 ring-1 ring-rose-500';
                        } else {
                          btnStyle = 'bg-[#0d101c]/40 border-white/[0.04] text-slate-500 opacity-60';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isAnswered}
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-3 transition-all duration-150 ${btnStyle}`}
                        >
                          <span className="w-6 h-6 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="flex-1 leading-snug">{opt}</span>
                          {isAnswered && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          )}
                          {isAnswered && isChosen && !isCorrect && (
                            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Detailed Post-Answer Explanation Box */}
                  {isAnswered && (
                    <div
                      className={`p-4 rounded-2xl border space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                        selectedOption === currentProblem.correctIndex
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                          : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                          {selectedOption === currentProblem.correctIndex ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              <span>Браво! Ответ верный (+{50 + streak * 10} XP)</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-5 h-5 text-rose-400" />
                              <span>Неверно. Давай разберем логику шага</span>
                            </>
                          )}
                        </div>

                        {selectedOption !== currentProblem.correctIndex &&
                          onOpenDontUnderstand &&
                          currentProblem.linkedNodeId && (
                            <button
                              onClick={() => {
                                const targetNode = tree.nodes.find(
                                  (n) => n.id === currentProblem.linkedNodeId
                                );
                                if (targetNode) {
                                  onOpenDontUnderstand(targetNode);
                                  onClose();
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 text-[11px] font-semibold transition-colors"
                            >
                              <Compass className="w-3.5 h-3.5" />
                              <span>Не понимаю этот шаг ↗</span>
                            </button>
                          )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {currentProblem.explanation}
                      </p>

                      <div className="text-[11px] font-mono text-amber-300/90 pt-1 border-t border-white/[0.08] flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Правило: {currentProblem.whyRule}</span>
                      </div>

                      {/* Step-by-Step Resolution Accordion */}
                      {currentProblem.stepByStepBreakdown &&
                        currentProblem.stepByStepBreakdown.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-white/[0.08]">
                            <button
                              onClick={() => setExpandedStepBreakdown((v) => !v)}
                              className="text-xs font-bold text-indigo-300 hover:text-indigo-200 flex items-center gap-1.5 transition-colors"
                            >
                              <span>
                                {expandedStepBreakdown
                                  ? 'Скрыть пошаговый разбор'
                                  : 'Показать пошаговый разбор («как распутать»)'}
                              </span>
                              {expandedStepBreakdown ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {expandedStepBreakdown && (
                              <div className="mt-2.5 p-3 bg-black/40 rounded-xl border border-white/[0.06] space-y-1.5 animate-in fade-in duration-150">
                                {currentProblem.stepByStepBreakdown.map((step, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="flex items-start gap-2 text-xs text-slate-200"
                                  >
                                    <span className="w-4 h-4 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                      {sIdx + 1}
                                    </span>
                                    <span className="leading-snug">{step}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                      {/* Cognitive Trap Box (if exists) */}
                      {currentProblem.cognitiveTrap && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1 text-slate-200">
                          <div className="font-bold text-amber-300 flex items-center gap-1">
                            <span>⚠️ Когнитивная ловушка:</span>
                            <span className="font-normal text-white">
                              {currentProblem.cognitiveTrap.myth}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300">
                            {currentProblem.cognitiveTrap.whyBrainFails}
                          </p>
                          <div className="text-[11px] font-mono text-emerald-300">
                            Контрпример: {currentProblem.cognitiveTrap.counterExample}
                          </div>
                        </div>
                      )}

                      {/* Interactive Step Solver & Scale Integration Button */}
                      {onOpenStepSolver && currentProblem && (
                        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[11px] text-indigo-300">
                            Хочешь наглядно распутать задачу на весах с анимацией?
                          </span>
                          <button
                            onClick={() => onOpenStepSolver(currentProblem)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
                          >
                            <Scale className="w-3.5 h-3.5 text-indigo-200" />
                            <span>Решить по шагам на весах ↗</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Workout Finished Card */
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/40 animate-bounce">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Тренировка завершена!</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Твой результат: <span className="text-emerald-400 font-bold">{score}</span> из{' '}
                      <span className="text-white font-bold">{trainerQuestions.length}</span> верных
                      ответов ({Math.round((score / trainerQuestions.length) * 100)}%)
                    </p>
                    <div className="text-sm font-bold text-amber-400 mt-2 flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Заработано: +{xp} XP | Лучший стрик: {bestStreak}x</span>
                    </div>
                  </div>

                  <div className="p-4 bg-[#080a14] rounded-2xl border border-white/[0.08] max-w-sm mx-auto text-xs text-slate-300 space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Освоено в графе:</span>
                      <span className="font-bold text-emerald-400">
                        {tree.nodes.filter((n) => masteredIds.has(n.id)).length} / {tree.nodes.length}
                      </span>
                    </div>
                    <div className="w-full bg-[#131726] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            (tree.nodes.filter((n) => masteredIds.has(n.id)).length /
                              tree.nodes.length) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: LIBRARY OF 100+ PROBLEM BREAKDOWNS (КАБИНЕТ РАЗБОРОВ) */}
          {/* ========================================================================= */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              {/* Search & Stats Header */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по названию, формуле, теме или ловушке (например, 2(3), дискриминант, x+7)..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#080a14] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="px-2.5 py-2 rounded-xl bg-[#080a14] border border-white/[0.08] text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">Все сложности</option>
                    <option value="beginner">Новичок</option>
                    <option value="basic">Базовый</option>
                    <option value="advanced">Продвинутый</option>
                  </select>

                  <span className="text-xs font-mono text-slate-400 bg-white/[0.05] px-2.5 py-2 rounded-xl border border-white/[0.08] shrink-0">
                    Найдено: {libraryProblems.length}
                  </span>
                </div>
              </div>

              {/* Problems Cards List */}
              <div className="space-y-3">
                {libraryProblems.map((prob) => {
                  const isExpanded = libraryExpandedId === prob.id;

                  return (
                    <div
                      key={prob.id}
                      className="p-4 rounded-2xl bg-[#080a14] border border-white/[0.06] hover:border-indigo-500/30 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase text-indigo-400 font-mono">
                              {prob.categoryTitle}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                prob.difficulty === 'beginner'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : prob.difficulty === 'basic'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {prob.difficulty}
                            </span>
                            {prob.cognitiveTrap && (
                              <span className="text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <span>⚠️ с ловушкой</span>
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-white">{prob.title}</h4>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="px-3 py-1 bg-[#0e1220] rounded-xl border border-white/[0.1] font-mono text-emerald-300 text-xs text-center">
                            <MathFormula math={prob.formula} />
                          </div>

                          <button
                            onClick={() => setLibraryExpandedId(isExpanded ? null : prob.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <span>{isExpanded ? 'Свернуть' : 'Разбор'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Brief Question Text */}
                      <p className="text-xs text-slate-300">{prob.question}</p>

                      {/* Expanded In-Depth Breakdown */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-white/[0.08] space-y-3 animate-in fade-in duration-150">
                          {/* Answer pill */}
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-emerald-400">Правильный ответ:</span>
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg font-mono text-emerald-300 font-bold">
                              {prob.expectedAnswer}
                            </span>
                          </div>

                          {/* Full Explanation */}
                          <div className="p-3 bg-black/40 rounded-xl border border-white/[0.06] text-xs text-slate-300 leading-relaxed">
                            <strong className="text-white block mb-1">Математическое обоснование:</strong>
                            {prob.explanation}
                          </div>

                          {/* Step by step */}
                          {prob.stepByStepBreakdown && (
                            <div className="space-y-1.5">
                              <span className="text-xs font-bold text-indigo-300 block">
                                Пошаговая цепочка преобразований:
                              </span>
                              {prob.stepByStepBreakdown.map((step, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="flex items-start gap-2 text-xs text-slate-200"
                                >
                                  <span className="w-4 h-4 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                    {sIdx + 1}
                                  </span>
                                  <span className="leading-snug">{step}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Rule */}
                          <div className="text-[11px] font-mono text-amber-300 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Аксиома: {prob.whyRule}</span>
                          </div>

                          {/* Cognitive Trap */}
                          {prob.cognitiveTrap && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1 text-slate-200">
                              <div className="font-bold text-amber-300">
                                ⚠️ Ловушка: {prob.cognitiveTrap.myth}
                              </div>
                              <p className="text-[11px] text-slate-300">
                                {prob.cognitiveTrap.whyBrainFails}
                              </p>
                              <div className="text-[11px] font-mono text-emerald-300">
                                Контрпример: {prob.cognitiveTrap.counterExample}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-1">
                            {prob.linkedTreeId && onSelectTree && (
                              <button
                                onClick={() => {
                                  onSelectTree(prob.linkedTreeId!);
                                  if (prob.linkedNodeId) {
                                    onNavigateToNode(prob.linkedNodeId);
                                  }
                                  onClose();
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#14192b] hover:bg-[#1e2540] text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                              >
                                <Compass className="w-3.5 h-3.5" />
                                <span>Открыть узел в дереве знаний ↗</span>
                              </button>
                            )}

                            {onOpenSyntaxInspector &&
                              (prob.formula.includes('(') || prob.category === 'parentheses') && (
                                <button
                                  onClick={() => {
                                    onOpenSyntaxInspector('2x + 10', 3);
                                    onClose();
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                                >
                                  <HelpCircle className="w-3.5 h-3.5" />
                                  <span>Разбор скобок 2(3)</span>
                                </button>
                              )}

                            {onOpenStepSolver && (
                              <button
                                onClick={() => onOpenStepSolver(prob)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                              >
                                <Scale className="w-3.5 h-3.5" />
                                <span>Решить на весах по шагам ↗</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: INFINITE GENERATOR (ГЕНЕРАТОР НА ЛЕТУ) */}
          {/* ========================================================================= */}
          {activeTab === 'generator' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-[#0e1220] to-indigo-950/40 border border-cyan-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
                    Бесконечный генератор задач
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Параметрическая генерация вариантов с красивыми корнями
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Каждая задача генерируется со случайными коэффициентами, точными шагами и ловушками.
                  </p>
                </div>

                <button
                  onClick={handleGenerateNewProblem}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all shrink-0"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Сгенерировать другую (# {genCount})</span>
                </button>
              </div>

              {/* Dynamic Problem Display */}
              <div className="p-5 bg-[#080a14] rounded-2xl border border-white/[0.08] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
                      {genProblem.categoryTitle}
                    </span>
                    <h4 className="text-base font-black text-white">{genProblem.title}</h4>
                  </div>
                  <div className="px-4 py-2 bg-[#0e1220] rounded-xl border border-white/[0.1] font-mono text-emerald-300 text-sm text-center">
                    <MathFormula math={genProblem.formula} />
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-200">{genProblem.question}</p>

                {/* Options for Generator */}
                <div className="space-y-2.5">
                  {genProblem.options.map((opt, idx) => {
                    const isChosen = genSelectedOpt === idx;
                    const isCorrect = idx === genProblem.correctIndex;

                    let btnStyle =
                      'bg-[#0d101c] hover:bg-[#131726] border-white/[0.08] text-slate-200';

                    if (genIsAnswered) {
                      if (isCorrect) {
                        btnStyle =
                          'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-semibold ring-1 ring-emerald-500';
                      } else if (isChosen && !isCorrect) {
                        btnStyle =
                          'bg-rose-500/20 border-rose-500/60 text-rose-200 ring-1 ring-rose-500';
                      } else {
                        btnStyle = 'bg-[#0d101c]/40 border-white/[0.04] text-slate-500 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={genIsAnswered}
                        onClick={() => handleGenSelectOption(idx)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-3 transition-all ${btnStyle}`}
                      >
                        <span className="w-6 h-6 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 leading-snug">{opt}</span>
                        {genIsAnswered && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                        {genIsAnswered && isChosen && !isCorrect && (
                          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Generator Post-Answer Solution */}
                {genIsAnswered && (
                  <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 text-slate-200 space-y-3 animate-in fade-in">
                    <div className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>Автоматический пошаговый разбор сгенерированного варианта:</span>
                    </div>

                    <p className="text-xs text-slate-300">{genProblem.explanation}</p>

                    <div className="space-y-1.5 pt-1">
                      {genProblem.stepByStepBreakdown.map((st, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-200">
                          <span className="w-4 h-4 rounded-full bg-cyan-500/30 text-cyan-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="leading-snug">{st}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
                      {onOpenStepSolver && (
                        <button
                          onClick={() => onOpenStepSolver(genProblem)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <Scale className="w-3.5 h-3.5" />
                          <span>Разобрать на интерактивных весах ↗</span>
                        </button>
                      )}
                      <button
                        onClick={handleGenerateNewProblem}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 ml-auto"
                      >
                        <span>Следующий случай</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: INTERACTIVE BALANCE & STEP LAB (ВЕСЫ И ШАГИ) */}
          {/* ========================================================================= */}
          {activeTab === 'lab' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Presets Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 font-bold shrink-0 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-purple-400" />
                  <span>Уравнение:</span>
                </span>
                {LAB_PRESETS.map((p, pIdx) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectLabPreset(pIdx)}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shrink-0 ${
                      labPresetIdx === pIdx
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'bg-[#121626] text-slate-300 hover:bg-[#1a2036] border border-white/[0.06]'
                    }`}
                  >
                    {p.title.split(': ')[1] || p.title}
                  </button>
                ))}
              </div>

              {/* Balance Scale Visual Workspace */}
              <div className="p-4 sm:p-6 bg-gradient-to-b from-[#0e1224] to-[#090b14] rounded-3xl border border-purple-500/25 space-y-5 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                  <div>
                    <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider font-mono flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{LAB_PRESETS[labPresetIdx].title}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {LAB_PRESETS[labPresetIdx].description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="px-4 py-1.5 rounded-2xl bg-[#080912] border border-purple-500/40 text-emerald-300 font-mono text-base font-bold shadow-inner">
                      <MathFormula
                        math={
                          labStepHistory.length > 0
                            ? labStepHistory[labStepHistory.length - 1].equation
                            : '2x + 4 = 10'
                        }
                      />
                    </div>
                    <button
                      onClick={handleLabReset}
                      title="Сбросить уравнение в исходное состояние"
                      className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* The Physical Balance Scale Graphic */}
                <div className="relative py-4 px-2 sm:px-6 bg-[#070912]/80 rounded-2xl border border-white/[0.04] overflow-hidden">
                  {/* Balance Beam line */}
                  <div className="relative max-w-lg mx-auto">
                    {/* Beam Horizontal Bar */}
                    <div className="h-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500 rounded-full shadow-lg shadow-purple-500/20" />

                    {/* Central Fulcrum */}
                    <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-b-[28px] border-b-purple-500/40 mx-auto -mt-0.5 flex items-center justify-center relative">
                      <span className="absolute top-2 font-mono text-[10px] font-bold text-white">
                        ＝
                      </span>
                    </div>
                    <div className="w-16 h-2 bg-purple-900/60 rounded-full mx-auto mt-0.5" />

                    {/* The Pans (Left & Right) */}
                    <div className="grid grid-cols-2 gap-4 sm:gap-12 -mt-10">
                      {/* LEFT PAN */}
                      <div className="flex flex-col items-center">
                        <div className="w-full min-h-[90px] p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex flex-col items-center justify-center gap-2 relative">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                            Левая чаша
                          </span>

                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {/* Boxes for x */}
                            {Array.from({ length: Math.max(1, labA) }).map((_, i) => (
                              <div
                                key={`box_${i}`}
                                className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-indigo-700 text-white flex items-center justify-center font-mono font-bold text-sm shadow-md shadow-cyan-500/30 border border-cyan-400/40 animate-in zoom-in duration-200"
                              >
                                x
                              </div>
                            ))}

                            {/* Chips for B */}
                            {labB !== 0 && (
                              <div
                                className={`px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1 border animate-in zoom-in duration-200 ${
                                  labB > 0
                                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                    : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                                }`}
                              >
                                <span>{labB > 0 ? `+${labB} гирь` : `${labB} долг`}</span>
                              </div>
                            )}

                            {labB === 0 && labA === 1 && (
                              <span className="text-[11px] text-emerald-400 font-bold">
                                ✨ Чистый x изолирован!
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* RIGHT PAN */}
                      <div className="flex flex-col items-center">
                        <div className="w-full min-h-[90px] p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex flex-col items-center justify-center gap-2 relative">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                            Правая чаша
                          </span>

                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <div className="px-4 py-2 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 text-slate-950 font-mono font-black text-base shadow-md shadow-amber-500/30 border border-amber-300/40 animate-in zoom-in duration-200">
                              {labC}
                            </div>
                            <span className="text-[10px] text-amber-300 font-mono">
                              (вес: {labC})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-4 flex items-center justify-center">
                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Весы в идеальном математическом равновесии (=)</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Action Controls */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    <span>Выбери действие над обеими чашами:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Action 1: Remove or add B */}
                    <button
                      disabled={labB === 0}
                      onClick={handleLabSubtractB}
                      className="p-3 rounded-2xl bg-[#12172b] hover:bg-[#1a223e] disabled:opacity-40 disabled:pointer-events-none border border-cyan-500/30 text-left transition-all group"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                        <span>
                          {labB > 0
                            ? `1. Вычесть ${labB} из обеих чаш`
                            : labB < 0
                            ? `1. Прибавить ${Math.abs(labB)} к обеим чашам`
                            : `1. Свободное число уже удалено ✔`}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {labB > 0
                          ? `Снимаем одинаковое число ${labB} гирь слева и справа.`
                          : 'Компенсируем отрицательное слагаемое прибавлением.'}
                      </p>
                    </button>

                    {/* Action 2: Divide by A */}
                    <button
                      disabled={labB !== 0 || labA <= 1}
                      onClick={handleLabDivideByA}
                      className="p-3 rounded-2xl bg-[#12172b] hover:bg-[#1a223e] disabled:opacity-40 disabled:pointer-events-none border border-purple-500/30 text-left transition-all group"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                        <span>
                          {labA > 1
                            ? `2. Разделить обе чаши на ${labA}`
                            : `2. Коэффициент при x равен 1 ✔`}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Делим содержимое обеих чаш на {labA} равных кучек, чтобы узнать вес 1 коробки x.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Feedback / Solution verification note */}
                {labFeedback && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs space-y-1 animate-in fade-in duration-200 ${
                      labSolved
                        ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                        : 'bg-indigo-950/30 border-indigo-500/40 text-indigo-200'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      {labSolved ? (
                        <>
                          <Trophy className="w-4 h-4 text-emerald-400" />
                          <span>Уравнение успешно решено! (+80 XP)</span>
                        </>
                      ) : (
                        <>
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                          <span>Результат действия:</span>
                        </>
                      )}
                    </div>
                    <p className="text-slate-300 leading-relaxed">{labFeedback}</p>
                  </div>
                )}

                {/* Step-by-Step Formal Axiom History */}
                <div className="p-3.5 bg-black/40 rounded-2xl border border-white/[0.06] space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
                    <Layers className="w-3 h-3 text-purple-400" />
                    <span>История шагов и математические аксиомы:</span>
                  </div>

                  <div className="space-y-1.5">
                    {labStepHistory.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 bg-[#0c0e18] rounded-xl border border-white/[0.04] text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {sIdx}
                          </span>
                          <span className="font-mono text-emerald-300 font-bold">
                            {step.equation}
                          </span>
                          <span className="text-slate-300">— {step.action}</span>
                        </div>
                        <span className="text-[11px] text-amber-300/80 font-mono text-right">
                          {step.rule}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* External Step Solver Launcher */}
                {onOpenStepSolver && (
                  <div className="pt-1 flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-xs text-slate-400">
                      Хочешь интерактивное дерево графа или произвольное уравнение?
                    </span>
                    <button
                      onClick={() =>
                        onOpenStepSolver({
                          id: `lab_external_${labPresetIdx}`,
                          category: 'linear',
                          categoryTitle: 'Линейные уравнения',
                          difficulty: 'basic',
                          title: LAB_PRESETS[labPresetIdx].title,
                          formula: LAB_PRESETS[labPresetIdx].description,
                          question: `Решите уравнение: ${LAB_PRESETS[labPresetIdx].title}`,
                          options: ['x = 3', 'x = 5', 'x = 7', 'x = 2'],
                          correctIndex: 0,
                          explanation: 'Решение через вычитание константы и деление на коэффициент.',
                          whyRule: 'Инвариантность равенства: f(a) = f(b)',
                          stepByStepBreakdown: labStepHistory.map((h) => `${h.action} -> ${h.equation}`),
                        })
                      }
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
                    >
                      <Scale className="w-4 h-4" />
                      <span>Открыть в полноэкранном решателе (Visual Step Solver) ↗</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-white/[0.08] flex items-center justify-between bg-[#0e1222] shrink-0">
          {activeTab === 'trainer' && !isFinished ? (
            <>
              <button
                onClick={() => {
                  if (currentProblem?.linkedNodeId) {
                    onNavigateToNode(currentProblem.linkedNodeId);
                    onClose();
                  }
                }}
                disabled={!currentProblem?.linkedNodeId}
                className="text-xs text-slate-400 hover:text-white disabled:opacity-40 flex items-center gap-1 transition-colors"
              >
                <span>Показать концепт в карте</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                disabled={!isAnswered}
                onClick={handleNextProblem}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
              >
                <span>
                  {trainerIndex === trainerQuestions.length - 1
                    ? 'Завершить'
                    : 'Следующий вопрос'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : activeTab === 'trainer' && isFinished ? (
            <div className="w-full flex items-center justify-center gap-3">
              <button
                onClick={handleRestartTrainer}
                className="px-4 py-2 rounded-xl bg-[#14192b] hover:bg-[#1f2642] text-slate-200 border border-white/[0.1] text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Пройти заново</span>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
              >
                Вернуться к карте знаний
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {activeTab === 'library'
                  ? 'Выбирай любую задачу для мгновенного разбора'
                  : activeTab === 'lab'
                  ? 'Управляй чашами весов и изолируй переменную x'
                  : 'Генерируй неограниченное число примеров'}
              </span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-semibold transition-all"
              >
                Закрыть
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
