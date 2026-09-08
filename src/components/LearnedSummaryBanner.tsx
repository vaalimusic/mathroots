import React from 'react';
import { Sparkles, CheckCircle2, ArrowUpRight, X, TreeDeciduous } from 'lucide-react';

interface LearnedSummaryBannerProps {
  onDismiss: () => void;
  onExploreConcept: (nodeId: string) => void;
}

export const LearnedSummaryBanner: React.FC<LearnedSummaryBannerProps> = ({
  onDismiss,
  onExploreConcept,
}) => {
  return (
    <div
      id="learned-summary-banner"
      className="absolute bottom-28 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[calc(100%-32px)] bg-[#0d101a]/95 backdrop-blur-2xl border border-emerald-500/40 rounded-2xl p-4 shadow-2xl shadow-emerald-950/70 text-white animate-in slide-in-from-bottom-5 duration-300 select-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Итог решения задачи</h4>
            <p className="text-[11px] text-emerald-400 font-medium">
              Теперь ты понимаешь ещё один фундаментальный элемент!
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-2 my-3 text-xs">
        <div className="p-2 bg-white/[0.04] rounded-xl border border-white/[0.06]">
          <span className="text-slate-400 text-[10px] block">Использовано навыков</span>
          <span className="font-bold text-white text-sm">7 навыков</span>
        </div>
        <div className="p-2 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
          <span className="text-emerald-400 text-[10px] block">Новый освоенный</span>
          <span className="font-bold text-emerald-300 text-xs truncate block">
            Свойства равенства
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-white/[0.08]">
        <span className="text-[11px] text-slate-400">
          6 уже были освоены ранее
        </span>
        <button
          onClick={() => onExploreConcept('lin2_prop_equality')}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
        >
          <span>Изучить «Свойства равенства»</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
