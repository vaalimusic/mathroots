import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MathTree, MathNode, BranchType, AppViewMode } from './types';
import { INITIAL_TREES } from './data/trees';
import { Navbar } from './components/Navbar';
import { LeftSidebar, LeftNavSection } from './components/LeftSidebar';
import { Canvas } from './components/Canvas';
import { FirstUsageHero } from './components/FirstUsageHero';
import { FocusModeModal } from './components/FocusModeModal';
import { MyGapsDrawer } from './components/MyGapsDrawer';
import { LearnedSummaryBanner } from './components/LearnedSummaryBanner';
import { NodeDetailDrawer } from './components/NodeDetailDrawer';
import { StuckDebuggerModal } from './components/StuckDebuggerModal';
import { TreeBuilderModal } from './components/TreeBuilderModal';
import { MacroUniverseOverlay } from './components/MacroUniverseOverlay';
import { InteractiveStepSolver } from './components/InteractiveStepSolver';
import { ASTExplorerModal } from './components/ASTExplorerModal';
import { DeepGapFinderModal } from './components/DeepGapFinderModal';
import { MyKnowledgeMapModal } from './components/MyKnowledgeMapModal';
import { VisualLabModal, VisualLabTab } from './components/VisualLabModal';
import { TreeCheatSheetModal } from './components/TreeCheatSheetModal';
import { TreeWorkoutModal } from './components/TreeWorkoutModal';
import { MathSyntaxInspectorModal } from './components/MathSyntaxInspectorModal';
import { AuthModal } from './components/AuthModal';
import { ShareTreeModal } from './components/ShareTreeModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { PlatformGuideModal } from './components/PlatformGuideModal';
import { LicenseModal } from './components/LicenseModal';
import { FreeWelcomeModal } from './components/FreeWelcomeModal';
import { UserAiSettingsModal } from './components/UserAiSettingsModal';
import { useLicense } from './context/LicenseContext';
import {
  Sparkles,
  TreeDeciduous,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  Lightbulb,
  X,
  Sliders,
  RotateCcw,
  Check,
  Bot,
  ArrowRight,
} from 'lucide-react';
import { api } from './utils/apiClient';

const STORAGE_KEY_MASTERED = 'mathroots_mastered_nodes_v1';
const STORAGE_KEY_CUSTOM_TREES = 'mathroots_custom_trees_v1';
const STORAGE_KEY_FIRST_SEEN = 'mathroots_first_seen_v1';

