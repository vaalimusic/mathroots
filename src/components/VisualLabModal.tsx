import React, { useState, useEffect } from 'react';
import { X, Scale, Compass, Binary, Layers, Grid, Sparkles, PieChart, Activity, TrendingUp } from 'lucide-react';
import { VisualBalanceScale } from './visuals/VisualBalanceScale';
import { VisualParabolaPlotter } from './visuals/VisualParabolaPlotter';
import { VisualAreaModel } from './visuals/VisualAreaModel';
import { VisualNumberLine } from './visuals/VisualNumberLine';
import { VisualFractionBar } from './visuals/VisualFractionBar';
import { VisualPythagoras } from './visuals/VisualPythagoras';
import { VisualTrigCircle } from './visuals/VisualTrigCircle';
import { VisualDerivativeTangent } from './visuals/VisualDerivativeTangent';
import { VisualExpLog } from './visuals/VisualExpLog';

export type VisualLabTab =
  | 'balance'
  | 'parabola'
  | 'numberline'
  | 'area'
  | 'fractions'
  | 'pythagoras'
  | 'trig'
  | 'derivative'
  | 'explog';

interface VisualLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: VisualLabTab;
}

export const VisualLabModal: React.FC<VisualLabModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'balance',
}) => {
  const [activeTab, setActiveTab] = useState<VisualLabTab>(defaultTab);

  useEffect(() => {
    if (defaultTab && isOpen) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="visual-lab-modal"
        className="relative w-full max-w-4xl bg-[#090b14] border border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100"
      >
        {/* Top Header */}
        <div className="p-5 sm:px-6 border-b border-white/[0.08] flex items-center justify-between bg-[#0e111d]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                Визуальная лаборатория математики
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Интерактивные примеры
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Понимаем суть формул на пальцах, весах и геометрии — без сухих правил и без нейросетей
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="p-3 sm:px-6 bg-[#070910] border-b border-white/[0.06] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('balance')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'balance'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Scale className="w-4 h-4 text-indigo-400" />
            <span>Весы уравнений (2x + 4 = 10)</span>
          </button>

          <button
            onClick={() => setActiveTab('parabola')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'parabola'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Парабола и дискриминант</span>
          </button>

          <button
            onClick={() => setActiveTab('numberline')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'numberline'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Binary className="w-4 h-4 text-amber-400" />
            <span>Числовая прямая</span>
          </button>

          <button
            onClick={() => setActiveTab('area')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'area'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Grid className="w-4 h-4 text-purple-400" />
            <span>Геометрия площади (a·(b+c))</span>
          </button>

          <button
            onClick={() => setActiveTab('fractions')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'fractions'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <PieChart className="w-4 h-4 text-cyan-400" />
            <span>Дроби и доли (1/2 + 1/3)</span>
          </button>

          <button
            onClick={() => setActiveTab('pythagoras')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'pythagoras'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Compass className="w-4 h-4 text-rose-400" />
            <span>Теорема Пифагора</span>
          </button>

          <button
            onClick={() => setActiveTab('trig')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'trig'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Compass className="w-4 h-4 text-pink-400" />
            <span>Тригонометрия (sin²x + cos²x = 1)</span>
          </button>

          <button
            onClick={() => setActiveTab('derivative')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'derivative'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Производная (касательная)</span>
          </button>

          <button
            onClick={() => setActiveTab('explog')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'explog'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Экспонента и Логарифм (y = aˣ ↔ logₐx)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'balance' && <VisualBalanceScale />}
          {activeTab === 'parabola' && <VisualParabolaPlotter />}
          {activeTab === 'numberline' && <VisualNumberLine />}
          {activeTab === 'area' && <VisualAreaModel />}
          {activeTab === 'fractions' && <VisualFractionBar />}
          {activeTab === 'pythagoras' && <VisualPythagoras />}
          {activeTab === 'trig' && <VisualTrigCircle />}
          {activeTab === 'derivative' && <VisualDerivativeTangent />}
          {activeTab === 'explog' && <VisualExpLog />}
        </div>
      </div>
    </div>
  );
};
