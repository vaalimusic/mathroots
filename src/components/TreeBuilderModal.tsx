import React, { useState, useEffect } from 'react';
import { MathNode, MathTree, NodeType, BranchType } from '../types';
import { INITIAL_TREES } from '../data/trees';
import { MathFormula } from './MathFormula';
import { calculateTreeCoordinates } from '../utils/mathEngine';
import {
  Plus,
  Trash2,
  Sparkles,
  Save,
  Check,
  ArrowRight,
  GitBranch,
  Layers,
  HelpCircle,
  Code,
  BookOpen,
  Wand2,
  X,
  Compass,
  Download,
  Upload,
  FileJson,
  Copy,
  FileUp,
  Lock,
  Crown
} from 'lucide-react';
import { useLicense } from '../context/LicenseContext';

interface TreeBuilderModalProps {
  isOpen: boolean;
  activeTree: MathTree;
  masteredIds: Set<string>;
  initialPrompt?: string;
  onClose: () => void;
  onSaveTree: (newTree: MathTree) => void;
}

export const TreeBuilderModal: React.FC<TreeBuilderModalProps> = ({
  isOpen,
  activeTree,
  masteredIds,
  initialPrompt,
  onClose,
  onSaveTree,
}) => {
  const { isPro, openUpgradeModal } = useLicense();
  const [treeTitle, setTreeTitle] = useState(activeTree.title);
  const [goalFormula, setGoalFormula] = useState(activeTree.goalFormula);
  const [category, setCategory] = useState(activeTree.category);
  const [description, setDescription] = useState(activeTree.description);
  const [nodes, setNodes] = useState<MathNode[]>(activeTree.nodes);

  // AI Generator prompt input
  const [aiPrompt, setAiPrompt] = useState(initialPrompt || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialPrompt) {
        setAiPrompt(initialPrompt);
        setTreeTitle(initialPrompt);
        setGoalFormula(initialPrompt);
      } else {
        setTreeTitle(activeTree.title);
        setGoalFormula(activeTree.goalFormula);
        setCategory(activeTree.category);
        setDescription(activeTree.description);
        setNodes(activeTree.nodes);
      }
      setGenError(null);
      setAiSuccessMessage(null);
      setEditingNodeId(null);
    }
  }, [isOpen, initialPrompt, activeTree]);

  // New node form state
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formFormula, setFormFormula] = useState('');
  const [formLayer, setFormLayer] = useState<number>(1);
  const [formType, setFormType] = useState<NodeType>('concept');
  const [formBranch, setFormBranch] = useState<BranchType>('main');
  const [formExplanation, setFormExplanation] = useState('');
  const [formWhy, setFormWhy] = useState('');
  const [formPracticeQ, setFormPracticeQ] = useState('');
  const [formPracticeAns, setFormPracticeAns] = useState('');
  const [formRequires, setFormRequires] = useState<string[]>([]);
  const [cycleWarning, setCycleWarning] = useState<string | null>(null);

  // Export and Import JSON states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copiedExport, setCopiedExport] = useState(false);

  // Export current tree to JSON
  const handleExportJson = () => {
    const exportData: MathTree = {
      id: `custom_tree_${Date.now()}`,
      title: treeTitle,
      goalFormula: goalFormula,
      category: category || 'Пользовательские деревья',
      description: description,
      nodes,
      branches: [
        {
          id: 'main',
          label: 'Основное решение',
          description: 'Пошаговый путь',
          formula: goalFormula,
          color: '#6366f1',
        },
      ],
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${treeTitle.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}_tree.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (navigator.clipboard) {
      navigator.clipboard.writeText(jsonString);
      setCopiedExport(true);
      setTimeout(() => setCopiedExport(false), 2500);
    }
  };

  // Import JSON handler
  const handleProcessImport = (rawText: string) => {
    try {
      setImportError(null);
      const parsed = JSON.parse(rawText.trim());

      let importedTree: Partial<MathTree> = {};
      if (Array.isArray(parsed)) {
        importedTree = {
          title: 'Импортированное дерево',
          goalFormula: parsed[0]?.formula || 'x = ?',
          nodes: parsed,
        };
      } else if (parsed && typeof parsed === 'object') {
        importedTree = parsed;
      } else {
        throw new Error('Некорректный формат JSON (ожидается объект или массив узлов)');
      }

      if (!importedTree.nodes || !Array.isArray(importedTree.nodes) || importedTree.nodes.length === 0) {
        throw new Error('Дерево должно содержать массив "nodes" с хотя бы одним узлом.');
      }

      // Validate nodes
      const validatedNodes: MathNode[] = importedTree.nodes.map((n: any, idx: number) => ({
        id: n.id || `imported_node_${idx}_${Date.now()}`,
        title: n.title || `Узел ${idx + 1}`,
        formula: n.formula || 'x',
        layer: typeof n.layer === 'number' ? n.layer : 1,
        type: n.type || 'concept',
        branch: n.branch || 'main',
        x: typeof n.x === 'number' ? n.x : 0,
        y: typeof n.y === 'number' ? n.y : idx * 120,
        requires: Array.isArray(n.requires) ? n.requires : [],
        explanationHuman: n.explanationHuman || 'Импортированное объяснение.',
        formalRule: n.formalRule || n.formula || '',
        visualSteps: Array.isArray(n.visualSteps) ? n.visualSteps : [n.formula || ''],
        whyCanIDoThis: n.whyCanIDoThis || 'Математическое обоснование шага.',
        practiceExercise: n.practiceExercise,
        presentations: n.presentations,
        counterExample: n.counterExample,
      }));

      if (importedTree.title) setTreeTitle(importedTree.title);
      if (importedTree.goalFormula) setGoalFormula(importedTree.goalFormula);
      if (importedTree.description) setDescription(importedTree.description);
      if (importedTree.category) setCategory(importedTree.category);
      setNodes(validatedNodes);

      setShowImportModal(false);
      setImportJsonText('');
    } catch (err: any) {
      setImportError(err.message || 'Ошибка парсинга JSON. Проверьте синтаксис.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportJsonText(text);
        handleProcessImport(text);
      }
    };
    reader.readAsText(file);
  };

  // Cycle detection logic (Section 36)
  const detectCycle = (targetId: string, dependencies: string[]): boolean => {
    const visited = new Set<string>();
    const queue = [...dependencies];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === targetId) return true;
      if (!visited.has(curr)) {
        visited.add(curr);
        const depNode = nodes.find((n) => n.id === curr);
        if (depNode?.requires) {
          queue.push(...depNode.requires);
        }
      }
    }
    return false;
  };

  const handleRequiresChange = (newRequires: string[]) => {
    setFormRequires(newRequires);
    if (editingNodeId && detectCycle(editingNodeId, newRequires)) {
      setCycleWarning('Эта связь создаёт циклическую prerequisite-зависимость');
    } else {
      setCycleWarning(null);
    }
  };

  if (!isOpen) return null;

  // Load full preset tree from catalog
  const handleLoadPresetTree = (preset: MathTree) => {
    setTreeTitle(preset.title);
    setGoalFormula(preset.goalFormula);
    setCategory(preset.category);
    setDescription(preset.description);
    setNodes(preset.nodes);
    setAiPrompt(preset.goalFormula || preset.title);
    setAiSuccessMessage(`✨ Загружено эталонное дерево: «${preset.title}» (${preset.nodes.length} корней)!`);
    setGenError(null);
  };

  // Handle AI Auto-decompose
  const handleAiDecompose = async (promptOverride?: string) => {
    const targetPrompt = (typeof promptOverride === 'string' ? promptOverride : aiPrompt).trim();
    if (!targetPrompt) return;
    setIsGenerating(true);
    setGenError(null);
    setAiSuccessMessage(null);

    try {
      const response = await fetch('/api/ai/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: targetPrompt,
          masteredTopics: Array.from(masteredIds),
        }),
      });

      const data = await response.json();
      if (data.success && data.tree && Array.isArray(data.tree.nodes) && data.tree.nodes.length > 0) {
        setTreeTitle(data.tree.title || targetPrompt);
        setGoalFormula(data.tree.goalFormula || targetPrompt);
        setDescription(data.tree.summary || `Сгенерированное дерево математических корней для: ${targetPrompt}`);

        // Normalize and compute coordinates
        const rawNodes: MathNode[] = data.tree.nodes.map((n: any, idx: number) => ({
          id: n.id || `node_${idx}_${Date.now()}`,
          title: n.title || `Узел ${idx + 1}`,
          formula: n.formula || targetPrompt,
          layer: typeof n.layer === 'number' ? n.layer : (idx === 0 ? 0 : idx === data.tree.nodes.length - 1 ? 3 : 1),
          type: (n.type as NodeType) || (idx === data.tree.nodes.length - 1 ? 'goal' : idx === 0 ? 'axiom' : 'step'),
          branch: (n.branch as BranchType) || 'main',
          x: typeof n.x === 'number' ? n.x : 0,
          y: typeof n.y === 'number' ? n.y : 0,
          requires: Array.isArray(n.requires) ? n.requires : [],
          explanationHuman: n.explanationHuman || 'Шаг математического решения.',
          formalRule: n.formalRule || 'Свойство алгебраического преобразования.',
          visualSteps: Array.isArray(n.visualSteps) ? n.visualSteps : [n.formula || targetPrompt],
          whyCanIDoThis: n.whyCanIDoThis || 'Обоснование математического перехода.',
          practiceExercise: n.practiceExercise,
        }));

        // Automatically position nodes neatly in multi-column layout
        const positionedNodes = calculateTreeCoordinates(rawNodes, true);
        setNodes(positionedNodes);
        setAiSuccessMessage(`✨ Успешно декомпозировано на ${positionedNodes.length} взаимосвязанных узлов!`);
        setIsGenerating(false);
        return;
      }
    } catch (e: any) {
      console.warn('AI generate failed, using local template decomposition:', e);
      setGenError('Сервер AI был временно недоступен, использован локальный шаблонизатор.');
    }

    // Local smart fallback generator
    const ts = Date.now();
    const baseId = `node_base_${ts}`;
    const step1Id = `node_step1_${ts}`;
    const goalId = `node_goal_${ts}`;

    const templateNodes: MathNode[] = [
      {
        id: baseId,
        title: 'Основы равенств и арифметики',
        formula: 'a = b \\implies a \\pm c = b \\pm c',
        layer: 0,
        type: 'axiom',
        branch: 'main',
        x: -180,
        y: 500,
        requires: [],
        explanationHuman: 'Фундаментальное правило: любые обратимые операции над обеими частями сохраняют истинность.',
        formalRule: 'Аксиома эквивалентности.',
        visualSteps: ['Левая часть = Правая часть', 'Одинаковое преобразование с обеих сторон'],
        whyCanIDoThis: 'Сохранение равенства.',
      },
      {
        id: step1Id,
        title: 'Шаг 1: Изоляция переменной',
        formula: targetPrompt,
        layer: 1,
        type: 'step',
        branch: 'main',
        x: 0,
        y: 300,
        requires: [baseId],
        explanationHuman: 'Сгруппируйте слагаемые с неизвестными в одну сторону, а свободные коэффициенты — в другую.',
        formalRule: 'Перенос слагаемых с изменением знака.',
        visualSteps: ['Перенос свободных членов', 'Приведение подобных слагаемых'],
        whyCanIDoThis: 'Вычитание одного и того же значения из обеих частей уравнения.',
      },
      {
        id: goalId,
        title: `Цель: ${targetPrompt}`,
        formula: targetPrompt,
        layer: 2,
        type: 'goal',
        branch: 'main',
        x: 0,
        y: 80,
        requires: [step1Id],
        explanationHuman: 'Получение явного ответа для неизвестной переменной и финальная проверка подстановкой.',
        formalRule: 'Проверка путем вычисления тождества.',
        visualSteps: ['Подстановка корня', 'Проверка истинности'],
        whyCanIDoThis: 'Единственность решения.',
      },
    ];

    const positioned = calculateTreeCoordinates(templateNodes, true);
    setTreeTitle(targetPrompt);
    setGoalFormula(targetPrompt);
    setDescription(`Математическое дерево корней для задачи: ${targetPrompt}`);
    setNodes(positioned);
    setAiSuccessMessage(`✨ Создан базовый каркас из ${positioned.length} узлов.`);
    setIsGenerating(false);
  };

  // Add or update node
  const handleSaveNode = () => {
    if (!formTitle.trim() || !formFormula.trim()) return;

    if (editingNodeId) {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === editingNodeId
            ? {
                ...n,
                title: formTitle,
                formula: formFormula,
                layer: formLayer,
                type: formType,
                branch: formBranch,
                explanationHuman: formExplanation || n.explanationHuman,
                whyCanIDoThis: formWhy || n.whyCanIDoThis,
                requires: formRequires,
                practiceExercise: formPracticeQ
                  ? { question: formPracticeQ, expectedAnswer: formPracticeAns }
                  : undefined,
              }
            : n
        )
      );
    } else {
      const newNode: MathNode = {
        id: `custom_node_${Date.now()}`,
        title: formTitle,
        formula: formFormula,
        layer: formLayer,
        type: formType,
        branch: formBranch,
        x: 0,
        y: 0,
        requires: formRequires,
        explanationHuman: formExplanation || 'Пользовательское объяснение узла.',
        formalRule: formFormula,
        visualSteps: [formFormula],
        whyCanIDoThis: formWhy || 'Обоснование математического шага.',
        practiceExercise: formPracticeQ
          ? { question: formPracticeQ, expectedAnswer: formPracticeAns }
          : undefined,
      };
      setNodes((prev) => [...prev, newNode]);
    }

    // Reset form
    setEditingNodeId(null);
    setFormTitle('');
    setFormFormula('');
    setFormExplanation('');
    setFormWhy('');
    setFormPracticeQ('');
    setFormPracticeAns('');
    setFormRequires([]);
  };

  const handleDeleteNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleEditClick = (node: MathNode) => {
    setEditingNodeId(node.id);
    setFormTitle(node.title);
    setFormFormula(node.formula);
    setFormLayer(node.layer);
    setFormType(node.type);
    setFormBranch(node.branch || 'main');
    setFormExplanation(node.explanationHuman);
    setFormWhy(node.whyCanIDoThis);
    setFormRequires(node.requires || []);
    if (node.practiceExercise) {
      setFormPracticeQ(node.practiceExercise.question);
      setFormPracticeAns(node.practiceExercise.expectedAnswer);
    } else {
      setFormPracticeQ('');
      setFormPracticeAns('');
    }
  };

  const handleFinalSaveTree = () => {
    const newTree: MathTree = {
      id: `custom_tree_${Date.now()}`,
      title: treeTitle,
      goalFormula: goalFormula,
      category: category || 'Пользовательские деревья',
      description: description,
      nodes,
      branches: [
        {
          id: 'main',
          label: 'Основное решение',
          description: 'Пошаговый путь',
          formula: goalFormula,
          color: '#6366f1',
        },
      ],
    };
    onSaveTree(newTree);
    onClose();
  };

  return (
    <div
      id="tree-builder-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050507]/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl bg-[#0a0d16] rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col h-[92vh] text-slate-100">
        {/* Top Header */}
        <div className="p-5 border-b border-white/[0.08] bg-[#0d101a]/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-950/50">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Конструктор математического дерева (Builder Mode)
              </h2>
              <p className="text-xs text-slate-400">
                Введи любую задачу или настрой узлы, связи «A требует B», формулы и способы решения вручную
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-import-tree-json"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-white/[0.1] transition-all"
              title="Импортировать дерево из JSON файла или текста"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Импорт JSON</span>
            </button>

            <button
              type="button"
              id="btn-export-tree-json"
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-white/[0.1] transition-all"
              title="Скачать дерево как .json файл и скопировать в буфер обмена"
            >
              {copiedExport ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Скопировано!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Экспорт JSON</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Auto-Decompose Quick Banner */}
        <div className="px-6 py-4 bg-indigo-950/30 border-b border-indigo-500/20 flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm whitespace-nowrap">
              <Wand2 className="w-4 h-4 text-indigo-400" />
              <span>AI Авто-декомпозиция:</span>
              {!isPro && (
                <button
                  type="button"
                  onClick={() => openUpgradeModal('Безлимитный AI разбор произвольных задач')}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 hover:bg-amber-500/25 transition-colors cursor-pointer"
                  title="Нажмите для разблокировки безлимитной декомпозиции PRO"
                >
                  <Lock className="w-2.5 h-2.5" />
                  <span>PRO</span>
                </button>
              )}
            </div>

            <div className="flex-1 flex items-center gap-2">
              <input
                id="ai-builder-prompt-input"
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && aiPrompt.trim() && !isGenerating) {
                    handleAiDecompose();
                  }
                }}
                placeholder="Например: 2x + 6 = 14 или x^2 - 5x + 6 = 0 или Теорема Пифагора..."
                className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-indigo-500/30 bg-[#060810] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                id="btn-ai-generate-tree"
                onClick={() => handleAiDecompose()}
                disabled={isGenerating || !aiPrompt.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-950/50 flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGenerating ? 'Строим корни...' : 'Разобрать на корни'}</span>
              </button>
            </div>
          </div>

          {/* Quick Problem Chips & Status */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 font-medium">Быстрые примеры:</span>
              {[
                '2x + 6 = 14',
                'x^2 - 5x + 6 = 0',
                '3(x - 2) = 15',
                'a^2 + b^2 = c^2',
                'log_2(x) + log_2(x-2) = 3',
              ].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setAiPrompt(ex);
                    handleAiDecompose(ex);
                  }}
                  className="px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-200 border border-white/[0.08] hover:border-indigo-500/40 transition-colors font-mono"
                >
                  {ex}
                </button>
              ))}
            </div>

            {aiSuccessMessage && (
              <span className="text-emerald-400 font-medium animate-fadeIn">
                {aiSuccessMessage}
              </span>
            )}
            {genError && (
              <span className="text-amber-400 font-medium">
                {genError}
              </span>
            )}
          </div>

          {/* Presets Catalog Bar */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/[0.06] text-xs">
            <span className="text-indigo-300 font-medium flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Готовые эталонные деревья:
            </span>
            {INITIAL_TREES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleLoadPresetTree(t)}
                className={`px-2.5 py-1 rounded-lg border transition-all text-left flex items-center gap-1.5 ${
                  treeTitle === t.title
                    ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/60 shadow-sm shadow-indigo-950/50'
                    : 'bg-white/[0.03] text-slate-300 hover:text-white border-white/[0.07] hover:border-indigo-500/30 hover:bg-white/[0.07]'
                }`}
                title={`${t.description || t.title} (${t.nodes.length} узлов)`}
              >
                <span className="font-semibold">{t.title}</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-white/10 text-slate-400 font-mono">
                  {t.nodes.length} узл.
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Split Body: Node List (Left) and Node Editor / Tree Settings (Right) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left Column: Nodes in Tree (7 cols) */}
          <div className="md:col-span-7 border-r border-white/[0.08] overflow-y-auto p-6 space-y-4 bg-[#080a12]/50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-white">
                Узлы в дереве ({nodes.length})
              </div>
              <span className="text-xs text-slate-400 font-mono">
                От Layer 0 (Корни) до Layer {Math.max(...nodes.map((n) => n.layer), 0)} (Цель)
              </span>
            </div>

            <div className="space-y-2.5">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    editingNodeId === node.id
                      ? 'bg-[#14192b] border-indigo-500/50 shadow-md shadow-indigo-950/50'
                      : 'bg-[#0e121e] border-white/[0.06] hover:border-white/[0.15]'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-white/[0.06] text-slate-300 border border-white/10">
                        Layer {node.layer} · {node.type}
                      </span>
                      {node.branch && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                          {node.branch}
                        </span>
                      )}
                      <h4 className="text-sm font-bold text-white">{node.title}</h4>
                    </div>

                    <div className="text-xs text-emerald-300 font-mono py-0.5">
                      <MathFormula math={node.formula} />
                    </div>

                    {node.requires && node.requires.length > 0 && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <span className="font-semibold text-slate-300">Требует:</span>
                        <span>{node.requires.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditClick(node)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-white/[0.06] text-xs font-semibold"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDeleteNode(node.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Node Form & Tree Metadata (5 cols) */}
          <div className="md:col-span-5 overflow-y-auto p-6 space-y-5 bg-[#0a0d16]">
            <h3 className="text-sm font-bold text-white border-b border-white/[0.08] pb-2 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              {editingNodeId ? 'Редактирование узла' : 'Добавить новый узел'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Название узла:
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="например: Вычитание 5 из обеих частей"
                  className="w-full px-3 py-2 rounded-lg border border-white/[0.1] bg-[#060810] text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Формула (KaTeX):
                </label>
                <input
                  type="text"
                  value={formFormula}
                  onChange={(e) => setFormFormula(e.target.value)}
                  placeholder="например: 2x = 10"
                  className="w-full px-3 py-2 rounded-lg border border-white/[0.1] bg-[#060810] text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    Слой (Layer):
                  </label>
                  <select
                    value={formLayer}
                    onChange={(e) => setFormLayer(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-white/[0.1] bg-[#060810] text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={0}>0 — Фундамент (Аксиомы, База)</option>
                    <option value={1}>1 — Законы и Правила</option>
                    <option value={2}>2 — Алгебра и Шаги</option>
                    <option value={3}>3 — Предфинальный шаг</option>
                    <option value={4}>4 — Цель задачи</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    Тип узла:
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as NodeType)}
                    className="w-full px-3 py-2 rounded-lg border border-white/[0.1] bg-[#060810] text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="concept">Понятие (concept)</option>
                    <option value="step">Шаг решения (step)</option>
                    <option value="bridge">Мост смыслов (bridge)</option>
                    <option value="axiom">Аксиома (axiom)</option>
                    <option value="goal">Цель задачи (goal)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  «Для понимания A сначала нужно B» (Зависимости):
                </label>
                <select
                  multiple
                  value={formRequires}
                  onChange={(e) =>
                    handleRequiresChange(Array.from(e.target.selectedOptions, (o) => (o as HTMLOptionElement).value))
                  }
                  className="w-full px-2 py-1 rounded-lg border border-white/[0.1] bg-[#060810] text-white text-xs h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {nodes
                    .filter((n) => n.id !== editingNodeId)
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title} (Layer {n.layer})
                      </option>
                    ))}
                </select>
                {cycleWarning && (
                  <div className="mt-1 p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 animate-pulse">
                    <span>⚠️ {cycleWarning}</span>
                  </div>
                )}
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Зажми Ctrl / Cmd для выбора нескольких зависимостей
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Человеческое объяснение сути:
                </label>
                <textarea
                  rows={2}
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Простое объяснение для людей..."
                  className="w-full px-3 py-2 rounded-lg border border-white/[0.1] bg-[#060810] text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  «Почему я могу это сделать?» (Обоснование):
                </label>
                <textarea
                  rows={2}
                  value={formWhy}
                  onChange={(e) => setFormWhy(e.target.value)}
                  placeholder="Какое фундаментальное правило здесь работает..."
                  className="w-full px-3 py-2 rounded-lg border border-white/[0.1] bg-[#060810] text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    Вопрос для мини-практики:
                  </label>
                  <input
                    type="text"
                    value={formPracticeQ}
                    onChange={(e) => setFormPracticeQ(e.target.value)}
                    placeholder="например: Раскрой 3(x+4)"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-white/[0.1] bg-[#060810] text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    Ожидаемый ответ:
                  </label>
                  <input
                    type="text"
                    value={formPracticeAns}
                    onChange={(e) => setFormPracticeAns(e.target.value)}
                    placeholder="например: 3x+12"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-white/[0.1] bg-[#060810] text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                id="btn-add-update-node"
                onClick={handleSaveNode}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs shadow-md shadow-indigo-950/40 transition-colors mt-2"
              >
                {editingNodeId ? 'Сохранить изменения в узле' : 'Добавить узел в дерево'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#070910] flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Готово к публикации: <span className="font-bold text-white">{treeTitle}</span> ({nodes.length} узлов)</span>
            <button
              type="button"
              onClick={handleExportJson}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 underline ml-2"
            >
              Скачать JSON
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Отмена
            </button>
            <button
              id="btn-publish-tree"
              onClick={handleFinalSaveTree}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Опубликовать и открыть на карте</span>
            </button>
          </div>
        </div>
      </div>

      {/* Import JSON Sub-modal Dialog */}
      {showImportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-[#0e121f] rounded-2xl border border-white/[0.12] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-base font-bold text-white">
                <FileJson className="w-5 h-5 text-indigo-400" />
                <span>Импорт математического дерева из JSON</span>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportError(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Вставьте JSON-структуру дерева или загрузите сохранённый ранее файл <code className="text-indigo-300">.json</code>.
            </p>

            {/* File Upload Input */}
            <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/[0.2] bg-white/[0.02] hover:bg-indigo-600/10 hover:border-indigo-500/40 cursor-pointer transition-all">
              <FileUp className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-200">Выбрать файл .json с устройства</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Textarea for JSON */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Или вставьте JSON-код:</label>
                {importJsonText && (
                  <button
                    onClick={() => setImportJsonText('')}
                    className="text-[10px] text-slate-500 hover:text-slate-300"
                  >
                    Очистить
                  </button>
                )}
              </div>
              <textarea
                rows={7}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{ "title": "Мое дерево", "goalFormula": "...", "nodes": [...] }'
                className="w-full p-3 rounded-xl border border-white/[0.1] bg-[#060810] text-emerald-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-600"
              />
            </div>

            {importError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
                {importError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportError(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Отмена
              </button>
              <button
                type="button"
                id="btn-process-json-import"
                disabled={!importJsonText.trim()}
                onClick={() => handleProcessImport(importJsonText)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
              >
                Импортировать узлы
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
