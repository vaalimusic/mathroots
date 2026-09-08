import React from 'react';
import { MathNode } from '../types';
import { MathFormula } from './MathFormula';
import {
  CheckCircle2,
  HelpCircle,
  GitCommit,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  Compass,
  GripVertical,
  Scale,
  Lightbulb,
} from 'lucide-react';

interface NodeCardProps {
  node: MathNode;
  isMastered: boolean;
  isWeak: boolean;
  isAvailable: boolean;
  isSelected: boolean;
  isDragging?: boolean;
  hasCustomPosition?: boolean;
  zoomLevel: number;
  onSelect: (node: MathNode) => void;
  onWhyClick: (node: MathNode, e: React.MouseEvent) => void;
  onContextMenu?: (node: MathNode, e: React.MouseEvent) => void;
  onMouseDownNode?: (node: MathNode, e: React.MouseEvent) => void;
  onBreakdown?: (node: MathNode) => void;
  onDontUnderstand?: (node: MathNode) => void;
}

export const NodeCard: React.FC<NodeCardProps> = ({
  node,
  isMastered,
  isWeak,
  isAvailable,
  isSelected,
  isDragging = false,
  hasCustomPosition = false,
  zoomLevel,
  onSelect,
  onWhyClick,
  onContextMenu,
  onMouseDownNode,
  onBreakdown,
  onDontUnderstand,
}) => {
  const isMicro = zoomLevel > 1.15;
  const isMacro = zoomLevel < 0.65;

  // Type badge info
  const getTypeBadge = () => {
    switch (node.type) {
      case 'axiom':
        return { label: 'Аксиома', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30' };
      case 'bridge':
        return { label: 'Мост смыслов', bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
      case 'step':
        return { label: 'Шаг решения', bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30' };
      case 'goal':
        return { label: 'Цель задачи', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold' };
      default:
        return { label: 'Понятие', bg: 'bg-white/[0.06] text-slate-300 border-white/10' };
    }
  };

  const typeBadge = getTypeBadge();

  // If zoomed far out, show condensed semantic node
  if (isMacro) {
    return (
      <div
        id={`node-macro-${node.id}`}
        onMouseDown={(e) => {
          if (onMouseDownNode) onMouseDownNode(node, e);
        }}
        onContextMenu={(e) => {
          if (onContextMenu) {
            e.preventDefault();
            onContextMenu(node, e);
          }
        }}
        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-xl cursor-grab active:cursor-grabbing transition-all ${
          isDragging
            ? 'ring-2 ring-indigo-400 scale-105 shadow-2xl z-50 bg-indigo-950 text-white'
            : isMastered
            ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
            : isWeak
            ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.5)]'
            : 'bg-[#0d101a] text-slate-200 border-white/[0.1] hover:border-indigo-400'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate max-w-[170px]">
          <GripVertical className="w-3 h-3 text-slate-500 opacity-60 flex-shrink-0" />
          <span className="truncate">{node.title}</span>
          {hasCustomPosition && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Позиция изменена вручную" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      id={`node-card-${node.id}`}
      onMouseDown={(e) => {
        if (onMouseDownNode) onMouseDownNode(node, e);
      }}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault();
          onContextMenu(node, e);
        }
      }}
      className={`group relative rounded-xl border p-4 w-[290px] select-none backdrop-blur-md cursor-grab active:cursor-grabbing ${
        isDragging
          ? 'ring-2 ring-indigo-400 shadow-2xl shadow-indigo-950/80 scale-[1.03] z-50 bg-[#161c32] border-indigo-400 transition-none'
          : isSelected
          ? 'ring-2 ring-indigo-500 shadow-2xl bg-[#121626]/95 border-indigo-400 shadow-indigo-950/60 transition-all duration-150'
          : isMastered
          ? 'bg-[#091512]/95 border-emerald-500/30 shadow-lg shadow-emerald-950/40 hover:border-emerald-500/60 hover:shadow-xl transition-all duration-150'
          : isWeak
          ? 'bg-[#1a0c12]/95 border-rose-500/40 shadow-lg shadow-rose-950/50 ring-1 ring-rose-500/30 hover:border-rose-500 transition-all duration-150'
          : isAvailable
          ? 'bg-[#0d101a]/95 border-white/[0.08] shadow-xl hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-black/70 transition-all duration-150'
          : 'bg-[#090b12]/80 border-white/[0.04] opacity-50 hover:opacity-90 transition-all duration-150'
      }`}
    >
      {/* Top badges bar */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5">
          <div
            className="text-slate-500 group-hover:text-indigo-300 transition-colors p-0.5"
            title="Зажмите, чтобы свободно переместить плитку по холсту"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <span
            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border font-medium uppercase tracking-wide ${typeBadge.bg}`}
          >
            {node.type === 'bridge' && <Compass className="w-3 h-3 text-purple-400" />}
            {node.type === 'goal' && <Sparkles className="w-3 h-3 text-emerald-400" />}
            {node.type === 'step' && <GitCommit className="w-3 h-3 text-blue-400" />}
            {typeBadge.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {hasCustomPosition && (
            <span
              className="w-2 h-2 rounded-full bg-amber-400/80 shadow-[0_0_6px_rgba(251,191,36,0.6)]"
              title="Перемещено пользователем (можно сбросить)"
            />
          )}

          {isMastered ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shadow-[0_0_6px_rgba(52,211,153,0.3)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Освоено
            </span>
          ) : isWeak ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_6px_rgba(244,63,94,0.3)]">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Пробел
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 font-mono">
              Уровень {node.layer}
            </span>
          )}
        </div>
      </div>

      {/* Node Title */}
      <h3 className="text-sm font-bold text-white leading-snug mb-1.5 group-hover:text-indigo-400 transition-colors">
        {node.title}
      </h3>

      {/* Formula Box */}
      <div className="my-2.5 px-3 py-2 bg-[#06070b] rounded-lg text-emerald-300 font-mono text-center flex items-center justify-center min-h-[42px] overflow-x-auto shadow-inner border border-white/[0.08]">
        <MathFormula math={node.formula} />
      </div>

      {/* Subtitle / Human explanation preview */}
      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
        {node.subtitle || node.explanationHuman}
      </p>

      {/* Micro-zoom extra details */}
      {isMicro && node.visualSteps && node.visualSteps.length > 0 && (
        <div className="mb-3 p-2 bg-[#060810] rounded-lg border border-white/[0.07] text-[11px] text-slate-300">
          <div className="font-semibold text-indigo-300 mb-1">Шаги:</div>
          <div className="space-y-0.5 font-mono text-[10.5px]">
            {node.visualSteps.slice(0, 3).map((step, idx) => (
              <div key={idx} className="truncate text-slate-300">
                {idx + 1}. {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual / Analogy chips */}
      {(node.realWorldAnalogy || node.cognitiveTrap) && (
        <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
          {node.realWorldAnalogy && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              Аналогия
            </span>
          )}
          {node.cognitiveTrap && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              Ловушка
            </span>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] mt-1 gap-1">
        <button
          id={`btn-why-${node.id}`}
          onClick={(e) => onWhyClick(node, e)}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 hover:text-white border border-indigo-500/30 transition-colors"
          title="Разобрать, почему это фундаментально работает"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span>Почему?</span>
        </button>

        {onDontUnderstand && (
          <button
            id={`btn-dont-understand-${node.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onDontUnderstand(node);
            }}
            className="inline-flex items-center gap-1 px-1.5 py-1 text-xs font-semibold rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors"
            title="Не понимаю этот узел: найти корни и пробелы"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden xs:inline sm:inline">Застрял</span>
          </button>
        )}

        <button
          id={`btn-breakdown-${node.id}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onBreakdown) onBreakdown(node);
            else onSelect(node);
          }}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-md bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-200 border border-indigo-500/40 transition-colors shadow-sm"
          title="Открыть интерактивный пошаговый разбор с весами"
        >
          <Scale className="w-3.5 h-3.5 text-indigo-400" />
          <span>Разбор</span>
        </button>

        <button
          id={`btn-details-${node.id}`}
          onClick={() => onSelect(node)}
          className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <span>Открыть</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
