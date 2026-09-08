import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { MathNode, MathTree, BranchType } from '../types';
import { NodeCard } from './NodeCard';
import { TaskGrowthCard } from './TaskGrowthCard';
import { ContextMenu } from './ContextMenu';
import { MicroExerciseCard } from './MicroExerciseCard';
import { calculateTreeCoordinates, getNodeAncestors, getNodeDescendants, findConnectionPath } from '../utils/mathEngine';
import { api } from '../utils/apiClient';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Target,
  MapPin,
  HelpCircle,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  GitFork,
  Link2,
  Layers,
  X,
  Compass,
  Filter
} from 'lucide-react';

interface CanvasProps {
  tree: MathTree;
  masteredIds: Set<string>;
  weakIds: Set<string>;
  selectedNodeId: string | null;
  activeBranchFilter: BranchType | 'all';
  isGapsModeActive?: boolean;
  onSelectNode: (node: MathNode) => void;
  onWhyClick: (node: MathNode, e: React.MouseEvent) => void;
  onLaunchStuckDebugger: () => void;
  onSelectBranch: (branch: BranchType | 'all') => void;
  onLaunchFocusMode: () => void;
  onOpenStepSolver: () => void;
  onTreeSolved?: () => void;
  onBreakdownNode?: (node: MathNode) => void;
  onDontUnderstandNode?: (node: MathNode) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  tree,
  masteredIds,
  weakIds,
  selectedNodeId,
  activeBranchFilter,
  isGapsModeActive = false,
  onSelectNode,
  onWhyClick,
  onLaunchStuckDebugger,
  onSelectBranch,
  onLaunchFocusMode,
  onOpenStepSolver,
  onTreeSolved,
  onBreakdownNode,
  onDontUnderstandNode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [invertRootsAtBottom, setInvertRootsAtBottom] = useState(true);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [nodeTypeFilter, setNodeTypeFilter] = useState<'all' | 'axiom' | 'concept' | 'bridge' | 'step' | 'weak'>('all');

  // Connectedness & Two-Node Path State
  const [connectPair, setConnectPair] = useState<{
    isActive: boolean;
    nodeA: string | null;
    nodeB: string | null;
  }>({ isActive: false, nodeA: null, nodeB: null });

  // Growth Animation Stage (Sections 6, 7):
  // 0: Task Card only
  // 1: Step 1 (Вычесть 4 -> 2x = 6)
  // 2: Step 2 (Разделить на 2 -> x = 3)
  // 3: Step 3 (Проверка 10 = 10)
  // 4: Full foundational roots decomp
  const [growthStage, setGrowthStage] = useState<number>(() => {
    // If it's linear_mvp, start at stage 1 or 0 for fresh onboarding
    return tree.id === 'linear_mvp' ? 1 : 4;
  });

