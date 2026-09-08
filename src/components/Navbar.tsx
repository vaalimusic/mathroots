import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MathTree, MathNode, AppViewMode } from '../types';
import {
  TreeDeciduous,
  Plus,
  HelpCircle,
  Sparkles,
  ChevronDown,
  Wand2,
  Scale,
  Network,
  Compass,
  Brain,
  Search,
  Map,
  Zap,
  FileText,
  SlidersHorizontal,
  X,
  ArrowRight,
  CornerDownLeft,
  User,
  Share2,
  Shield,
} from 'lucide-react';

interface NavbarProps {
  trees: MathTree[];
  activeTree: MathTree;
  masteredCount: number;
  totalNodeCount: number;
  currentView: AppViewMode;
  onChangeView: (view: AppViewMode) => void;
  onSelectTree: (treeId: string) => void;
  onOpenBuilder: () => void;
  onOpenMacroUniverse: () => void;
  onOpenStuckDebugger: () => void;
  onOpenASTExplorer: () => void;
  onOpenDeepGapFinder: () => void;
  onOpenMyKnowledgeMap: () => void;
  onOpenVisualLab?: () => void;
  onOpenWorkout?: () => void;
  onOpenCheatSheet?: () => void;
  onOpenSyntaxInspector?: () => void;
  onOpenAuth?: () => void;
  onOpenShare?: () => void;
  onOpenAdmin?: () => void;
  currentUser?: any;
  selectedNode?: MathNode | null;
  onSelectNode: (nodeId: string) => void;
  onQuickSolve: (problemText: string) => void;
}

const SEARCH_EXAMPLES = [
  '2x + 4 = 10',
  'Скобки 2(3)',
  'x² - 5x + 6 = 0',
  'Производная',
  '3x - 6 = 12',
  'Теорема Пифагора',
  'Интеграл',
];

const POPULAR_PROBLEMS = [
  { label: '2x + 4 = 10', desc: 'Линейное с весами', category: 'Алгебра' },
  { label: '2(3) + 10', desc: 'Скобки и подстановка', category: 'Арифметика' },
  { label: '3x - 6 = 12', desc: 'Два шага к корню', category: 'Алгебра' },
  { label: 'x² - 9 = 0', desc: 'Разность квадратов', category: 'Корни' },
  { label: 'Что такое производная?', desc: 'Мгновенная скорость', category: 'Матанализ' },
];

