import React, { useState } from 'react';
import { MathTree, MacroCategory } from '../types';
import { MACRO_CATEGORIES, INITIAL_TREES } from '../data/trees';
import { MathFormula } from './MathFormula';
import {
  Binary,
  Variable,
  Shapes,
  Sigma,
  ArrowDownRight,
  Compass,
  X,
  Search,
  CheckCircle2,
  TreeDeciduous,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface MacroUniverseOverlayProps {
  isOpen: boolean;
  trees?: MathTree[];
  activeTreeId?: string;
  onSelectCategory: (treeId: string) => void;
  onClose: () => void;
}

export const MacroUniverseOverlay: React.FC<MacroUniverseOverlayProps> = ({
  isOpen,
  trees = INITIAL_TREES,
  activeTreeId,
  onSelectCategory,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Binary':
        return <Binary className="w-5 h-5 text-amber-400" />;
      case 'Variable':
        return <Variable className="w-5 h-5 text-indigo-400" />;
      case 'Shapes':
        return <Shapes className="w-5 h-5 text-emerald-400" />;
      case 'Sigma':
        return <Sigma className="w-5 h-5 text-purple-400" />;
      default:
        return <Compass className="w-5 h-5 text-blue-400" />;
    }
  };

  const domainMap: Record<string, string[]> = {
    numbers: ['fractions'],
    algebra: ['linear_mvp', 'quadratic', 'linear', 'exp_log_mvp'],
    geometry: ['pythagoras', 'trigonometry'],
    calculus: ['derivative_tangent', 'surface_integral'],
  };

  const filteredTrees = trees.filter((tree) => {
    const matchesSearch =
      tree.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tree.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tree.goalFormula.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedDomain === 'all') return true;

    const domainTreeIds = domainMap[selectedDomain] || [];
    return domainTreeIds.includes(tree.id);
  });

  return (
    <div
      id="macro-universe-overlay"
      className="fixed inset-0 z-50 bg-[#050507]/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200 select-none"
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#0a0d16] border border-white/[0.1] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between gap-4 shrink-0 bg-[#0d101c]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Макро-уровень Семантического Зума</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Вселенная Математики — Карта Дисциплин
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Все высшие разделы математики непрерывно растут из общих арифметических корней.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Macro Domain Filter Cards */}
        <div className="p-6 bg-[#080a14] border-b border-white/[0.06] space-y-4 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {MACRO_CATEGORIES.map((cat) => {
              const isSelected = selectedDomain === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedDomain(isSelected ? 'all' : cat.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-150 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-400'
                      : 'bg-[#0d101a] border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-[#121624] border border-white/[0.08]">
                      {getIcon(cat.iconName)}
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{cat.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                      {cat.items.join(', ')}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по задачам и графам (уравнения, тригонометрия, интегралы...)"
              className="w-full pl-9 pr-4 py-2.5 bg-[#0e1220] border border-white/[0.1] focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          </div>
        </div>

        {/* Trees Grid */}
        <div className="p-6 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span>Доступные графы знаний ({filteredTrees.length}):</span>
            {selectedDomain !== 'all' && (
              <button
                onClick={() => setSelectedDomain('all')}
                className="text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Сбросить фильтр
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTrees.map((t) => {
              const isActive = t.id === activeTreeId;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    onSelectCategory(t.id);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between space-y-3 ${
                    isActive
                      ? 'bg-indigo-950/30 border-indigo-500/60 ring-1 ring-indigo-500 shadow-xl shadow-indigo-950/40'
                      : 'bg-[#0d101c] border-white/[0.08] hover:border-indigo-500/40 hover:bg-[#101424]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        {t.category}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {t.nodes.length} узлов
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {t.title}
                    </h3>

                    <div className="p-2 bg-[#060810] rounded-xl border border-white/[0.06] text-center font-mono text-emerald-300 text-xs">
                      <MathFormula math={t.goalFormula} />
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-semibold">
                    <span className={isActive ? 'text-indigo-300' : 'text-slate-400 group-hover:text-slate-200'}>
                      {isActive ? 'Текущее дерево' : 'Открыть граф'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