  // Context Menu state (Section 43)
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: MathNode;
  } | null>(null);

  // Inline Micro-Exercise state (Sections 20, 21)
  const [activeMicroExercise, setActiveMicroExercise] = useState<{
    node: MathNode;
    question: string;
    formula: string;
    expected: string;
  } | null>(null);

  // Reset growth stage if tree changes
  useEffect(() => {
    if (tree.id === 'linear_mvp') {
      setGrowthStage(1);
    } else {
      setGrowthStage(4);
    }
  }, [tree.id]);

  // Custom user-dragged positions: Map node id to {x, y}
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    try {
      const saved = localStorage.getItem('mathroots_positions_' + tree.id);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [showResetToast, setShowResetToast] = useState(false);

  // Active dragged node state
  const [draggingNode, setDraggingNode] = useState<{
    id: string;
    startNodeX: number;
    startNodeY: number;
    startMouseX: number;
    startMouseY: number;
    hasMoved: boolean;
  } | null>(null);

  const prevTreeIdRef = useRef(tree.id);

  // Sync custom positions when tree changes
  useEffect(() => {
    if (prevTreeIdRef.current !== tree.id) {
      prevTreeIdRef.current = tree.id;
      try {
        const saved = localStorage.getItem('mathroots_positions_' + tree.id);
        setCustomPositions(saved ? JSON.parse(saved) : {});
      } catch {
        setCustomPositions({});
      }

      // Sync layout from backend database
      api.fetchCanvasLayout(tree.id).then((remotePos) => {
        if (remotePos && Object.keys(remotePos).length > 0) {
          setCustomPositions(remotePos);
        }
      });
    }
  }, [tree.id]);

  const hasCustomPositions = useMemo(() => {
    return Object.keys(customPositions).length > 0;
  }, [customPositions]);

  // Reset all custom positions to default
  const handleResetPositions = useCallback(() => {
    setCustomPositions({});
    try {
      localStorage.removeItem('mathroots_positions_' + tree.id);
    } catch {}
    setShowResetToast(true);
    setTimeout(() => setShowResetToast(false), 2200);
  }, [tree.id]);

  // Reset single node position
  const handleResetSingleNode = useCallback((node: MathNode) => {
    setCustomPositions((prev) => {
      const next = { ...prev };
      delete next[node.id];
      try {
        if (Object.keys(next).length === 0) {
          localStorage.removeItem('mathroots_positions_' + tree.id);
        } else {
          localStorage.setItem('mathroots_positions_' + tree.id, JSON.stringify(next));
        }
      } catch {}
      return next;
    });
  }, [tree.id]);

  // Compute node coordinates with orientation and custom positions
  const positionedNodes = useMemo(() => {
    return calculateTreeCoordinates(tree.nodes, invertRootsAtBottom, customPositions);
  }, [tree.nodes, invertRootsAtBottom, customPositions]);

  const positionedNodesRef = useRef(positionedNodes);
  positionedNodesRef.current = positionedNodes;

  // Center tree upon tree change or mount
  const resetViewport = useCallback(
    (coordsNodes: MathNode[]) => {
      if (!containerRef.current || coordsNodes.length === 0) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      const xs = coordsNodes.map((n) => n.x);
      const ys = coordsNodes.map((n) => n.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      setPan({
        x: width / 2 - centerX,
        y: height / 2 - centerY,
      });
      setZoom(0.85);
    },
    []
  );

  useEffect(() => {
    resetViewport(positionedNodesRef.current);
  }, [tree.id, invertRootsAtBottom, resetViewport]);

  // Center on Goal node
  const centerOnGoal = () => {
    const goalNode = positionedNodes.find((n) => n.type === 'goal') || positionedNodes[0];
    if (!goalNode || !containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    setPan({
      x: width / 2 - goalNode.x - 145,
      y: height / 2 - goalNode.y - 80,
    });
    setZoom(1.0);
  };

  // Center on specific node
  const centerOnNodeId = useCallback(
    (nodeId: string) => {
      const target = positionedNodes.find((n) => n.id === nodeId);
      if (!target || !containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      setPan({
        x: width / 2 - target.x - 145,
        y: height / 2 - target.y - 80,
      });
      setZoom(1.1);
    },
    [positionedNodes]
  );

  // Auto-center when selectedNodeId changes externally and is out of view
  const lastAutoCenteredIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedNodeId || selectedNodeId === lastAutoCenteredIdRef.current) return;
    const target = positionedNodes.find((n) => n.id === selectedNodeId);
    if (!target || !containerRef.current) return;

    lastAutoCenteredIdRef.current = selectedNodeId;

    // Check if target is already comfortably in viewport
    const screenX = target.x * zoom + pan.x;
    const screenY = target.y * zoom + pan.y;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    const inView = screenX >= 60 && screenX <= w - 340 && screenY >= 60 && screenY <= h - 220;

    if (!inView) {
      centerOnNodeId(selectedNodeId);
    }
  }, [selectedNodeId, positionedNodes, zoom, pan, centerOnNodeId]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.35), 2.2);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const dx = mouseX - pan.x;
      const dy = mouseY - pan.y;

      setPan({
        x: mouseX - dx * (newZoom / zoom),
        y: mouseY - dy * (newZoom / zoom),
      });
      setZoom(newZoom);
    }
  };

  // Node drag handler
  const handleNodeMouseDown = useCallback((node: MathNode, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    // Don't drag if user clicked an interactive button or control
    if ((e.target as HTMLElement).closest('button, input, a, form')) {
      return;
    }
    e.stopPropagation();
    if (contextMenu) setContextMenu(null);

    setDraggingNode({
      id: node.id,
      startNodeX: node.x,
      startNodeY: node.y,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      hasMoved: false,
    });
  }, [contextMenu]);

  // Window listeners for smooth node dragging
  useEffect(() => {
    if (!draggingNode) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - draggingNode.startMouseX) / zoom;
      const dy = (e.clientY - draggingNode.startMouseY) / zoom;
      if (!draggingNode.hasMoved && Math.hypot(e.clientX - draggingNode.startMouseX, e.clientY - draggingNode.startMouseY) > 3) {
        draggingNode.hasMoved = true;
      }

      const newX = Math.round(draggingNode.startNodeX + dx);
      const newY = Math.round(draggingNode.startNodeY + dy);

      setCustomPositions((prev) => ({
        ...prev,
        [draggingNode.id]: { x: newX, y: newY },
      }));
    };

    const handleWindowMouseUp = () => {
      if (draggingNode) {
        if (!draggingNode.hasMoved) {
          // User clicked without moving -> select node
          const targetNode = positionedNodesRef.current.find((n) => n.id === draggingNode.id);
          if (targetNode) {
            onSelectNode(targetNode);
          }
        } else {
          // User dragged -> save to localStorage and database
          setCustomPositions((current) => {
            try {
              localStorage.setItem('mathroots_positions_' + tree.id, JSON.stringify(current));
            } catch {}
            // Sync to production database
            api.saveCanvasLayout(tree.id, current);
            return current;
          });
        }
        setDraggingNode(null);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [draggingNode, zoom, tree.id, onSelectNode]);

  // Mouse pan handlers for canvas background
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    if (
      (e.target as HTMLElement).closest(
        '#node-card, [id^="node-card-"], [id^="node-macro-"], button, input, form, #task-growth-card, #micro-exercise-card, #node-context-menu'
      )
    ) {
      return;
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    if (contextMenu) setContextMenu(null);
  };

  // Window listeners for canvas panning
  useEffect(() => {
    if (!isDragging) return;
    const handlePanMove = (e: MouseEvent) => {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };
    const handlePanUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('mousemove', handlePanMove);
    window.addEventListener('mouseup', handlePanUp);
    return () => {
      window.removeEventListener('mousemove', handlePanMove);
      window.removeEventListener('mouseup', handlePanUp);
    };
  }, [isDragging, dragStart]);

  // Handle right-click context menu
  const handleContextMenu = (node: MathNode, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node,
    });
  };

  // Node position map
  const nodeMap = useMemo(() => {
    return new Map<string, MathNode>(positionedNodes.map((n) => [n.id, n]));
  }, [positionedNodes]);

  // Filter visible nodes based on growthStage in linear_mvp
  const visibleNodes = useMemo(() => {
    if (tree.id !== 'linear_mvp' || growthStage >= 4) {
      return positionedNodes;
    }
    // Growth stages for 2x + 4 = 10
    const stageNodes: Record<number, string[]> = {
      0: ['lin2_goal'],
      1: ['lin2_goal', 'lin2_step_sub', 'lin2_prop_equality', 'lin2_sub'],
      2: ['lin2_goal', 'lin2_step_sub', 'lin2_step_div', 'lin2_prop_equality', 'lin2_concept_2x', 'lin2_mult', 'lin2_sub'],
      3: ['lin2_goal', 'lin2_step_sub', 'lin2_step_div', 'lin2_verify', 'lin2_prop_equality', 'lin2_concept_2x', 'lin2_equality_def', 'lin2_mult', 'lin2_sub'],
    };

    const allowed = new Set(stageNodes[growthStage] || positionedNodes.map((n) => n.id));
    return positionedNodes.filter((n) => allowed.has(n.id));
  }, [tree.id, growthStage, positionedNodes]);

  // Mini-map bounds calculation for accurate visual representation
  const mapBounds = useMemo(() => {
    if (visibleNodes.length === 0) {
      return { minX: -700, maxX: 700, minY: -200, maxY: 900, spanX: 1400, spanY: 1100 };
    }
    const xs = visibleNodes.map((n) => n.x);
    const ys = visibleNodes.map((n) => n.y);
    const minX = Math.min(...xs) - 150;
    const maxX = Math.max(...xs) + 450;
    const minY = Math.min(...ys) - 150;
    const maxY = Math.max(...ys) + 300;
    return {
      minX,
      maxX,
      minY,
      maxY,
      spanX: Math.max(maxX - minX, 600),
      spanY: Math.max(maxY - minY, 500),
    };
  }, [visibleNodes]);

  // Click on mini-map to pan directly to clicked location
  const handleMiniMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRelX = (e.clientX - rect.left) / rect.width;
    const clickRelY = (e.clientY - rect.top) / rect.height;

    const targetWorldX = mapBounds.minX + clickRelX * mapBounds.spanX;
    const targetWorldY = mapBounds.minY + clickRelY * mapBounds.spanY;

    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;

    setPan({
      x: w / 2 - targetWorldX * zoom,
      y: h / 2 - targetWorldY * zoom,
    });
  };

  // Camera viewport rectangle projected onto mini-map
  const viewportRectOnMap = useMemo(() => {
    if (!containerRef.current) return null;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;

    const worldLeft = -pan.x / zoom;
    const worldTop = -pan.y / zoom;
    const worldW = w / zoom;
    const worldH = h / zoom;

    const xPercent = ((worldLeft - mapBounds.minX) / mapBounds.spanX) * 100;
    const yPercent = ((worldTop - mapBounds.minY) / mapBounds.spanY) * 100;
    const wPercent = (worldW / mapBounds.spanX) * 100;
    const hPercent = (worldH / mapBounds.spanY) * 100;

    return {
      left: Math.max(0, Math.min(xPercent, 96)),
      top: Math.max(0, Math.min(yPercent, 96)),
      width: Math.min(Math.max(wPercent, 4), 100),
      height: Math.min(Math.max(hPercent, 4), 100),
    };
  }, [pan, zoom, mapBounds]);

  // Edges list
  const edges = useMemo(() => {
    const list: Array<{
      from: MathNode;
      to: MathNode;
      isBridge: boolean;
      isWeak: boolean;
      isMastered: boolean;
      isTransitionStep: boolean;
    }> = [];

    visibleNodes.forEach((node) => {
      if (node.requires) {
        node.requires.forEach((reqId) => {
          const parent = nodeMap.get(reqId);
          if (parent && visibleNodes.some((vn) => vn.id === parent.id)) {
            const isBridge = node.type === 'bridge' || parent.type === 'bridge';
            const isWeak = weakIds.has(node.id) || weakIds.has(parent.id);
            const isMastered = masteredIds.has(node.id) && masteredIds.has(parent.id);
            const isTransitionStep =
              (parent.id === 'lin2_goal' && node.id === 'lin2_step_sub') ||
              (parent.id === 'lin2_step_sub' && node.id === 'lin2_step_div') ||
              (parent.id === 'lin2_step_sub' && node.id === 'lin2_prop_equality');

            list.push({
              from: parent,
              to: node,
              isBridge,
              isWeak,
              isMastered,
              isTransitionStep,
            });
          }
        });
      }
    });
    return list;
  }, [visibleNodes, nodeMap, weakIds, masteredIds]);

  // Connectedness Lineage for selected node
  const lineageInfo = useMemo(() => {
    if (!selectedNodeId) return null;
    const ancestors = getNodeAncestors(selectedNodeId, visibleNodes);
    const descendants = getNodeDescendants(selectedNodeId, visibleNodes);
    const allLineageIds = new Set<string>([selectedNodeId, ...ancestors, ...descendants]);

    const orderedNodes = Array.from(allLineageIds)
      .map((id) => nodeMap.get(id))
      .filter((n): n is MathNode => Boolean(n))
      .sort((a, b) => a.layer - b.layer);

    return {
      selectedId: selectedNodeId,
      ancestors,
      descendants,
      allLineageIds,
      orderedNodes,
    };
  }, [selectedNodeId, visibleNodes, nodeMap]);

  // Two-Node Connection Path
  const twoNodePath = useMemo(() => {
    if (!connectPair.isActive || !connectPair.nodeA || !connectPair.nodeB) return [];
    return findConnectionPath(connectPair.nodeA, connectPair.nodeB, visibleNodes);
  }, [connectPair, visibleNodes]);

  const twoNodePathEdgeKeys = useMemo(() => {
    const keys = new Set<string>();
    for (let i = 0; i < twoNodePath.length - 1; i++) {
      keys.add(`${twoNodePath[i]}->${twoNodePath[i + 1]}`);
      keys.add(`${twoNodePath[i + 1]}->${twoNodePath[i]}`);
    }
    return keys;
  }, [twoNodePath]);

  // Counts of each category for the layer filter bar
  const filterCounts = useMemo(() => {
    const counts = {
      all: visibleNodes.length,
      axiom: 0,
      concept: 0,
      bridge: 0,
      step: 0,
      weak: 0,
    };
    visibleNodes.forEach((n) => {
      if (n.type === 'axiom') counts.axiom++;
      if (n.type === 'concept') counts.concept++;
      if (n.type === 'bridge') counts.bridge++;
      if (n.type === 'step') counts.step++;
      if (weakIds.has(n.id)) counts.weak++;
    });
    return counts;
  }, [visibleNodes, weakIds]);

  // Advance tree physical growth (Sections 6, 7)
  const handleAdvanceGrowth = () => {
    setGrowthStage((prev) => {
      const next = Math.min(prev + 1, 4);
      if (next === 3 && onTreeSolved) {
        onTreeSolved();
      }
      return next;
    });
  };

  const handleFullDecompose = () => {
    setGrowthStage(4);
    if (onTreeSolved) onTreeSolved();
    resetViewport(positionedNodes);
  };

  const handleResetGrowth = () => {
    setGrowthStage(0);
    centerOnGoal();
  };

  // Breadcrumb path of knowledge (Section 14)
  const breadcrumbItems = useMemo(() => {
    if (tree.id === 'linear_mvp') {
      return [
        { id: 'lin2_goal', label: '2x + 4 = 10' },
        { id: 'lin2_prop_equality', label: 'Свойства равенства' },
        { id: 'lin2_sub', label: 'Вычитание' },
        { id: 'lin2_natural_numbers', label: 'Числа' },
      ];
    }
    return [
      { id: positionedNodes[0]?.id || 'root', label: tree.title },
      { id: 'category', label: tree.category },
    ];
  }, [tree, positionedNodes]);

  // Check if camera is far from goal
  const goalNode = positionedNodes.find((n) => n.type === 'goal') || positionedNodes[0];
  const isFarFromGoal = useMemo(() => {
    if (!goalNode || !containerRef.current) return false;
    const currentCenterCanvasX = containerRef.current.clientWidth / 2 - pan.x;
    const currentCenterCanvasY = containerRef.current.clientHeight / 2 - pan.y;
    const dist = Math.hypot(currentCenterCanvasX - goalNode.x, currentCenterCanvasY - goalNode.y);
    return dist > 500;
  }, [pan, goalNode]);

  return (
    <div
      ref={containerRef}
      id="mathroots-canvas-container"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      className="relative w-full h-full overflow-hidden select-none bg-[#050507] cursor-grab active:cursor-grabbing"
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.08) 1.2px, transparent 0)`,
        backgroundSize: `${32 * zoom}px ${32 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      {/* Top Breadcrumb of Knowledge (Section 14) */}
      <div
        id="canvas-breadcrumb-bar"
        className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#0b0e18]/90 backdrop-blur-xl rounded-full border border-white/[0.08] shadow-2xl text-xs font-mono select-none"
      >
        <span className="text-slate-400 text-[11px]">Древо:</span>
        {breadcrumbItems.map((item, idx) => (
          <React.Fragment key={item.id}>
            <button
              onClick={() => centerOnNodeId(item.id)}
              className="text-slate-300 hover:text-white font-medium hover:underline px-1 transition-colors truncate max-w-[140px]"
            >
              {item.label}
            </button>
            {idx < breadcrumbItems.length - 1 && (
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Connectedness Lineage Chain Bar */}
      {lineageInfo && lineageInfo.orderedNodes.length > 1 && !connectPair.isActive && (
        <div
          id="canvas-lineage-bar"
          className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[calc(100vw-400px)] overflow-x-auto no-scrollbar flex items-center gap-1.5 p-1.5 bg-[#0b0e18]/95 backdrop-blur-xl rounded-2xl border border-white/[0.1] shadow-2xl text-xs"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 px-2 shrink-0">
            <GitFork className="w-3.5 h-3.5 text-purple-400" />
            <span>Связи:</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {lineageInfo.orderedNodes.map((n, i) => {
              const isCurrent = n.id === selectedNodeId;
              const isAnc = lineageInfo.ancestors.has(n.id);
              return (
                <React.Fragment key={n.id}>
                  <button
                    onClick={() => {
                      centerOnNodeId(n.id);
                      onSelectNode(n);
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isCurrent
                        ? 'bg-purple-600 text-white shadow-md ring-1 ring-purple-400'
                        : isAnc
                        ? 'bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 border border-emerald-500/30'
                    }`}
                    title={isCurrent ? 'Текущий узел' : isAnc ? 'Основа (Предшественник)' : 'Следствие (Развитие)'}
                  >
                    <span>{n.title}</span>
                    <span className="text-[10px] font-mono opacity-80 bg-black/40 px-1 py-0.5 rounded">
                      {n.formula}
                    </span>
                  </button>
                  {i < lineageInfo.orderedNodes.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Two-Node Bridge & Path Tool Overlay */}
      {connectPair.isActive && (
        <div className="absolute top-16 left-6 z-35 pointer-events-auto w-96 bg-[#0b0e18]/95 backdrop-blur-xl rounded-2xl border border-purple-500/40 shadow-2xl shadow-purple-950/40 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Связь двух концептов</h3>
            </div>
            <button
              onClick={() => setConnectPair({ isActive: false, nodeA: null, nodeB: null })}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">
                Откуда (Концепт A):
              </label>
              <select
                value={connectPair.nodeA || ''}
                onChange={(e) => setConnectPair((prev) => ({ ...prev, nodeA: e.target.value }))}
                className="w-full bg-[#131726] text-white border border-white/[0.1] rounded-lg p-1.5 text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="" disabled>Выберите узел...</option>
                {visibleNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title} ({n.formula})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">
                Куда (Концепт B):
              </label>
              <select
                value={connectPair.nodeB || ''}
                onChange={(e) => setConnectPair((prev) => ({ ...prev, nodeB: e.target.value }))}
                className="w-full bg-[#131726] text-white border border-white/[0.1] rounded-lg p-1.5 text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="" disabled>Выберите узел...</option>
                {visibleNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title} ({n.formula})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Path explanation result */}
          <div className="p-3 bg-[#070912] rounded-xl border border-white/[0.06] space-y-2 text-xs">
            {twoNodePath.length > 0 ? (
              <>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-purple-300 font-bold">Путь найден: {twoNodePath.length} узлов</span>
                  <button
                    onClick={() => {
                      const midNodeId = twoNodePath[Math.floor(twoNodePath.length / 2)];
                      if (midNodeId) centerOnNodeId(midNodeId);
                    }}
                    className="text-purple-400 hover:text-purple-300 underline font-medium"
                  >
                    Центрировать путь
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  {twoNodePath.map((nodeId, idx) => {
                    const n = nodeMap.get(nodeId);
                    if (!n) return null;
                    return (
                      <React.Fragment key={nodeId}>
                        <button
                          onClick={() => {
                            centerOnNodeId(nodeId);
                            onSelectNode(n);
                          }}
                          className="px-2 py-1 rounded-md bg-purple-500/15 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 text-[11px] font-semibold"
                        >
                          {n.title}
                        </button>
                        {idx < twoNodePath.length - 1 && (
                          <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-slate-400 italic text-[11px]">
                {connectPair.nodeA && connectPair.nodeB
                  ? 'Между этими узлами нет прямой зависимости в текущем древе.'
                  : 'Выберите два узла выше, чтобы подсветить и изучить логический мост между ними.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Floating "Back to Task" Button (Section 15 & 41) */}
      {isFarFromGoal && (
        <button
          id="btn-back-to-task-floating"
          onClick={centerOnGoal}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-2 px-4 py-2 bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold text-xs rounded-full shadow-2xl shadow-indigo-600/40 border border-indigo-400/40 animate-bounce"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span>↑ Вернуться к 2x + 4 = 10 (Шаг {Math.min(growthStage, 2)} из 2)</span>
        </button>
      )}

      {/* Toast feedback when positions reset */}
      {showResetToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#121626]/95 border border-indigo-500/50 shadow-2xl text-xs font-medium text-white backdrop-blur-md">
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Все плитки возвращены в исходное положение</span>
          </div>
        </div>
      )}

      {/* Active Task Card Overlay (Section 6) */}
      {tree.id === 'linear_mvp' && (
        <div className="absolute top-16 right-6 z-20 pointer-events-auto hidden md:block">
          <TaskGrowthCard
            growthStage={growthStage}
            onAdvanceGrowth={handleAdvanceGrowth}
            onResetGrowth={handleResetGrowth}
            onSolveSelf={onOpenStepSolver}
            onFullDecompose={handleFullDecompose}
            onLaunchWhy={() => {
              const propNode = positionedNodes.find((n) => n.id === 'lin2_prop_equality');
              if (propNode) {
                centerOnNodeId('lin2_prop_equality');
                onSelectNode(propNode);
              }
            }}
            onLaunchFocusMode={onLaunchFocusMode}
          />
        </div>
      )}

      {/* Main Scalable World Container */}
      <div
        id="canvas-world-layer"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        {/* SVG Edges Layer */}
        <svg
          className="overflow-visible"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {edges.map(({ from, to, isBridge, isWeak, isMastered, isTransitionStep }, idx) => {
            const cardW = 290;
            const cardH = 150;
            const startX = from.x + cardW / 2;
            const endX = to.x + cardW / 2;

            let startY: number;
            let endY: number;
            if (from.y + cardH < to.y) {
              startY = from.y + cardH;
              endY = to.y;
            } else if (to.y + cardH < from.y) {
              startY = from.y;
              endY = to.y + cardH;
            } else {
              startY = from.y + cardH / 2;
              endY = to.y + cardH / 2;
            }

            const dy = endY - startY;
            const cp1X = startX;
            const cp1Y = startY + dy * 0.5;
            const cp2X = endX;
            const cp2Y = endY - dy * 0.5;

            const pathD = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            const edgeKey1 = `${from.id}->${to.id}`;
            const edgeKey2 = `${to.id}->${from.id}`;
            const isTwoNodeEdge = twoNodePathEdgeKeys.has(edgeKey1) || twoNodePathEdgeKeys.has(edgeKey2);

            const isAncestorEdge = lineageInfo && (
              (lineageInfo.ancestors.has(from.id) && lineageInfo.ancestors.has(to.id)) ||
              (from.id === selectedNodeId && lineageInfo.ancestors.has(to.id)) ||
              (to.id === selectedNodeId && lineageInfo.ancestors.has(from.id))
            );

            const isDescendantEdge = lineageInfo && (
              (lineageInfo.descendants.has(from.id) && lineageInfo.descendants.has(to.id)) ||
              (from.id === selectedNodeId && lineageInfo.descendants.has(to.id)) ||
              (to.id === selectedNodeId && lineageInfo.descendants.has(from.id))
            );

            const isLineageEdge = Boolean(isAncestorEdge || isDescendantEdge);
            const matchesFilterFrom = nodeTypeFilter === 'all' || (nodeTypeFilter === 'weak' ? isWeak : from.type === nodeTypeFilter);
            const matchesFilterTo = nodeTypeFilter === 'all' || (nodeTypeFilter === 'weak' ? isWeak : to.type === nodeTypeFilter);
            const isFilterDimmed = nodeTypeFilter !== 'all' && !matchesFilterFrom && !matchesFilterTo;
            const isDimmed = Boolean(((lineageInfo || connectPair.isActive) && !isLineageEdge && !isTwoNodeEdge) || isFilterDimmed);

            const strokeColor = isTwoNodeEdge
              ? '#a855f7'
              : isAncestorEdge
              ? '#f59e0b'
              : isDescendantEdge
              ? '#06b6d4'
              : isWeak
              ? '#f43f5e'
              : isMastered
              ? '#10b981'
              : isBridge
              ? '#c084fc'
              : isTransitionStep
              ? '#6366f1'
              : '#334155';

            const strokeWidthVal = isTwoNodeEdge
              ? 4.5
              : isAncestorEdge || isDescendantEdge
              ? 3.8
              : isWeak
              ? 3
              : isTransitionStep
              ? 2.8
              : isBridge
              ? 2.6
              : isMastered
              ? 2.4
              : 1.8;

            return (
              <g
                key={`edge-${from.id}-${to.id}-${idx}`}
                className="animate-in fade-in duration-300"
                style={{ opacity: isDimmed ? 0.18 : 1, transition: 'opacity 0.2s' }}
              >
                {/* Glow underlayer for two-node or lineage or mastered or weak links */}
                {isTwoNodeEdge && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="9"
                    strokeOpacity="0.45"
                    className="animate-pulse"
                  />
                )}
                {isAncestorEdge && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="8"
                    strokeOpacity="0.35"
                  />
                )}
                {isDescendantEdge && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="8"
                    strokeOpacity="0.35"
                  />
                )}
                {!isLineageEdge && !isTwoNodeEdge && isMastered && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="6"
                    strokeOpacity="0.25"
                  />
                )}
                {!isLineageEdge && !isTwoNodeEdge && isWeak && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="7"
                    strokeOpacity="0.35"
                    className="animate-pulse"
                  />
                )}

                {/* Main line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidthVal}
                  strokeDasharray={isTwoNodeEdge ? '6, 4' : isBridge ? '6, 6' : isWeak ? '4, 4' : undefined}
                />

                {/* Physical Break Cross marker for gaps mode (Section 32, 33) */}
                {(isGapsModeActive || isWeak) && (
                  <g transform={`translate(${midX}, ${midY})`} className="cursor-pointer">
                    <circle r="12" fill="#1e1118" stroke="#f43f5e" strokeWidth="2" />
                    <line x1="-5" y1="-5" x2="5" y2="5" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="-5" y1="5" x2="5" y2="-5" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
                  </g>
                )}

                {/* Direct "Почему?" pill on transition edges (Sections 12, 13) */}
                {isTransitionStep && (
                  <foreignObject
                    x={midX - 44}
                    y={midY - 14}
                    width={88}
                    height={28}
                    className="overflow-visible pointer-events-auto"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Open the Why connection / prerequisite
                        const whyTarget = nodeMap.get('lin2_prop_equality') || to;
                        centerOnNodeId(whyTarget.id);
                        onSelectNode(whyTarget);
                      }}
                      className="px-2 py-0.5 rounded-full bg-[#121626] hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 shadow-lg text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95"
                      title="Почему можно сделать этот шаг?"
                    >
                      <HelpCircle className="w-3 h-3 text-amber-400" />
                      <span>Почему?</span>
                    </button>
                  </foreignObject>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes Layer */}
        {visibleNodes.map((node) => {
          const isMastered = masteredIds.has(node.id);
          const isWeak = weakIds.has(node.id);
          const isSelected = selectedNodeId === node.id;
          const isNodeDragging = draggingNode?.id === node.id;
          const hasCustomPos = Boolean(customPositions[node.id]);
          const isAvailable =
            !node.requires ||
            node.requires.length === 0 ||
            node.requires.some((r) => masteredIds.has(r));

          // Connectedness dimming / highlighting logic
          const isInTwoNode = twoNodePath.includes(node.id);
          const isInLineage = !lineageInfo || lineageInfo.allLineageIds.has(node.id);
          const matchesTypeFilter =
            nodeTypeFilter === 'all' ||
            (nodeTypeFilter === 'weak' ? isWeak : node.type === nodeTypeFilter);

          const isDimmed =
            !matchesTypeFilter ||
            ((lineageInfo || connectPair.isActive) && 
              (connectPair.isActive ? !isInTwoNode : !isInLineage));

          const isEndpointA = connectPair.isActive && connectPair.nodeA === node.id;
          const isEndpointB = connectPair.isActive && connectPair.nodeB === node.id;

          return (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                transform: `translate(${node.x}px, ${node.y}px)`,
                pointerEvents: 'auto',
                zIndex: isNodeDragging ? 50 : isSelected ? 30 : isInTwoNode ? 25 : 10,
              }}
              className={`animate-in fade-in zoom-in-95 duration-200 transition-opacity ${
                isDimmed ? 'opacity-35 hover:opacity-100' : 'opacity-100'
              } ${isEndpointA || isEndpointB ? 'ring-4 ring-purple-500 rounded-2xl shadow-xl shadow-purple-500/30' : ''}`}
            >
              <NodeCard
                node={node}
                isMastered={isMastered}
                isWeak={isWeak}
                isAvailable={isAvailable}
                isSelected={isSelected}
                isDragging={isNodeDragging}
                hasCustomPosition={hasCustomPos}
                zoomLevel={zoom}
                onSelect={onSelectNode}
                onWhyClick={onWhyClick}
                onContextMenu={handleContextMenu}
                onMouseDownNode={handleNodeMouseDown}
                onBreakdown={onBreakdownNode || onSelectNode}
                onDontUnderstand={onDontUnderstandNode}
              />
            </div>
          );
        })}
      </div>

      {/* Context Menu (Section 43) */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          hasCustomPosition={Boolean(customPositions[contextMenu.node.id])}
          onClose={() => setContextMenu(null)}
          onOpenNode={(node) => onSelectNode(node)}
          onWhyClick={(node) => {
            onWhyClick(node, {} as any);
          }}
          onShowPrerequisites={(node) => {
            if (node.requires && node.requires.length > 0) {
              centerOnNodeId(node.requires[0]);
            }
          }}
          onShowDependents={(node) => {
            const child = positionedNodes.find((n) => n.requires?.includes(node.id));
            if (child) centerOnNodeId(child.id);
          }}
          onFullDecompose={handleFullDecompose}
          onResetNodePosition={handleResetSingleNode}
          onResetAllPositions={hasCustomPositions ? handleResetPositions : undefined}
        />
      )}

      {/* Inline Micro Exercise Card Popup (Sections 20, 21) */}
      {activeMicroExercise && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
          <MicroExerciseCard
            question={activeMicroExercise.question}
            formula={activeMicroExercise.formula}
            expectedAnswer={activeMicroExercise.expected}
            onCorrect={() => {
              // mark node as mastered
              setTimeout(() => {
                setActiveMicroExercise(null);
              }, 1200);
            }}
            onClose={() => setActiveMicroExercise(null)}
            onDeconstructBase={onLaunchFocusMode}
          />
        </div>
      )}

      {/* Node Type / Layer Quick Filter Bar */}
      <div
        id="canvas-type-filter-bar"
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-1 p-1 bg-[#0b0e18]/90 backdrop-blur-xl rounded-xl border border-white/[0.08] shadow-2xl text-xs select-none max-w-[calc(100vw-300px)] overflow-x-auto no-scrollbar"
      >
        <span className="text-[10px] font-bold uppercase text-slate-400 px-2 flex items-center gap-1 shrink-0">
          <Filter className="w-3 h-3 text-indigo-400" />
          Слой:
        </span>
        <button
          onClick={() => setNodeTypeFilter('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            nodeTypeFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          Все ({filterCounts.all})
        </button>
        {filterCounts.axiom > 0 && (
          <button
            onClick={() => setNodeTypeFilter(nodeTypeFilter === 'axiom' ? 'all' : 'axiom')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shrink-0 ${
              nodeTypeFilter === 'axiom'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-amber-300/80 hover:text-amber-200 hover:bg-amber-500/10'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Аксиомы ({filterCounts.axiom})
          </button>
        )}
        {filterCounts.concept > 0 && (
          <button
            onClick={() => setNodeTypeFilter(nodeTypeFilter === 'concept' ? 'all' : 'concept')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shrink-0 ${
              nodeTypeFilter === 'concept'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-blue-300/80 hover:text-blue-200 hover:bg-blue-500/10'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Концепты ({filterCounts.concept})
          </button>
        )}
        {filterCounts.bridge > 0 && (
          <button
            onClick={() => setNodeTypeFilter(nodeTypeFilter === 'bridge' ? 'all' : 'bridge')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shrink-0 ${
              nodeTypeFilter === 'bridge'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-purple-300/80 hover:text-purple-200 hover:bg-purple-500/10'
            }`}
          >
            <Compass className="w-3 h-3 text-purple-400" />
            Мосты ({filterCounts.bridge})
          </button>
        )}
        {filterCounts.step > 0 && (
          <button
            onClick={() => setNodeTypeFilter(nodeTypeFilter === 'step' ? 'all' : 'step')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shrink-0 ${
              nodeTypeFilter === 'step'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-cyan-300/80 hover:text-cyan-200 hover:bg-cyan-500/10'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Шаги ({filterCounts.step})
          </button>
        )}
        {filterCounts.weak > 0 && (
          <button
            onClick={() => setNodeTypeFilter(nodeTypeFilter === 'weak' ? 'all' : 'weak')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shrink-0 ${
              nodeTypeFilter === 'weak'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-1 ring-rose-400'
                : 'text-rose-300/90 hover:text-rose-200 hover:bg-rose-500/10'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Пробелы ({filterCounts.weak})
          </button>
        )}
      </div>

      {/* Bottom Floating Controls Toolbar with Semantic Zoom (Sections 25, 26) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-1.5 p-1.5 bg-[#0d101a]/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/80">
        {/* Semantic Zoom Presets (Section 25) */}
        <div className="flex items-center gap-1 px-1 py-0.5 bg-[#050507] rounded-xl border border-white/[0.06] mr-1">
          <button
            onClick={() => setZoom(0.45)}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              zoom < 0.6
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Семантический зум: Макро-разделы"
          >
            1. Макро
          </button>
          <button
            onClick={() => setZoom(0.75)}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              zoom >= 0.6 && zoom < 0.9
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Семантический зум: Темы"
          >
            2. Темы
          </button>
          <button
            onClick={() => setZoom(1.0)}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              zoom >= 0.9 && zoom < 1.25
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Семантический зум: Концепты"
          >
            3. Концепты
          </button>
          <button
            onClick={() => setZoom(1.4)}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              zoom >= 1.25
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Семантический зум: Детальный разбор"
          >
            4. Детали
          </button>
        </div>

        <button
          id="btn-zoom-in"
          onClick={() => setZoom((z) => Math.min(z * 1.2, 2.2))}
          className="p-2 rounded-xl text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors"
          title="Приблизить"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          id="btn-zoom-out"
          onClick={() => setZoom((z) => Math.max(z / 1.2, 0.35))}
          className="p-2 rounded-xl text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors"
          title="Отдалить"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-white/[0.08] mx-0.5" />

        <button
          id="btn-center-goal"
          onClick={centerOnGoal}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/[0.08] hover:text-white transition-colors"
          title="Найти цель задачи"
        >
          <Target className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">К цели</span>
        </button>

        <button
          id="btn-reset-view"
          onClick={() => resetViewport(positionedNodes)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/[0.08] hover:text-white transition-colors"
          title="Показать все дерево"
        >
          <Maximize2 className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Все дерево</span>
        </button>

        <button
          id="btn-reset-positions"
          onClick={handleResetPositions}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            hasCustomPositions
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 shadow-md shadow-amber-500/10'
              : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
          }`}
          title="Сбросить позиции плиток до дефолтных"
        >
          <RotateCcw className={`w-4 h-4 ${hasCustomPositions ? 'text-amber-400' : 'text-slate-400'}`} />
          <span className="hidden lg:inline">Сбросить позиции</span>
          {hasCustomPositions && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <div className="w-[1px] h-4 bg-white/[0.08] mx-0.5" />

        <button
          id="btn-two-node-bridge"
          onClick={() =>
            setConnectPair((prev) => ({
              ...prev,
              isActive: !prev.isActive,
              nodeA: prev.nodeA || selectedNodeId || visibleNodes[0]?.id || null,
              nodeB: prev.nodeB || visibleNodes[visibleNodes.length - 1]?.id || null,
            }))
          }
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            connectPair.isActive
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400'
              : 'text-purple-300 hover:bg-purple-500/15 border border-purple-500/20'
          }`}
          title="Связать 2 концепта: найти логический мост между любыми двумя узлами"
        >
          <Link2 className="w-4 h-4 text-purple-400" />
          <span className="hidden xl:inline">Связь 2-х концептов</span>
        </button>

        <div className="w-[1px] h-4 bg-white/[0.08] mx-0.5" />

        <button
          onClick={() => setShowMiniMap(!showMiniMap)}
          className={`p-2 rounded-xl transition-colors ${
            showMiniMap
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:bg-white/[0.08]'
          }`}
          title="Переключить мини-карту"
        >
          <MapPin className="w-4 h-4" />
        </button>
      </div>

      {/* Mini-map (Section 27) */}
      {showMiniMap && (
        <div
          id="canvas-minimap"
          className="absolute bottom-6 right-6 z-20 w-52 h-36 bg-[#0d101a]/95 backdrop-blur-xl rounded-2xl border border-white/[0.12] shadow-2xl p-2.5 pointer-events-auto hidden md:flex flex-col select-none"
        >
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase mb-1.5 px-0.5">
            <span className="flex items-center gap-1 text-slate-300">
              <MapPin className="w-3 h-3 text-indigo-400" />
              Мини-карта
            </span>
            <span className="text-[9px] font-mono text-slate-500 font-normal">
              {visibleNodes.length} узлов
            </span>
          </div>

          <div
            onClick={handleMiniMapClick}
            className="relative flex-1 w-full bg-[#050507] rounded-xl overflow-hidden border border-white/[0.08] cursor-crosshair group shadow-inner"
            title="Нажмите в любое место мини-карты для мгновенного перемещения камеры"
          >
            {/* Viewport Camera Frustum Frame */}
            {viewportRectOnMap && (
              <div
                style={{
                  left: `${viewportRectOnMap.left}%`,
                  top: `${viewportRectOnMap.top}%`,
                  width: `${viewportRectOnMap.width}%`,
                  height: `${viewportRectOnMap.height}%`,
                }}
                className="absolute border-2 border-indigo-400/80 bg-indigo-500/15 rounded-md pointer-events-none shadow-[0_0_12px_rgba(99,102,241,0.4)] transition-all duration-75"
              />
            )}

            {/* Render node dots on mini-map */}
            {visibleNodes.map((n) => {
              const nx = ((n.x - mapBounds.minX) / mapBounds.spanX) * 100;
              const ny = ((n.y - mapBounds.minY) / mapBounds.spanY) * 100;
              const isGoal = n.type === 'goal';
              const isSelected = selectedNodeId === n.id;
              const isMastered = masteredIds.has(n.id);
              const isWeak = weakIds.has(n.id);

              return (
                <div
                  key={n.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    centerOnNodeId(n.id);
                    onSelectNode(n);
                  }}
                  style={{
                    left: `${Math.min(Math.max(nx, 4), 96)}%`,
                    top: `${Math.min(Math.max(ny, 4), 96)}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-150 ${
                    isSelected
                      ? 'w-3 h-3 rounded-full bg-purple-400 ring-2 ring-purple-300 shadow-[0_0_8px_#c084fc] z-10'
                      : isGoal
                      ? 'w-2.5 h-2.5 rounded-full bg-amber-400 ring-1 ring-amber-300 shadow-[0_0_6px_#f59e0b] z-10'
                      : isWeak
                      ? 'w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_4px_#f43f5e]'
                      : isMastered
                      ? 'w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]'
                      : 'w-1.5 h-1.5 rounded-full bg-slate-500'
                  }`}
                  title={`${n.title} (${n.formula})`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
