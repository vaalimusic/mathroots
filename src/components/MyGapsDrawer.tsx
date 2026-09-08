import React, { useState, useEffect } from 'react';
import { MathNode } from '../types';
import { AlertTriangle, ArrowRight, CheckCircle2, X, Sparkles, CornerDownRight } from 'lucide-react';
import { MathFormula } from './MathFormula';
import { api } from '../utils/apiClient';

interface MyGapsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToNode: (nodeId: string) => void;
}

interface GapItem {
  id: string;
  title: string;
  formula: string;
  category: string;
  reason: string;
  dependents: string[];
}

const DEFAULT_GAPS: GapItem[] = [
  {
    id: 'lin2_prop_equality',
    title: 'Свойства равенства',
    formula: 'a = b \\implies a - c = b - c',
    category: 'Алгебра',
    reason: 'Вычитание одного и того же числа из обеих частей уравнения для сохранения баланса.',
    dependents: ['Линейные уравнения', 'Системы уравнений', 'Неравенства', 'Квадратные уравнения'],
  },
  {
    id: 'lin2_concept_2x',
    title: 'Смысл записи коэффициента (2x)',
    formula: '2x = 2 \\times x',
    category: 'Основы алгебры',
    reason: 'Понимание неявного знака умножения и деления обеих частей на коэффициент.',
    dependents: ['Линейные уравнения', 'Многочлены', 'Производные', 'Физические формулы'],
  },
  {
    id: 'node_distributive_law',
    title: 'Распределительный закон (Дистрибутивность)',
    formula: 'a(b + c) = ab + ac',
    category: 'Арифметика и алгебра',
    reason: 'Раскрытие скобок и вынесение общего множителя.',
    dependents: ['Разложение на множители', 'Формулы сокращенного умножения', 'Дроби с переменными'],
  },
];

export const MyGapsDrawer: React.FC<MyGapsDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToNode,
}) => {
  const [gaps, setGaps] = useState<GapItem[]>(DEFAULT_GAPS);
  const [selectedGap, setSelectedGap] = useState<GapItem>(DEFAULT_GAPS[0]);

  useEffect(() => {
    if (isOpen) {
      api.fetchCognitiveGaps().then((remoteGaps) => {
        if (remoteGaps && remoteGaps.length > 0) {
          const mapped: GapItem[] = remoteGaps.map((g: any) => ({
            id: g.root_node_id || g.target_node_id || g.id,
            title: g.gap_concept || 'Когнитивный пробел',
            formula: 'a \\neq b',
            category: 'Диагностика',
            reason: g.root_cause || 'Выявлено отладчиком при анализе ошибки.',
            dependents: ['Фундаментальные связи'],
          }));
          setGaps([...mapped, ...DEFAULT_GAPS]);
          setSelectedGap(mapped[0]);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="my-gaps-drawer"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#0c0f1a]/95 backdrop-blur-2xl border-l border-rose-500/30 shadow-2xl p-5 flex flex-col justify-between text-white animate-in slide-in-from-right duration-300 select-none"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Режим: «Мои пробелы»</h3>
              <p className="text-[11px] text-slate-400">{gaps.length} активных пробелов</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gaps List */}
        <div className="space-y-2 mb-4">
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
            Список пробелов:
          </div>
          {gaps.map((gap) => {
            const isSelected = selectedGap.id === gap.id;
            return (
              <button
                key={gap.id}
                onClick={() => setSelectedGap(gap)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-rose-950/60 border-rose-400/80 shadow-lg shadow-rose-950/50'
                    : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-white truncate">{gap.title}</div>
                  <span className="text-[10px] text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded-md font-mono">
                    Пробел ✕
                  </span>
                </div>
                <div className="text-[11px] font-mono text-emerald-300 mt-1">
                  <MathFormula math={gap.formula} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail for Selected Gap */}
        <div className="p-4 rounded-2xl bg-[#060810] border border-white/[0.08] space-y-3">
          <div className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
            <CornerDownRight className="w-4 h-4" />
            <span>На это знание опираются:</span>
          </div>

          <div className="space-y-1.5">
            {selectedGap.dependents.map((dep, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs text-slate-300 bg-white/[0.04] p-2 rounded-lg border border-white/[0.04]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>{dep}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-white/[0.06]">
            {selectedGap.reason}
          </p>
        </div>
      </div>

      {/* Action to Jump to Gap Node on Canvas */}
      <div className="pt-4 border-t border-white/[0.08]">
        <button
          onClick={() => {
            onNavigateToNode(selectedGap.id);
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-rose-950/50 transition-all active:scale-95"
        >
          <span>Перейти к узлу на карте</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