export const Navbar: React.FC<NavbarProps> = ({
  trees,
  activeTree,
  masteredCount,
  totalNodeCount,
  currentView,
  onChangeView,
  onSelectTree,
  onOpenBuilder,
  onOpenMacroUniverse,
  onOpenStuckDebugger,
  onOpenASTExplorer,
  onOpenDeepGapFinder,
  onOpenMyKnowledgeMap,
  onOpenVisualLab,
  onOpenWorkout,
  onOpenCheatSheet,
  onOpenSyntaxInspector,
  onOpenAuth,
  onOpenShare,
  onOpenAdmin,
  currentUser,
  selectedNode,
  onSelectNode,
  onQuickSolve,
}) => {
  const [quickInput, setQuickInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [exampleIdx, setExampleIdx] = useState(0);
  const [highlightedIdx, setHighlightedIdx] = useState<number>(-1);

  const treeDropdownRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Smooth rotating placeholder examples
  useEffect(() => {
    const timer = setInterval(() => {
      setExampleIdx((prev) => (prev + 1) % SEARCH_EXAMPLES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Global keyboard shortcuts (Ctrl+K, Cmd+K, /, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setShowSearchResults(true);
      } else if (e.key === '/' && !isTyping) {
        e.preventDefault();
        inputRef.current?.focus();
        setShowSearchResults(true);
      } else if (e.key === 'Escape' && showSearchResults) {
        setShowSearchResults(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearchResults]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (treeDropdownRef.current && !treeDropdownRef.current.contains(target)) {
        setShowDropdown(false);
      }
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(target)) {
        setShowToolsDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search through all nodes
  const searchResults = useMemo(() => {
    if (!quickInput.trim() || quickInput.length < 2) return [];
    const query = quickInput.toLowerCase();
    const results: { nodeId: string; title: string; formula: string; treeId: string; treeTitle: string }[] = [];

    trees.forEach((t) => {
      t.nodes.forEach((n) => {
        if (
          n.title.toLowerCase().includes(query) ||
          n.formula.toLowerCase().includes(query) ||
          (n.subtitle && n.subtitle.toLowerCase().includes(query))
        ) {
          results.push({
            nodeId: n.id,
            title: n.title,
            formula: n.formula,
            treeId: t.id,
            treeTitle: t.title,
          });
        }
      });
    });

    return results.slice(0, 6);
  }, [quickInput, trees]);

  const handleQuickSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickInput.trim()) return;

    // If an item is highlighted via keyboard navigation
    if (highlightedIdx >= 0 && searchResults[highlightedIdx]) {
      const item = searchResults[highlightedIdx];
      onSelectTree(item.treeId);
      onSelectNode(item.nodeId);
      setShowSearchResults(false);
      setQuickInput('');
      setHighlightedIdx(-1);
      return;
    }

    onQuickSolve(quickInput.trim());
    setShowSearchResults(false);
    setQuickInput('');
    setHighlightedIdx(-1);
  };

  // Keyboard navigation within search palette
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSearchResults) {
      if (e.key === 'ArrowDown') {
        setShowSearchResults(true);
      }
      return;
    }

    const totalItems = searchResults.length + 1; // +1 for the direct solver action
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx((prev) => (prev + 1 >= totalItems ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx((prev) => (prev - 1 < 0 ? totalItems - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleQuickSubmit();
    }
  };

  const handleClearInput = () => {
    setQuickInput('');
    setHighlightedIdx(-1);
    inputRef.current?.focus();
  };

  return (
    <header className="h-16 bg-[#0a0c14]/95 backdrop-blur-md border-b border-white/[0.08] px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-3 z-40 relative">
      {/* Brand: Logo + Title only (No description, no badge) */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 border border-white/10">
          <TreeDeciduous className="w-5 h-5" />
        </div>
        <span className="font-extrabold text-base tracking-tight text-white font-sans">
          MathRoots
        </span>
      </div>

      {/* Primary View Switcher Tabs (Карта vs Разбор) */}
      <div className="flex items-center gap-1 p-1 bg-[#121624] rounded-xl border border-white/[0.08] shrink-0">
        <button
          onClick={() => onChangeView('canvas')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            currentView === 'canvas'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Интерактивный граф понятий"
        >
          <Map className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Карта</span>
        </button>

        <button
          id="btn-nav-step-solver"
          onClick={() => onChangeView('step_solver')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            currentView === 'step_solver'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : selectedNode
              ? 'text-indigo-200 bg-indigo-500/20 border border-indigo-400/40 hover:bg-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title={
            selectedNode
              ? `Интерактивный разбор с весами: «${selectedNode.title}»`
              : 'Пошаговый разбор с весами'
          }
        >
          <Scale className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">
            {selectedNode ? `Разбор: ${selectedNode.title}` : 'Разбор (весы)'}
          </span>
          <span className="sm:hidden">Весы</span>
        </button>
      </div>

      {/* Tree Selector Dropdown */}
      <div className="relative shrink-0" ref={treeDropdownRef}>
        <button
          id="btn-tree-selector"
          onClick={() => {
            setShowDropdown(!showDropdown);
            setShowToolsDropdown(false);
          }}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#121624] hover:bg-[#181e30] rounded-xl text-xs font-bold text-slate-200 transition-colors border border-white/[0.08]"
          title="Выбрать дерево тем"
        >
          <span className="max-w-[100px] sm:max-w-[130px] lg:max-w-[160px] truncate">
            {activeTree.title}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>

        {showDropdown && (
          <div className="absolute left-0 mt-2 w-72 bg-[#0d101a] rounded-2xl border border-white/[0.1] shadow-2xl p-2 z-50 space-y-1 backdrop-blur-xl">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Библиотека деревьев задач
            </div>
            <div className="max-h-72 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {trees.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onSelectTree(t.id);
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex flex-col ${
                    t.id === activeTree.id
                      ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="truncate">{t.title}</span>
                  <span className="text-[10px] text-slate-500 font-normal truncate">
                    {t.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Center: Search & Quick Problem Input bar with Spotlight Command Palette */}
      <div className="flex items-center flex-1 min-w-[170px] max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl relative" ref={searchRef}>
        <form onSubmit={handleQuickSubmit} className="w-full relative flex items-center">
          <input
            ref={inputRef}
            id="quick-problem-input"
            type="text"
            value={quickInput}
            onChange={(e) => {
              setQuickInput(e.target.value);
              setShowSearchResults(true);
              setHighlightedIdx(-1);
            }}
            onFocus={() => setShowSearchResults(true)}
            onKeyDown={handleInputKeyDown}
            placeholder={`Найти: ${SEARCH_EXAMPLES[exampleIdx]}...`}
            className="w-full pl-8 pr-24 py-1.5 text-xs rounded-xl border border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 bg-[#121624]/90 text-slate-100 placeholder-slate-400/70 shadow-inner transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />

          {/* Right Action Cluster in Input: Clear (X) + Ctrl+K badge + Submit button */}
          <div className="absolute right-1.5 flex items-center gap-1">
            {quickInput && (
              <button
                type="button"
                onClick={handleClearInput}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                title="Очистить"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <span
              onClick={() => {
                inputRef.current?.focus();
                setShowSearchResults(true);
              }}
              className="text-[10px] text-slate-400 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] px-1.5 py-0.5 rounded font-mono hidden md:inline-flex items-center cursor-pointer select-none transition-colors"
              title="Нажмите Ctrl+K или / для быстрого фокуса"
            >
              Ctrl+K
            </span>
            <button
              type="submit"
              disabled={!quickInput.trim()}
              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm shrink-0"
              title="Разобрать задачу"
            >
              <Wand2 className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">Найти</span>
            </button>
          </div>
        </form>

        {/* Spotlight Command Palette Popover */}
        {showSearchResults && (
          <div className="absolute top-11 left-0 right-0 bg-[#0d101a]/98 rounded-2xl border border-white/[0.12] shadow-2xl shadow-black/90 p-2.5 z-50 space-y-2.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            {/* If user hasn't typed 2+ chars: Show Popular Problem Chips + Quick Actions */}
            {(!quickInput.trim() || quickInput.length < 2) && (
              <div className="space-y-2.5">
                <div>
                  <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Быстрый выбор уравнений
                    </span>
                    <span className="text-[9px] text-slate-500 lowercase font-normal">кликни для разбора</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-1 pt-1">
                    {POPULAR_PROBLEMS.map((prob) => (
                      <button
                        key={prob.label}
                        type="button"
                        onClick={() => {
                          onQuickSolve(prob.label);
                          setShowSearchResults(false);
                          setQuickInput('');
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/[0.05] hover:bg-indigo-600/30 hover:border-indigo-500/40 border border-white/[0.08] text-slate-200 hover:text-indigo-200 transition-all flex items-center gap-1.5 group"
                      >
                        <span className="font-mono text-[11px] text-indigo-300">{prob.label}</span>
                        <span className="text-[10px] text-slate-400 group-hover:text-slate-300">({prob.desc})</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/[0.06] pt-2">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Быстрые переходы
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 px-1">
                    <button
                      type="button"
                      onClick={() => {
                        onChangeView('step_solver');
                        setShowSearchResults(false);
                      }}
                      className="text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                        <Scale className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-slate-200 font-bold">Весы & пошаговый разбор</div>
                        <div className="text-[10px] text-slate-400">Симметричные операции</div>
                      </div>
                    </button>

                    {onOpenWorkout && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenWorkout();
                          setShowSearchResults(false);
                        }}
                        className="text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2"
                      >
                        <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-slate-200 font-bold">Тренажер 100+ задач</div>
                          <div className="text-[10px] text-slate-400">Практика & генератор</div>
                        </div>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onOpenDeepGapFinder();
                        setShowSearchResults(false);
                      }}
                      className="text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                        <Compass className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-slate-200 font-bold">«Я не понимаю»</div>
                        <div className="text-[10px] text-slate-400">Бинарный поиск фундамента</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenASTExplorer();
                        setShowSearchResults(false);
                      }}
                      className="text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                        <Network className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-slate-200 font-bold">Дерево AST формул</div>
                        <div className="text-[10px] text-slate-400">Синтаксис & операции</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* If user typed 2+ chars: Show direct solver action + search results */}
            {quickInput.trim().length >= 2 && (
              <div className="space-y-1">
                {/* Direct Solver Action */}
                <div
                  onClick={() => handleQuickSubmit()}
                  className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-colors border ${
                    highlightedIdx === 0
                      ? 'bg-indigo-600/30 border-indigo-500/60 text-white'
                      : 'bg-indigo-600/15 border-indigo-500/30 text-indigo-200 hover:bg-indigo-600/25'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                      <Scale className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Разобрать на весах:</span>
                        <span className="font-mono text-indigo-300">«{quickInput.trim()}»</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Пошаговое решение с проверкой сохранения равновесия
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-indigo-300 bg-white/[0.08] px-2 py-0.5 rounded border border-white/[0.08]">
                    <span>Enter</span>
                    <CornerDownLeft className="w-3 h-3" />
                  </div>
                </div>

                {/* Graph Search Results */}
                {searchResults.length > 0 ? (
                  <div>
                    <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400">
                      Найдено в графе понятий:
                    </div>
                    {searchResults.map((item, idx) => {
                      const isHighlighted = highlightedIdx === idx + 1;
                      return (
                        <div
                          key={`${item.treeId}-${item.nodeId}`}
                          onClick={() => {
                            onSelectTree(item.treeId);
                            onSelectNode(item.nodeId);
                            setShowSearchResults(false);
                            setQuickInput('');
                            setHighlightedIdx(-1);
                          }}
                          className={`p-2 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                            isHighlighted ? 'bg-white/[0.12] text-white' : 'hover:bg-white/[0.08]'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-white">{item.title}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{item.formula}</div>
                          </div>
                          <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            {item.treeTitle}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400">
                    В графе нет точного названия, но можно нажать <strong>Enter</strong> для разбора задачи «{quickInput}».
                  </div>
                )}
              </div>
            )}

            {/* Footer keyboard hints */}
            <div className="border-t border-white/[0.06] pt-1.5 px-2 flex items-center justify-between text-[10px] text-slate-500 select-none">
              <div className="flex items-center gap-2">
                <span><kbd className="font-mono bg-white/[0.06] px-1 py-0.5 rounded text-slate-400">↑↓</kbd> Навигация</span>
                <span><kbd className="font-mono bg-white/[0.06] px-1 py-0.5 rounded text-slate-400">↵</kbd> Выбрать</span>
                <span><kbd className="font-mono bg-white/[0.06] px-1 py-0.5 rounded text-slate-400">Esc</kbd> Закрыть</span>
              </div>
              <span className="font-mono text-indigo-400/80">MathRoots Spotlight</span>
            </div>
          </div>
        )}
      </div>

      {/* Right Controls: High-Frequency Actions + Tools Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Workout / Practice Button */}
        {onOpenWorkout && (
          <button
            id="btn-open-workout"
            onClick={onOpenWorkout}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl border border-amber-500/30 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-colors shadow-sm"
            title="Интерактивный тренажер и банк 100+ разобранных задач с генератором"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Тренажер (100+)</span>
          </button>
        )}

        {/* "Не понимаю" Deep Gap Finder Button */}
        <button
          id="btn-open-deep-gap"
          onClick={onOpenDeepGapFinder}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl border border-rose-500/30 text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
          title="Режим «Я вообще ничего не понимаю» (бинарный поиск корня непонимания)"
        >
          <Compass className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Не понимаю</span>
        </button>

        {/* Tools Menu Dropdown */}
        <div className="relative" ref={toolsDropdownRef}>
          <button
            id="btn-open-tools-menu"
            onClick={() => {
              setShowToolsDropdown(!showToolsDropdown);
              setShowDropdown(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
              showToolsDropdown
                ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50'
                : 'bg-[#121624] hover:bg-[#181e30] text-slate-300 border-white/[0.08]'
            }`}
            title="Дополнительные математические инструменты"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline">Инструменты</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {showToolsDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-[#0d101a] rounded-2xl border border-white/[0.1] shadow-2xl p-2 z-50 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Инструменты анализа</span>
                <span className="text-[9px] text-indigo-400 font-mono">MathRoots</span>
              </div>

              {/* AST Engine */}
              <button
                id="btn-open-ast-engine"
                onClick={() => {
                  onOpenASTExplorer();
                  setShowToolsDropdown(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2.5"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-200">Синтаксическое дерево (AST)</div>
                  <div className="text-[10px] text-slate-400">Движок формул и токенизация</div>
                </div>
              </button>

              {/* Syntax / Parentheses Inspector */}
              {onOpenSyntaxInspector && (
                <button
                  id="btn-open-syntax-inspector"
                  onClick={() => {
                    onOpenSyntaxInspector();
                    setShowToolsDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2.5"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">Скобки 2(3) и умножение</div>
                    <div className="text-[10px] text-slate-400">Неявное умножение и подстановка</div>
                  </div>
                </button>
              )}

              {/* Visual Lab */}
              {onOpenVisualLab && (
                <button
                  id="btn-open-visual-lab"
                  onClick={() => {
                    onOpenVisualLab();
                    setShowToolsDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2.5"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">Визуальная лаборатория</div>
                    <div className="text-[10px] text-slate-400">9 интерактивных моделей и графиков</div>
                  </div>
                </button>
              )}

              {/* Cheat Sheet / PDF */}
              {onOpenCheatSheet && (
                <button
                  id="btn-open-cheat-sheet"
                  onClick={() => {
                    onOpenCheatSheet();
                    setShowToolsDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2.5"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">Конспект-шпаргалка & PDF</div>
                    <div className="text-[10px] text-slate-400">Формулы, правила и экспорт</div>
                  </div>
                </button>
              )}

              {/* My Knowledge Map */}
              <button
                id="btn-open-my-knowledge"
                onClick={() => {
                  onOpenMyKnowledgeMap();
                  setShowToolsDropdown(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2.5 border-t border-white/[0.06] pt-2"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-200">Моя карта знаний</div>
                  <div className="text-[10px] text-slate-400">Освоенные концепты и пробелы</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Share Button */}
        {onOpenShare && (
          <button
            id="btn-open-share-mode"
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-indigo-300 border border-indigo-500/25 transition-colors"
            title="Поделиться деревом задачи"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden xl:inline">Поделиться</span>
          </button>
        )}

        {/* Builder Mode Button */}
        <button
          id="btn-open-builder-mode"
          onClick={onOpenBuilder}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-950/40 transition-all border border-emerald-400/30"
          title="Конструктор новых задач"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-200" />
          <span className="hidden sm:inline">Конструктор</span>
        </button>

        {/* Profile / Auth Button */}
        {onOpenAuth && (
          <button
            id="btn-open-auth-profile"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 transition-colors"
            title="Профиль и синхронизация"
          >
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline font-bold truncate max-w-[100px]">
              {currentUser?.is_anonymous ? 'Войти' : currentUser?.display_name || 'Профиль'}
            </span>
          </button>
        )}

        {/* Admin Panel Button */}
        {onOpenAdmin && (
          <button
            id="btn-open-admin-panel"
            onClick={onOpenAdmin}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              currentUser?.role === 'admin'
                ? 'bg-purple-600/25 hover:bg-purple-600/35 text-purple-200 border border-purple-500/40'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/[0.08]'
            }`}
            title="Панель администратора (Настройка ИИ OpenRouter, DeepSeek, Яндекс, Кэш)"
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden xl:inline font-bold">
              {currentUser?.role === 'admin' ? 'Админка' : 'Админ'}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};

