import React, { useState, useMemo } from 'react';
import { parseEquationToAST, renderTeX } from '../utils/mathEngine';
import { ASTNode } from '../types';
import {
  Network,
  Binary,
  Code2,
  Sparkles,
  Layers,
  ChevronRight,
  HelpCircle,
  X,
  CheckCircle2
} from 'lucide-react';

interface ASTExplorerModalProps {
  isOpen: boolean;
  initialEquation?: string;
  onClose: () => void;
}

export const ASTExplorerModal: React.FC<ASTExplorerModalProps> = ({
  isOpen,
  initialEquation = '2x + 4 = 10',
  onClose,
}) => {
  const [equationText, setEquationText] = useState(initialEquation);

  const parsedAST = useMemo(() => {
    try {
      return parseEquationToAST(equationText);
    } catch (err) {
      return null;
    }
  }, [equationText]);

  if (!isOpen) return null;

  // Recursive AST node renderer
  const renderASTItem = (node: ASTNode, depth = 0): React.ReactNode => {
    const isLeaf = !node.left && !node.right && (!node.children || node.children.length === 0);

    const typeColor =
      node.type === 'Equality'
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        : node.type === 'Add' || node.type === 'Subtract'
        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
        : node.type === 'Multiply' || node.type === 'Divide'
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        : node.type === 'Variable'
        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';

    return (
      <div key={`ast-${depth}-${node.type}-${node.value || ''}`} className="flex flex-col gap-1.5 my-1">
        <div
          className="flex items-center gap-2 p-2 rounded-xl bg-[#0a0d16] border border-white/[0.06] hover:border-white/[0.15] transition-colors"
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${typeColor}`}>
            {node.type}
          </span>

          {node.value !== undefined && (
            <span className="text-xs font-mono font-bold text-white bg-white/[0.08] px-2 py-0.5 rounded">
              {String(node.value)}
            </span>
          )}

          {node.description && (
            <span className="text-xs text-slate-400 truncate">{node.description}</span>
          )}
        </div>

        {/* Child branches */}
        {node.left && renderASTItem(node.left, depth + 1)}
        {node.right && renderASTItem(node.right, depth + 1)}
        {node.children && node.children.map((child) => renderASTItem(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0d101a] border border-white/[0.08] rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AST-дерево и математический движок</h2>
              <p className="text-xs text-slate-400">
                Синтаксический анализ формул и приоритет математических операций
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

        {/* Input & Quick Equations */}
        <div className="p-5 border-b border-white/[0.08] bg-[#050507]">
          <label className="text-xs font-bold text-slate-300 block mb-1.5">
            Введите алгебраическое уравнение:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={equationText}
              onChange={(e) => setEquationText(e.target.value)}
              placeholder="Например: 2x + 4 = 10 или (x + 5) / 3 = 7"
              className="flex-1 bg-[#0d101a] border border-white/[0.1] rounded-xl px-3.5 py-2 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2 mt-3">
            {['2x + 4 = 10', '(x + 5) / 3 = 7', '3x - 9 = 0', 'x^2 - 5x + 6 = 0'].map((preset) => (
              <button
                key={preset}
                onClick={() => setEquationText(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                  equationText === preset
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* AST Tree Visualizer */}
        <div className="p-5 overflow-y-auto flex-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Иерархия абстрактного синтаксического дерева (AST)</span>
            <span className="text-[11px] font-mono text-indigo-400">Формула: {equationText}</span>
          </div>

          {parsedAST ? (
            <div className="p-4 bg-[#050507] rounded-xl border border-white/[0.06]">
              {renderASTItem(parsedAST)}
            </div>
          ) : (
            <div className="text-center p-8 text-xs text-rose-400">
              Ошибка синтаксического анализа выражения. Проверьте правильность расстановки знаков.
            </div>
          )}

          {/* Educational Note */}
          <div className="mt-4 p-3.5 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p>
              Каждое сложное математическое действие компьютерные системы компьютерной алгебры (CAS)
              разбивают на бинарное дерево операторов. Корень дерева (<code className="text-indigo-300">Equality</code>)
              требует синхронного применения обратных функций к левому (<code className="text-indigo-300">Left</code>)
              и правому (<code className="text-indigo-300">Right</code>) поддеревьям.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
