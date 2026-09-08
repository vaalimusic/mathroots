import React, { useEffect, useRef } from 'react';
import { MathNode } from '../types';
import {
  HelpCircle,
  ArrowUpRight,
  GitPullRequest,
  Star,
  Layers,
  PlusCircle,
  Edit,
  Network,
  RotateCcw,
} from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  node: MathNode;
  hasCustomPosition?: boolean;
  onClose: () => void;
  onOpenNode: (node: MathNode) => void;
  onWhyClick: (node: MathNode) => void;
  onShowPrerequisites: (node: MathNode) => void;
  onShowDependents: (node: MathNode) => void;
  onFullDecompose: (node: MathNode) => void;
  onResetNodePosition?: (node: MathNode) => void;
  onResetAllPositions?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  node,
  hasCustomPosition = false,
  onClose,
  onOpenNode,
  onWhyClick,
  onShowPrerequisites,
  onShowDependents,
  onFullDecompose,
  onResetNodePosition,
  onResetAllPositions,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('scroll', onClose);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', onClose);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      id="node-context-menu"
      style={{ left: `${x}px`, top: `${y}px` }}
      className="fixed z-50 w-56 bg-[#0e1220]/95 backdrop-blur-xl border border-white/[0.12] rounded-2xl shadow-2xl shadow-black/80 py-1.5 text-xs text-slate-200 select-none animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="px-3 py-1.5 border-b border-white/[0.08] mb-1">
        <div className="font-bold text-white truncate">{node.title}</div>
        <div className="text-[10px] text-slate-400 truncate font-mono">{node.formula}</div>
      </div>

      <button
        onClick={() => {
          onOpenNode(node);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/[0.08] hover:text-white transition-colors"
      >
        <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />
        <span>Открыть карточку</span>
      </button>

      <button
        onClick={() => {
          onWhyClick(node);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/[0.08] hover:text-white transition-colors"
      >
        <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
        <span>Почему это работает?</span>
      </button>

      <button
        onClick={() => {
          onShowPrerequisites(node);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/[0.08] hover:text-white transition-colors"
      >
        <GitPullRequest className="w-3.5 h-3.5 text-blue-400" />
        <span>Что требуется перед этим?</span>
      </button>

      <button
        onClick={() => {
          onShowDependents(node);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/[0.08] hover:text-white transition-colors"
      >
        <Network className="w-3.5 h-3.5 text-purple-400" />
        <span>Где используется?</span>
      </button>

      <div className="my-1 border-t border-white/[0.06]" />

      <button
        onClick={() => {
          onFullDecompose(node);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/[0.08] hover:text-white transition-colors"
      >
        <Layers className="w-3.5 h-3.5 text-emerald-400" />
        <span>Разобрать до фундамента</span>
      </button>

      {(onResetNodePosition || onResetAllPositions) && (
        <>
          <div className="my-1 border-t border-white/[0.06]" />
          {onResetNodePosition && hasCustomPosition && (
            <button
              onClick={() => {
                onResetNodePosition(node);
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/[0.08] text-amber-300 hover:text-amber-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Сбросить позицию этой плитки</span>
            </button>
          )}

          {onResetAllPositions && (
            <button
              onClick={() => {
                onResetAllPositions();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Сбросить все плитки в дефолт</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};
