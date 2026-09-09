import React, { useState, useEffect, useMemo } from 'react';
import { MathNode, MathTree } from '../types';
import { renderTeX, buildDiagnosticChainForNode, DynamicDiagnosticItem } from '../utils/mathEngine';
import { api } from '../utils/apiClient';
import {
  Compass,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ChevronDown,
  X,
  Target,
  Search,
  BookOpen,
  Layers,
  Lightbulb,
  CornerDownRight
} from 'lucide-react';
import { fetchAi } from '../context/UserAiContext';

interface DeepGapFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tree: MathTree;
  trees?: MathTree[];
  initialNode?: MathNode | null;
  masteredIds?: Set<string>;
  onNavigateToNode: (nodeId: string) => void;
  onSelectTree?: (treeId: string) => void;
}

export const DeepGapFinderModal: React.FC<DeepGapFinderModalProps> = ({
  isOpen,
  onClose,
  tree,
  trees = [],
  initialNode = null,
  masteredIds = new Set(),
  onNavigateToNode,
  onSelectTree,
}) => {
  // Currently selected tree for diagnosis
  const [activeTreeId, setActiveTreeId] = useState<string>(tree.id);

  const currentTree = useMemo(() => {
    return trees.find((t) => t.id === activeTreeId) || tree;
  }, [trees, activeTreeId, tree]);

  // Target node that user doesn't understand
  const [selectedNodeId, setSelectedNodeId] = useState<string>(() => {
    if (initialNode && currentTree.nodes.some((n) => n.id === initialNode.id)) {
      return initialNode.id;
    }
    const goal = currentTree.nodes.find((n) => n.type === 'goal');
    return goal ? goal.id : currentTree.nodes[0]?.id || '';
  });

  // Custom text for user to describe what they don't understand
  const [customQuery, setCustomQuery] = useState('');
  const [isAiDiagnosing, setIsAiDiagnosing] = useState(false);
  const [aiDiagnosticResult, setAiDiagnosticResult] = useState<{
    missingConcept?: string;
    explanation?: string;
    recommendedNodeId?: string;
    questions?: string[];
  } | null>(null);

  // Search filter for nodes inside the picker
  const [nodeSearch, setNodeSearch] = useState('');
  const [showNodePicker, setShowNodePicker] = useState(false);

  // Update selection if tree or initialNode changes when opening
  useEffect(() => {
    if (isOpen) {
      setActiveTreeId(tree.id);
      if (initialNode && tree.nodes.some((n) => n.id === initialNode.id)) {
        setSelectedNodeId(initialNode.id);
      } else {
        const goal = tree.nodes.find((n) => n.type === 'goal');
        setSelectedNodeId(goal ? goal.id : tree.nodes[0]?.id || '');
      }
      setCustomQuery('');
      setAiDiagnosticResult(null);
      setCurrentIndex(0);
      setDiagnosedGap(null);
      setSolidGround(null);
      setExpandedHint(false);
    }
  }, [isOpen, initialNode, tree]);

  const targetNode = useMemo(() => {
    return currentTree.nodes.find((n) => n.id === selectedNodeId) || currentTree.nodes[0];
  }, [currentTree, selectedNodeId]);

  // Dynamic question chain from target down to layer 0
  const questions: DynamicDiagnosticItem[] = useMemo(() => {
    if (!targetNode) return [];
    return buildDiagnosticChainForNode(targetNode, currentTree.nodes);
  }, [targetNode, currentTree]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [diagnosedGap, setDiagnosedGap] = useState<DynamicDiagnosticItem | null>(null);
  const [solidGround, setSolidGround] = useState<DynamicDiagnosticItem | null>(null);
  const [expandedHint, setExpandedHint] = useState<boolean>(false);

  if (!isOpen || !targetNode) return null;

  const currentQ = questions[currentIndex] || questions[0];

  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setShowNodePicker(false);
    setCurrentIndex(0);
    setDiagnosedGap(null);
    setSolidGround(null);
    setExpandedHint(false);
    setAiDiagnosticResult(null);
  };

  const handleUnderstand = () => {
    setExpandedHint(false);
    if (currentIndex === 0) {
      // User understands the top level
      setSolidGround(currentQ);
      setDiagnosedGap(null);
      return;
    }

    // Solid ground found! The previous level was the first gap
    setSolidGround(currentQ);
    const gap = questions[currentIndex - 1];
    setDiagnosedGap(gap);
    if (gap && targetNode) {
      api.recordCognitiveGap(gap.targetNodeId, targetNode.id, gap.conceptTitle, gap.explanationIfUnknown);
    }
  };

  const handleDontUnderstand = () => {
    setExpandedHint(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Even the bottom level is unknown
      const gap = questions[questions.length - 1];
      setDiagnosedGap(gap);
      setSolidGround(null);
      if (gap && targetNode) {
        api.recordCognitiveGap(gap.targetNodeId, targetNode.id, gap.conceptTitle, gap.explanationIfUnknown);
      }
    }
  };

  const resetDiagnostic = () => {
    setCurrentIndex(0);
    setDiagnosedGap(null);
    setSolidGround(null);
    setExpandedHint(false);
  };

  // AI Diagnostic when user enters custom text
  const handleAiDiagnose = async () => {
    if (!customQuery.trim()) return;
    setIsAiDiagnosing(true);
    setAiDiagnosticResult(null);
    try {
      const response = await fetchAi('/api/ai/diagnose-stuck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treeTitle: currentTree.title,
          activeFormula: targetNode.formula,
          userEquation: customQuery,
          recentSteps: [targetNode.title, targetNode.explanationHuman],
        }),
      });
      const data = await response.json();
      if (data.success && data.diagnosis) {
        setAiDiagnosticResult({
          missingConcept: data.diagnosis.missingFoundationalConcept,
          explanation: data.diagnosis.explanation,
          recommendedNodeId: data.diagnosis.recommendedPrerequisiteNodeId,
          questions: data.diagnosis.remedialStepQuestions,
        });

        // If matched a node in current tree, jump to it
        if (data.diagnosis.recommendedPrerequisiteNodeId) {
          const matched = currentTree.nodes.find(
            (n) => n.id === data.diagnosis.recommendedPrerequisiteNodeId
          );
          if (matched) {
            setSelectedNodeId(matched.id);
          }
        }
      }
    } catch (err) {
      console.error('AI diagnosis error:', err);
    } finally {
      setIsAiDiagnosing(false);
    }
  };

  const filteredNodes = currentTree.nodes.filter((n) =>
    n.title.toLowerCase().includes(nodeSearch.toLowerCase()) ||
    n.formula.toLowerCase().includes(nodeSearch.toLowerCase())
  );

  return (
    <div
      id="deep-gap-finder-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-[#0b0e18] border border-white/[0.12] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/[0.08] bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white leading-tight">
                  Диагностика корней: «Я не понимаю»
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Любой концепт
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Выберите, в чём именно затык — найдём твёрдую опору и точный пробел
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Node & Concept Selector Toolbar */}
        <div className="p-3.5 bg-[#070911] border-b border-white/[0.06] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              Что именно тебе непонятно?
            </span>

            {/* Tree Switcher if multiple trees */}
            {trees.length > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Тема:</span>
                <select
                  value={activeTreeId}
                  onChange={(e) => {
                    const newTreeId = e.target.value;
                    setActiveTreeId(newTreeId);
                    const nextTree = trees.find((t) => t.id === newTreeId);
                    if (nextTree) {
                      const goal = nextTree.nodes.find((n) => n.type === 'goal');
                      setSelectedNodeId(goal ? goal.id : nextTree.nodes[0]?.id || '');
                    }
                    setCurrentIndex(0);
                    setDiagnosedGap(null);
                    setSolidGround(null);
                    setExpandedHint(false);
                    setAiDiagnosticResult(null);
                    if (onSelectTree) onSelectTree(newTreeId);
                  }}
                  className="bg-[#121626] border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {trees.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Active Target Node Chip with Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowNodePicker(!showNodePicker)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#121626] hover:bg-[#161c30] border border-indigo-500/30 transition-all text-left group"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                <span className="text-xs font-bold text-white truncate">{targetNode.title}</span>
                <span className="text-[11px] text-indigo-300 font-mono shrink-0 bg-indigo-500/20 px-2 py-0.5 rounded">
                  {targetNode.formula}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">
                  (Уровень {targetNode.layer})
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-indigo-400 group-hover:text-indigo-300 shrink-0 font-medium">
                <span>Выбрать другой узел</span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            {/* Dropdown Node List */}
            {showNodePicker && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#0d1120] border border-white/10 rounded-xl shadow-2xl p-2.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Поиск по названию или формуле узла..."
                    value={nodeSearch}
                    onChange={(e) => setNodeSearch(e.target.value)}
                    className="w-full bg-[#060810] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  {filteredNodes.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => handleSelectNode(node.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                        node.id === selectedNodeId
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'hover:bg-white/[0.06] text-slate-300'
                      }`}
                    >
                      <span className="truncate">{node.title}</span>
                      <span className="font-mono text-[11px] text-indigo-300 ml-2 shrink-0">
                        {node.formula}
                      </span>
                    </button>
                  ))}
                  {filteredNodes.length === 0 && (
                    <div className="text-center py-2 text-xs text-slate-500">Узлы не найдены</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Custom Input for User: "Или напишите, где затык" */}
          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              placeholder="Или опишите своими словами (например: не понимаю знак минус при переносе)..."
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiDiagnose()}
              className="flex-1 bg-[#090c16] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleAiDiagnose}
              disabled={isAiDiagnosing || !customQuery.trim()}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
              title="ИИ найдет корневую причину вашего вопроса"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isAiDiagnosing ? 'animate-spin' : ''}`} />
              <span>{isAiDiagnosing ? 'ИИ ищет...' : 'ИИ-диагностика'}</span>
            </button>
          </div>

          {/* AI Diagnosis Box if received */}
          {aiDiagnosticResult && (
            <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between font-bold text-indigo-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Диагноз ИИ: {aiDiagnosticResult.missingConcept || 'Базовый концепт'}
                </span>
                <button
                  onClick={() => setAiDiagnosticResult(null)}
                  className="text-slate-400 hover:text-white text-[10px]"
                >
                  Закрыть
                </button>
              </div>
              <p className="text-slate-200 leading-relaxed">{aiDiagnosticResult.explanation}</p>
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col justify-between">
          {/* Active Diagnostic Descent */}
          {!diagnosedGap && !solidGround && currentQ && (
            <div className="flex flex-col animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-indigo-400 uppercase tracking-wider">
                  Шаг спуска {currentIndex + 1} из {questions.length}
                </span>
                <span className="text-slate-400">
                  Уровень {currentQ.layer} {currentQ.layer === 0 ? '(Фундамент/Аксиомы)' : ''}
                </span>
              </div>

              {/* Formula & Concept Preview Card */}
              <div className="p-4 bg-[#05060c] rounded-2xl border border-white/[0.08] text-center my-2 shadow-inner">
                <div
                  className="text-xl sm:text-2xl font-serif text-white mb-2"
                  dangerouslySetInnerHTML={{ __html: renderTeX(currentQ.formula, true) }}
                />
                <div className="text-sm text-indigo-300 font-bold">{currentQ.conceptTitle}</div>
              </div>

              {/* Diagnostic Question Text */}
              <p className="text-sm sm:text-base text-slate-200 text-center font-medium my-3 leading-snug">
                {currentQ.questionText}
              </p>

              {/* Expandable Hint / Context */}
              <div className="text-center mb-4">
                {!expandedHint ? (
                  <button
                    onClick={() => setExpandedHint(true)}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-amber-300 transition-colors"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>Показать подсказку / суть концепта</span>
                  </button>
                ) : (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 text-left leading-relaxed animate-in fade-in duration-150">
                    <div className="font-bold text-amber-300 mb-1 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5" />
                      Суть концепта:
                    </div>
                    <p>{currentQ.explanationIfUnknown}</p>
                  </div>
                )}
              </div>

              {/* Decision Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <button
                  onClick={handleUnderstand}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Да, это мне понятно</span>
                </button>

                <button
                  onClick={handleDontUnderstand}
                  className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Нет, не понимаю (спуститься глубже)</span>
                </button>
              </div>
            </div>
          )}

          {/* Gap Pinpointed Result */}
          {diagnosedGap && (
            <div className="flex flex-col animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>КОРНЕВАЯ ПРИЧИНА НАЙДЕНА!</span>
              </div>

              <h3 className="text-lg font-bold text-white mb-1">
                Твой ключевой пробел: {diagnosedGap.conceptTitle}
              </h3>

              {solidGround ? (
                <div className="text-xs text-slate-300 mb-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  Твердая почва под ногами: <strong className="text-emerald-300">{solidGround.conceptTitle}</strong>.
                  Ты понимаешь этот базис, но спотыкаешься сразу над ним — на шаге «{diagnosedGap.conceptTitle}».
                </div>
              ) : (
                <div className="text-xs text-slate-400 mb-4">
                  Пробел находится на самом фундаментальном уровне. Начнем восстановление с азов!
                </div>
              )}

              {/* Deep Gap Details */}
              <div className="p-4 bg-[#05060c] border border-amber-500/30 rounded-2xl my-2">
                <div className="text-xs text-amber-300 font-bold uppercase tracking-wider mb-1">
                  Что необходимо разобрать:
                </div>
                <div
                  className="text-lg font-serif text-white mb-2"
                  dangerouslySetInnerHTML={{ __html: renderTeX(diagnosedGap.formula) }}
                />
                <p className="text-xs text-slate-200 leading-relaxed">
                  {diagnosedGap.explanationIfUnknown}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5 mt-5">
                <button
                  onClick={() => {
                    onNavigateToNode(diagnosedGap.targetNodeId);
                    onClose();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  <Target className="w-4 h-4" />
                  <span>Перейти к узлу пробела на карте</span>
                </button>

                <button
                  onClick={resetDiagnostic}
                  className="py-3 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                  title="Пройти диагностику заново"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Заново</span>
                </button>
              </div>
            </div>
          )}

          {/* Understands All Roots */}
          {solidGround && !diagnosedGap && (
            <div className="p-6 text-center animate-in fade-in duration-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 shadow-[0_0_20px_rgba(52,211,153,0.3)] rounded-full" />
              <h3 className="text-lg font-bold text-white mb-2">
                Ты отлично понимаешь «{targetNode.title}»!
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto mb-5 leading-relaxed">
                Все фундаментальные кирпичики и свойства этого узла ясны. Ты готов двигаться дальше или разобрать следующий узел.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={resetDiagnostic}
                  className="py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold transition-colors"
                >
                  Проверить другой узел
                </button>
                <button
                  onClick={onClose}
                  className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
                >
                  Вернуться к карте
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