export default function App() {
  // Current primary view (Canvas vs Interactive Step-by-Step Solver)
  const [currentView, setCurrentView] = useState<AppViewMode>('canvas');

  // Trees state
  const [trees, setTrees] = useState<MathTree[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_TREES);
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...INITIAL_TREES, ...parsed];
      }
    } catch {
      // fallback
    }
    return INITIAL_TREES;
  });

  const [activeTreeId, setActiveTreeId] = useState<string>('linear_mvp');

  // Mastered nodes state (persisted)
  const [masteredIds, setMasteredIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MASTERED);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch {
      // fallback
    }
    return new Set(['lin2_natural_numbers', 'lin2_add', 'lin2_mult', 'node_natural_numbers', 'node_addition']);
  });

  // Weak/Gap nodes
  const [weakIds, setWeakIds] = useState<Set<string>>(
    new Set(['lin2_prop_equality', 'lin2_concept_2x', 'node_distributive_law'])
  );

  // Active solution branch filter
  const [activeBranchFilter, setActiveBranchFilter] = useState<BranchType | 'all'>('all');

  // Selected node for detail drawer
  const [selectedNode, setSelectedNode] = useState<MathNode | null>(null);

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeNavSection, setActiveNavSection] = useState<LeftNavSection | null>('solve_problem');

  // First Usage Hero state (Section 5)
  const [showFirstUsageHero, setShowFirstUsageHero] = useState<boolean>(() => {
    return !localStorage.getItem(STORAGE_KEY_FIRST_SEEN);
  });

  // Modals & Drawers state
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isMyGapsOpen, setIsMyGapsOpen] = useState(false);
  const [showLearnedSummary, setShowLearnedSummary] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderInitialPrompt, setBuilderInitialPrompt] = useState('');
  const [isStuckDebuggerOpen, setIsStuckDebuggerOpen] = useState(false);
  const [isMacroUniverseOpen, setIsMacroUniverseOpen] = useState(false);
  const [isASTExplorerOpen, setIsASTExplorerOpen] = useState(false);
  const [isDeepGapFinderOpen, setIsDeepGapFinderOpen] = useState(false);
  const [isMyKnowledgeMapOpen, setIsMyKnowledgeMapOpen] = useState(false);
  const [isVisualLabOpen, setIsVisualLabOpen] = useState(false);
  const [visualLabDefaultTab, setVisualLabDefaultTab] = useState<VisualLabTab>('balance');
  const [isWorkoutOpen, setIsWorkoutOpen] = useState(false);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);

  // Auth & Cloud Sharing Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sharedToast, setSharedToast] = useState<string | null>(null);

  // Syntax and Parentheses Inspector State
  const [isSyntaxInspectorOpen, setIsSyntaxInspectorOpen] = useState(false);
  const [syntaxInitialExpr, setSyntaxInitialExpr] = useState<string | undefined>(undefined);
  const [syntaxInitialX, setSyntaxInitialX] = useState<number | undefined>(undefined);

  const handleOpenSyntaxInspector = useCallback((expr?: string, xVal?: number) => {
    setSyntaxInitialExpr(expr || '2x + 10');
    setSyntaxInitialX(xVal !== undefined ? xVal : 3);
    setIsSyntaxInspectorOpen(true);
  }, []);

  const handleOpenVisualLab = useCallback((tab?: VisualLabTab) => {
    if (tab) {
      setVisualLabDefaultTab(tab);
    }
    setIsVisualLabOpen(true);
  }, []);

  // Active tree object
  const activeTree = useMemo(() => {
    return trees.find((t) => t.id === activeTreeId) || trees[0];
  }, [trees, activeTreeId]);

  // Persist mastered nodes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MASTERED, JSON.stringify(Array.from(masteredIds)));
    } catch {
      // ignore
    }
  }, [masteredIds]);

  // Initial cloud session and database sync
  useEffect(() => {
    api.initSession().then((session) => {
      if (session?.user) {
        setCurrentUser(session.user);
      }
      if (session) {
        api.fetchMastery().then((remoteMastered) => {
          if (remoteMastered && remoteMastered.length > 0) {
            setMasteredIds((prev) => new Set([...prev, ...remoteMastered]));
          }
        });
        api.fetchCustomTrees().then((remoteTrees) => {
          if (remoteTrees && remoteTrees.length > 0) {
            setTrees((prev) => {
              const existingIds = new Set(prev.map((t) => t.id));
              const toAdd = remoteTrees.filter((t: any) => !existingIds.has(t.id));
              return [...prev, ...toAdd];
            });
          }
        });
      }
    });

    // Check if ?shared=<slug> is in URL
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const sharedSlug = urlParams.get('shared');
      if (sharedSlug) {
        api.fetchSharedTree(sharedSlug).then((res) => {
          if (res?.tree) {
            setTrees((prev) => {
              const exists = prev.some((t) => t.id === res.tree.id);
              return exists ? prev : [res.tree, ...prev];
            });
            setActiveTreeId(res.tree.id);
            setSharedToast(`Открыта общая задача: «${res.tree.title}»`);
            setTimeout(() => setSharedToast(null), 5000);
          }
        });
      }
    } catch {
      // ignore
    }
  }, []);

  // Mastered percentage calculation
  const totalConceptsCount = useMemo(() => {
    const all = new Set<string>();
    trees.forEach((t) => t.nodes.forEach((n) => all.add(n.id)));
    return all.size;
  }, [trees]);

  const masteredPercent = useMemo(() => {
    if (totalConceptsCount === 0) return 0;
    return Math.min(Math.round((masteredIds.size / totalConceptsCount) * 100), 100);
  }, [masteredIds, totalConceptsCount]);

  // Toggle mastered status for a node
  const handleToggleMastered = useCallback((nodeId: string) => {
    setMasteredIds((prev) => {
      const next = new Set(prev);
      const isNowMastered = !next.has(nodeId);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      // Async sync to server
      if (isNowMastered) {
        api.saveMastery(nodeId, activeTreeId, 1.0, true);
      }
      return next;
    });
    setWeakIds((wPrev) => {
      if (wPrev.has(nodeId)) {
        const wNext = new Set(wPrev);
        wNext.delete(nodeId);
        return wNext;
      }
      return wPrev;
    });
  }, [activeTreeId]);

  // Quick problem solve / input
  const handleQuickSolve = (problemText: string) => {
    const trimmed = problemText.trim();
    if (!trimmed) return;
    const clean = trimmed.toLowerCase();
    setShowFirstUsageHero(false);
    try {
      localStorage.setItem(STORAGE_KEY_FIRST_SEEN, 'true');
    } catch {
      // ignore
    }

    // 1. Direct exact match with existing catalog trees (formula or title)
    const exactTree = trees.find((t) => {
      const titleLower = t.title.toLowerCase();
      const goalLower = (t.goalFormula || '').toLowerCase();
      return titleLower === clean || goalLower === clean;
    });

    if (exactTree) {
      setActiveTreeId(exactTree.id);
      setCurrentView('canvas');
      return;
    }

    // 2. High-level topic names (ONLY if user typed a topic query, NOT an arbitrary mathematical equation)
    const isEquation = clean.includes('=') || /^[0-9a-z\s\^\+\-\*\/\(\)]+=[0-9a-z\s\^\+\-\*\/\(\)]+$/i.test(clean);

    if (!isEquation) {
      if (clean === 'дроби' || clean === 'арифметика дробей' || clean === 'сложение дробей') {
        setActiveTreeId('fractions');
        setCurrentView('canvas');
        return;
      }
      if (clean === 'пифагор' || clean === 'теорема пифагора') {
        setActiveTreeId('pythagoras');
        setCurrentView('canvas');
        return;
      }
      if (clean === 'тригонометрия' || clean === 'синус' || clean === 'косинус' || clean === 'тангенс') {
        setActiveTreeId('trigonometry');
        setCurrentView('canvas');
        return;
      }
      if (clean === 'производная' || clean === 'касательная' || clean === 'дифференциал') {
        setActiveTreeId('derivative_tangent');
        setCurrentView('canvas');
        return;
      }
      if (clean === 'логарифм' || clean === 'логарифмы' || clean === 'показательные уравнения') {
        setActiveTreeId('exp_log_mvp');
        setCurrentView('canvas');
        return;
      }
      if (clean === 'интеграл' || clean === 'тело вращения' || clean === 'интегралы') {
        setActiveTreeId('surface_integral');
        setCurrentView('canvas');
        return;
      }
      if (clean === 'квадратное уравнение' || clean === 'дискриминант' || clean === 'теорема виета') {
        setActiveTreeId('quadratic');
        setCurrentView('canvas');
        return;
      }
      if (clean === 'линейное уравнение' || clean === 'весы') {
        setActiveTreeId('linear_mvp');
        setCurrentView('canvas');
        return;
      }
    }

    // 3. For any arbitrary math problem, equation, or goal formula:
    // Open AI Builder & Decomposer directly with this exact prompt!
    setBuilderInitialPrompt(trimmed);
    setIsBuilderOpen(true);
  };

  // Left Nav Section Click
  const handleSelectNavSection = (section: LeftNavSection) => {
    setActiveNavSection(section);
    switch (section) {
      case 'my_map':
        setIsMyKnowledgeMapOpen(true);
        break;
      case 'guide':
        setIsGuideOpen(true);
        break;
      case 'solve_problem':
        setActiveTreeId('linear_mvp');
        setCurrentView('canvas');
        setShowFirstUsageHero(true);
        break;
      case 'syntax_guide':
        handleOpenSyntaxInspector('2x + 10', 3);
        break;
      case 'explore_topic':
        setIsMacroUniverseOpen(true);
        break;
      case 'workout':
        setIsWorkoutOpen(true);
        break;
      case 'cheat_sheet':
        setIsCheatSheetOpen(true);
        break;
      case 'visual_lab':
        setIsVisualLabOpen(true);
        break;
      case 'my_gaps':
        setIsMyGapsOpen(true);
        break;
      case 'history':
        setIsStuckDebuggerOpen(true);
        break;
      case 'builder':
        setIsBuilderOpen(true);
        break;
    }
  };

  // Node navigation
  const handleNavigateToNode = (nodeId: string, preferredTreeId?: string) => {
    if (preferredTreeId) {
      const pTree = trees.find((t) => t.id === preferredTreeId);
      if (pTree) {
        const found = pTree.nodes.find((n) => n.id === nodeId);
        if (found) {
          setActiveTreeId(pTree.id);
          setSelectedNode(found);
          setCurrentView('canvas');
          return;
        }
      }
    }
    let target = activeTree.nodes.find((n) => n.id === nodeId);
    if (!target) {
      for (const t of trees) {
        const found = t.nodes.find((n) => n.id === nodeId);
        if (found) {
          setActiveTreeId(t.id);
          target = found;
          break;
        }
      }
    }
    if (target) {
      setSelectedNode(target);
      setCurrentView('canvas');
    }
  };

  // Save new custom tree from builder
  const handleSaveTree = (newTree: MathTree) => {
    setTrees((prev) => {
      const updated = [newTree, ...prev.filter((t) => t.id !== newTree.id)];
      try {
        const customOnly = updated.filter((t) => !INITIAL_TREES.some((init) => init.id === t.id));
        localStorage.setItem(STORAGE_KEY_CUSTOM_TREES, JSON.stringify(customOnly));
      } catch {
        // ignore
      }
      return updated;
    });
    api.saveCustomTree(newTree);
    setActiveTreeId(newTree.id);
  };

  // Global Keyboard Shortcuts (Section 44)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1 -> Open Platform Guide & Help
      if (e.key === 'F1') {
        e.preventDefault();
        setIsGuideOpen(true);
      }
      // Ctrl+K -> Focus Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('quick-problem-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
      // Ctrl+N -> New Problem / Open Hero
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setShowFirstUsageHero(true);
      }
      // Ctrl+B -> Open Builder
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsBuilderOpen(true);
      }
      // Esc -> Close modals
      if (e.key === 'Escape') {
        setSelectedNode(null);
        setIsFocusModeOpen(false);
        setIsMyGapsOpen(false);
        setIsBuilderOpen(false);
        setIsStuckDebuggerOpen(false);
        setIsMacroUniverseOpen(false);
        setIsASTExplorerOpen(false);
        setIsDeepGapFinderOpen(false);
        setIsMyKnowledgeMapOpen(false);
        setIsVisualLabOpen(false);
        setIsSettingsOpen(false);
        setShowFirstUsageHero(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Secret URL access for Admin Panel (/vaalimusic)
  useEffect(() => {
    try {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (
        path === '/vaalimusic' ||
        path.startsWith('/vaalimusic') ||
        search.includes('vaalimusic') ||
        hash.includes('vaalimusic')
      ) {
        setIsAdminOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#050507] font-sans text-[#e2e8f0] select-none">
      {/* Top Navigation Bar (Section 2 & 4) */}
      <Navbar
        trees={trees}
        activeTree={activeTree}
        masteredCount={masteredIds.size}
        totalNodeCount={totalConceptsCount}
        currentView={currentView}
        onChangeView={setCurrentView}
        onSelectTree={(id) => {
          setActiveTreeId(id);
          setCurrentView('canvas');
        }}
        onOpenBuilder={() => setIsBuilderOpen(true)}
        onOpenMacroUniverse={() => setIsMacroUniverseOpen(true)}
        onOpenStuckDebugger={() => setIsStuckDebuggerOpen(true)}
        onOpenASTExplorer={() => setIsASTExplorerOpen(true)}
        onOpenDeepGapFinder={() => setIsDeepGapFinderOpen(true)}
        onOpenMyKnowledgeMap={() => setIsMyKnowledgeMapOpen(true)}
        onOpenVisualLab={() => handleOpenVisualLab('balance')}
        onOpenWorkout={() => setIsWorkoutOpen(true)}
        onOpenCheatSheet={() => setIsCheatSheetOpen(true)}
        onOpenSyntaxInspector={() => handleOpenSyntaxInspector('2x + 10', 3)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenAiSettings={() => setIsAiSettingsOpen(true)}
        currentUser={currentUser}
        selectedNode={selectedNode}
        onSelectNode={handleNavigateToNode}
        onQuickSolve={handleQuickSolve}
      />

      {/* Main Structural Layout: Left Sidebar + Central Infinite Canvas (Section 2) */}
      <div className="flex-1 flex w-full h-full overflow-hidden relative">
        {/* Left Navigation (Section 3) */}
        <LeftSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          activeSection={activeNavSection}
          onSelectSection={handleSelectNavSection}
          masteredPercent={masteredPercent}
          gapCount={weakIds.size}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProfile={() => setIsMyKnowledgeMapOpen(true)}
          onOpenAiSettings={() => setIsAiSettingsOpen(true)}
        />

        {/* Central Space: Infinite Canvas OR Interactive Solver */}
        <main className="flex-1 relative w-full h-full overflow-hidden flex flex-col">
          <div className="flex-1 relative w-full h-full overflow-hidden">
            {currentView === 'canvas' ? (
              <Canvas
                tree={activeTree}
                masteredIds={masteredIds}
                weakIds={weakIds}
                selectedNodeId={selectedNode?.id || null}
                activeBranchFilter={activeBranchFilter}
                isGapsModeActive={isMyGapsOpen}
                onSelectNode={(node) => {
                  setSelectedNode(node);
                }}
                onWhyClick={(node) => {
                  setSelectedNode(node);
                }}
                onBreakdownNode={(node) => {
                  setSelectedNode(node);
                  setCurrentView('step_solver');
                }}
                onDontUnderstandNode={(node) => {
                  setSelectedNode(node);
                  setIsDeepGapFinderOpen(true);
                }}
                onLaunchStuckDebugger={() => setIsStuckDebuggerOpen(true)}
                onSelectBranch={setActiveBranchFilter}
                onLaunchFocusMode={() => setIsFocusModeOpen(true)}
                onOpenStepSolver={() => setCurrentView('step_solver')}
                onTreeSolved={() => setShowLearnedSummary(true)}
              />
            ) : (
              <InteractiveStepSolver
                tree={activeTree}
                activeNode={selectedNode}
                onSelectNode={(node) => setSelectedNode(node)}
                onWhyClickPrerequisite={handleNavigateToNode}
                onMarkMastered={handleToggleMastered}
                onClose={() => setCurrentView('canvas')}
                onDontUnderstand={(node) => {
                  setSelectedNode(node);
                  setIsDeepGapFinderOpen(true);
                }}
                onOpenSyntaxInspector={handleOpenSyntaxInspector}
              />
            )}
          </div>

          {/* First Usage Hero Overlay (Section 5) */}
          {showFirstUsageHero && (
            <FirstUsageHero
              onSelectProblem={handleQuickSolve}
              onDismiss={() => {
                setShowFirstUsageHero(false);
                try {
                  localStorage.setItem(STORAGE_KEY_FIRST_SEEN, 'true');
                } catch {
                  // ignore
                }
              }}
            />
          )}

          {/* Learned Summary Completion Banner (Section 24) */}
          {showLearnedSummary && (
            <LearnedSummaryBanner
              onDismiss={() => setShowLearnedSummary(false)}
              onExploreConcept={(nodeId) => {
                handleNavigateToNode(nodeId);
                setShowLearnedSummary(false);
              }}
            />
          )}
        </main>
      </div>

      {/* Focus Mode Modal: "Я не понимаю" (Section 16-19) */}
      <FocusModeModal
        isOpen={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
        onMasterFoundationNode={(nodeId) => {
          handleToggleMastered(nodeId);
        }}
      />

      {/* My Gaps Drawer (Section 32, 33) */}
      <MyGapsDrawer
        isOpen={isMyGapsOpen}
        onClose={() => setIsMyGapsOpen(false)}
        onNavigateToNode={handleNavigateToNode}
      />

      {/* Node Anatomy Detail Drawer (Section 11) */}
      <NodeDetailDrawer
        node={selectedNode}
        isOpen={Boolean(selectedNode) && currentView === 'canvas'}
        isMastered={selectedNode ? masteredIds.has(selectedNode.id) : false}
        allNodes={activeTree.nodes}
        onClose={() => setSelectedNode(null)}
        onToggleMastered={handleToggleMastered}
        onNavigateToNode={handleNavigateToNode}
        onOpenVisualLab={(tab) => handleOpenVisualLab(tab)}
        onOpenStepSolver={(node) => {
          setSelectedNode(node);
          setCurrentView('step_solver');
        }}
        onDontUnderstand={(node) => {
          setSelectedNode(node);
          setIsDeepGapFinderOpen(true);
        }}
        onOpenSyntaxInspector={(expr, xVal) => handleOpenSyntaxInspector(expr, xVal)}
      />

      {/* Visual Lab Interactive Models Modal */}
      <VisualLabModal
        isOpen={isVisualLabOpen}
        onClose={() => setIsVisualLabOpen(false)}
        defaultTab={visualLabDefaultTab}
      />

      {/* Builder Mode Modal (Sections 34-39) */}
      <TreeBuilderModal
        isOpen={isBuilderOpen}
        activeTree={activeTree}
        masteredIds={masteredIds}
        initialPrompt={builderInitialPrompt}
        onClose={() => {
          setIsBuilderOpen(false);
          setBuilderInitialPrompt('');
        }}
        onSaveTree={handleSaveTree}
      />

      {/* My Knowledge Map Modal */}
      <MyKnowledgeMapModal
        isOpen={isMyKnowledgeMapOpen}
        trees={trees}
        masteredIds={masteredIds}
        weakIds={weakIds}
        onClose={() => setIsMyKnowledgeMapOpen(false)}
        onNavigateToNode={(treeId, nodeId) => {
          handleNavigateToNode(nodeId, treeId);
        }}
      />

      {/* Diagnostic & AST Modals */}
      <StuckDebuggerModal
        isOpen={isStuckDebuggerOpen}
        tree={activeTree}
        masteredIds={masteredIds}
        weakIds={weakIds}
        onClose={() => setIsStuckDebuggerOpen(false)}
        onJumpToNode={(nodeId) => {
          handleNavigateToNode(nodeId);
          setIsStuckDebuggerOpen(false);
        }}
      />

      <ASTExplorerModal
        isOpen={isASTExplorerOpen}
        initialEquation={activeTree.goalFormula || '2x + 4 = 10'}
        onClose={() => setIsASTExplorerOpen(false)}
      />

      <DeepGapFinderModal
        isOpen={isDeepGapFinderOpen}
        onClose={() => setIsDeepGapFinderOpen(false)}
        tree={activeTree}
        trees={trees}
        initialNode={selectedNode}
        masteredIds={masteredIds}
        onNavigateToNode={handleNavigateToNode}
        onSelectTree={(treeId) => setActiveTreeId(treeId)}
      />

      <MacroUniverseOverlay
        isOpen={isMacroUniverseOpen}
        trees={trees}
        activeTreeId={activeTreeId}
        onSelectCategory={(treeId) => {
          if (trees.some((t) => t.id === treeId)) {
            setActiveTreeId(treeId);
          }
        }}
        onClose={() => setIsMacroUniverseOpen(false)}
      />

      <TreeWorkoutModal
        isOpen={isWorkoutOpen}
        onClose={() => setIsWorkoutOpen(false)}
        tree={activeTree}
        masteredIds={masteredIds}
        onMarkMastered={handleToggleMastered}
        onNavigateToNode={handleNavigateToNode}
        onOpenDontUnderstand={(node) => {
          setSelectedNode(node);
          setIsDeepGapFinderOpen(true);
        }}
        onOpenSyntaxInspector={handleOpenSyntaxInspector}
        onSelectTree={(treeId) => {
          if (trees.some((t) => t.id === treeId)) {
            setActiveTreeId(treeId);
          }
        }}
        onOpenStepSolver={(problem) => {
          setIsWorkoutOpen(false);
          const matchedNode = problem.linkedNodeId
            ? activeTree.nodes.find((n) => n.id === problem.linkedNodeId)
            : null;
          if (matchedNode) {
            setSelectedNode(matchedNode);
          } else {
            const syntheticNode: MathNode = {
              id: problem.id,
              title: problem.title,
              formula: problem.formula,
              layer: 2,
              type: 'rule',
              branch: 'main',
              x: 0,
              y: 0,
              requires: [],
              explanationHuman: problem.explanation,
              formalRule: problem.whyRule,
              visualSteps: problem.stepByStepBreakdown,
              whyCanIDoThis: problem.whyRule,
              practiceExercise: {
                question: problem.question,
                expectedAnswer: problem.expectedAnswer,
              },
            };
            setSelectedNode(syntheticNode);
          }
          setCurrentView('step_solver');
        }}
      />

      <TreeCheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
        tree={activeTree}
        masteredIds={masteredIds}
        onNavigateToNode={handleNavigateToNode}
      />

      {/* Math Syntax, Parentheses & Substitution Inspector Modal */}
      <MathSyntaxInspectorModal
        isOpen={isSyntaxInspectorOpen}
        onClose={() => setIsSyntaxInspectorOpen(false)}
        initialExpression={syntaxInitialExpr}
        initialXValue={syntaxInitialX}
      />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div
          id="settings-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md bg-[#0d101d] rounded-2xl border border-white/[0.12] p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
              <div className="flex items-center gap-2 font-bold text-base">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <span>Настройки карты знаний</span>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="font-bold text-slate-200 mb-1">Горячие клавиши (Hotkeys):</div>
                <div className="space-y-1.5 font-mono text-slate-400 bg-white/[0.03] p-3 rounded-xl border border-white/[0.06]">
                  <div className="flex justify-between">
                    <span>Ctrl + K</span>
                    <span className="text-slate-300">Поиск задачи</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ctrl + N</span>
                    <span className="text-slate-300">Новая задача</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ctrl + B</span>
                    <span className="text-slate-300">Конструктор (Builder)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Esc</span>
                    <span className="text-slate-300">Закрыть окно / Focus Mode</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-200 mb-1">Интеллект платформы (AI):</div>
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setIsAiSettingsOpen(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 font-semibold transition-colors flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-purple-400" />
                    <span>Настройки AI (BYOK / Серверный)</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                </button>
              </div>

              <div>
                <div className="font-bold text-slate-200 mb-1">Сброс прогресса:</div>
                <button
                  onClick={() => {
                    localStorage.removeItem(STORAGE_KEY_MASTERED);
                    setMasteredIds(new Set(['lin2_natural_numbers', 'lin2_add', 'lin2_mult']));
                    setIsSettingsOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Сбросить освоенные темы к начальным</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Authentication & Profile Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onUserChange={(updated) => setCurrentUser(updated)}
      />

      {/* Share Tree Modal */}
      <ShareTreeModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        tree={activeTree}
      />

      {/* User AI Settings Modal (BYOK / Server Default) */}
      <UserAiSettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
      />

      {/* Admin Panel Modal (AI Providers & Smart Cache) */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />

      {/* Platform Documentation & User Guide Modal */}
      <PlatformGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onOpenVisualLab={(tab) => handleOpenVisualLab(tab)}
        onOpenWorkout={() => setIsWorkoutOpen(true)}
        onOpenSyntaxInspector={() => handleOpenSyntaxInspector('2x + 10', 3)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenBuilder={() => setIsBuilderOpen(true)}
        onOpenCheatSheet={() => setIsCheatSheetOpen(true)}
        onOpenGaps={() => setIsMyGapsOpen(true)}
        onOpenAiSettings={() => setIsAiSettingsOpen(true)}
      />

      {/* Tree Cheat Sheet & Printable Study Guide Modal */}
      <TreeCheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
        tree={activeTree}
        masteredIds={masteredIds}
        onNavigateToNode={(nodeId) => {
          setIsCheatSheetOpen(false);
          handleNavigateToNode(nodeId);
        }}
      />

      {/* Interactive Tree Workout & Problem Trainer Modal */}
      <TreeWorkoutModal
        isOpen={isWorkoutOpen}
        onClose={() => setIsWorkoutOpen(false)}
        tree={activeTree}
        masteredIds={masteredIds}
        onMarkMastered={handleToggleMastered}
        onNavigateToNode={(nodeId) => {
          setIsWorkoutOpen(false);
          handleNavigateToNode(nodeId);
        }}
        onOpenDontUnderstand={(node) => {
          setSelectedNode(node);
          setIsWorkoutOpen(false);
        }}
        onOpenSyntaxInspector={(expression, xVal) => {
          setIsWorkoutOpen(false);
          handleOpenSyntaxInspector(expression, xVal);
        }}
        onSelectTree={(treeId) => {
          setIsWorkoutOpen(false);
          setActiveTreeId(treeId);
        }}
        onOpenStepSolver={(problem) => {
          setIsWorkoutOpen(false);
          setCurrentView('steps');
        }}
      />

      {/* License & Monetization Modal */}
      <LicenseModal />

      {/* Free Welcome & Inspiring Greeting Modal */}
      <FreeWelcomeModal onOpenGuide={() => setIsGuideOpen(true)} />

      {/* Shared Tree Notification Toast */}
      {sharedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-2xl shadow-indigo-950 border border-indigo-400/40 animate-in fade-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{sharedToast}</span>
        </div>
      )}
    </div>
  );
}
