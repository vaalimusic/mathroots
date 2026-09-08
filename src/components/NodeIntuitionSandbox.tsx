import React, { useState } from 'react';
import { MathNode } from '../types';
import { MathFormula } from './MathFormula';
import {
  Lightbulb,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Eye,
  ArrowRight,
  RefreshCw,
  Scale,
  Brain,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

interface NodeIntuitionSandboxProps {
  node: MathNode;
}

export const NodeIntuitionSandbox: React.FC<NodeIntuitionSandboxProps> = ({ node }) => {
  // Determine experiment parameters based on node config or defaults
  const config = node.whatIfConfig || {
    title: 'Мысленный эксперимент: измени значение и проверь баланс',
    paramName: 'x',
    min: 0,
    max: 6,
    step: 1,
    defaultValue: node.formula.includes('3') ? 3 : 2,
    unit: '',
    goalValue: 3,
    explanationBalanced: 'Идеальное равновесие! Левая и правая части строго тождественны.',
    explanationUnbalanced: 'Равновесие нарушено. Уравнение превратилось в неравенство.',
  };

  const [paramValue, setParamValue] = useState<number>(config.defaultValue);
  const [activeTab, setActiveTab] = useState<'sandbox' | 'analogy' | 'trap'>('sandbox');
  const [showCounterExample, setShowCounterExample] = useState(false);

  // Evaluate dynamic state for linear equation 2x + 4 = 10 or similar
  const getExperimentState = (val: number) => {
    if (node.id.includes('lin') || node.formula.includes('2x')) {
      const leftVal = 2 * val + 4;
      const rightVal = 10;
      const isBalanced = leftVal === rightVal;
      const diff = leftVal - rightVal;
      return {
        leftFormula: `2 \\cdot (${val}) + 4 = ${leftVal}`,
        rightFormula: `10`,
        leftVal,
        rightVal,
        isBalanced,
        diff,
        message: isBalanced
          ? 'Равновесие! Только при x = 3 вес двух коробок (6) плюс 4 гири равен в точности 10.'
          : diff < 0
          ? `Левая чаша легче на ${Math.abs(diff)} ед. (${leftVal} < 10). Нужно увеличить x.`
          : `Левая чаша перевесила на ${diff} ед. (${leftVal} > 10). Нужно уменьшить x.`,
      };
    }

    if (node.id.includes('mult') || node.formula.includes('\\times') || node.formula.includes('*')) {
      const leftVal = 2 * val;
      return {
        leftFormula: `2 \\times ${val} = ${leftVal}`,
        rightFormula: `${leftVal}`,
        leftVal,
        rightVal: leftVal,
        isBalanced: true,
        diff: 0,
        message: `Умножение 2 на ${val} означает взять ${val} ровно 2 раза: ${val} + ${val} = ${leftVal}.`,
      };
    }

    if (node.id.includes('fraction') || node.formula.includes('frac')) {
      return {
        leftFormula: `\\frac{${val}}{4}`,
        rightFormula: `${(val / 4).toFixed(2)}`,
        leftVal: val,
        rightVal: 4,
        isBalanced: val === 4,
        diff: val - 4,
        message: `Взято ${val} долей из 4 равных частей целого (${Math.round((val / 4) * 100)}% от целого).`,
      };
    }

    // Default general evaluate
    return {
      leftFormula: `${config.paramName} = ${val}`,
      rightFormula: `Значение: ${val}`,
      leftVal: val,
      rightVal: config.goalValue ?? val,
      isBalanced: config.goalValue !== undefined ? val === config.goalValue : true,
      diff: config.goalValue !== undefined ? val - config.goalValue : 0,
      message:
        config.goalValue !== undefined && val === config.goalValue
          ? config.explanationBalanced || 'Точное совпадение с решением!'
          : config.explanationUnbalanced || `Текущее значение параметра: ${val}.`,
    };
  };

  const state = getExperimentState(paramValue);

  return (
    <div className="rounded-2xl border border-white/[0.1] bg-[#090b14] overflow-hidden shadow-lg space-y-0">
      {/* Sub-navigation tabs */}
      <div className="flex border-b border-white/[0.08] bg-[#0c0f1d] text-xs font-semibold">
        <button
          onClick={() => setActiveTab('sandbox')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'sandbox'
              ? 'bg-[#12162a] text-indigo-300 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>Мысленный эксперимент</span>
        </button>

        <button
          onClick={() => setActiveTab('analogy')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'analogy'
              ? 'bg-[#12162a] text-amber-300 border-b-2 border-amber-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Аналогия в жизни</span>
        </button>

        <button
          onClick={() => setActiveTab('trap')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'trap'
              ? 'bg-[#12162a] text-rose-300 border-b-2 border-rose-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>Ловушка мышления</span>
        </button>
      </div>

      <div className="p-4">
        {/* TAB 1: Interactive What-If Sandbox */}
        {activeTab === 'sandbox' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                {config.title}
              </span>
              <button
                onClick={() => setParamValue(config.defaultValue)}
                className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                title="Сбросить к исходному значению"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Сбросить</span>
              </button>
            </div>

            {/* Slider Control */}
            <div className="p-3 bg-[#0d1020] rounded-xl border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">
                  Параметр {config.paramName}:
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-sm border border-indigo-500/30">
                  {config.paramName} = {paramValue} {config.unit}
                </span>
              </div>

              <input
                type="range"
                min={config.min}
                max={config.max}
                step={config.step}
                value={paramValue}
                onChange={(e) => setParamValue(Number(e.target.value))}
                className="w-full h-1.5 bg-[#171b30] rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />

              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>мин: {config.min}</span>
                <span>цель: {config.defaultValue}</span>
                <span>макс: {config.max}</span>
              </div>
            </div>

            {/* Visual Live Balance/Formula Result */}
            <div
              className={`p-3.5 rounded-xl border transition-all duration-200 ${
                state.isBalanced
                  ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200'
                  : 'bg-[#0e1222] border-white/[0.08] text-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2.5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="font-mono text-sm bg-black/40 px-3 py-1 rounded-lg border border-white/10">
                    <MathFormula math={state.leftFormula} />
                  </div>
                  <span className="font-bold text-sm">
                    {state.isBalanced ? '=' : state.diff < 0 ? '<' : '>'}
                  </span>
                  <div className="font-mono text-sm bg-black/40 px-3 py-1 rounded-lg border border-white/10">
                    <MathFormula math={state.rightFormula} />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold shrink-0">
                  {state.isBalanced ? (
                    <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Равновесие!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      <Scale className="w-3.5 h-3.5" />
                      {state.diff < 0 ? 'Левая легче' : 'Левая тяжелее'}
                    </span>
                  )}
                </div>
              </div>

              {/* Intuitive feedback */}
              <p className="text-xs pt-2.5 leading-relaxed text-slate-300">
                {state.message}
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: Real-World Analogy */}
        {activeTab === 'analogy' && (
          <div className="space-y-3">
            {node.realWorldAnalogy ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider font-mono">
                      {node.realWorldAnalogy.metaphor}
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      {node.realWorldAnalogy.title}
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-[#0d1020] p-3 rounded-xl border border-white/[0.06]">
                  {node.realWorldAnalogy.story}
                </p>

                <div className="p-3 bg-amber-950/20 rounded-xl border border-amber-500/25 space-y-1 text-xs">
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Пример из практики:
                  </span>
                  <p className="text-amber-100/90 leading-relaxed">
                    {node.realWorldAnalogy.example}
                  </p>
                </div>
              </>
            ) : (
              /* Fallback default high-quality analogy based on node nature */
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider font-mono">
                      Аналогия из реальной жизни
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      Рыночные чашечные весы и закрытые коробки
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-[#0d1020] p-3 rounded-xl border border-white/[0.06]">
                  Представь старинные механические аптекарские весы. На левой чаше лежит 2 одинаковые непрозрачные коробочки с конфетами и гирька на 4 грамма. На правой чаше — гиря на 10 грамм. Весы стоят ровно. Чтобы узнать вес одной коробки, ты снимаешь с обеих сторон по 4 грамма. Остаётся: 2 коробки = 6 грамм. Значит, в каждой ровно 3 грамма!
                </p>

                <div className="p-3 bg-amber-950/20 rounded-xl border border-amber-500/25 space-y-1 text-xs">
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Главное правило природы:
                  </span>
                  <p className="text-amber-100/90 leading-relaxed">
                    Если сделать одно и то же действие с обеими сторонами мира (вычесть, умножить, разделить), физическое равновесие никуда не исчезнет.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Cognitive Trap (Anti-mistake) */}
        {activeTab === 'trap' && (
          <div className="space-y-3">
            {node.cognitiveTrap ? (
              <>
                <div className="p-3 bg-rose-950/30 rounded-xl border border-rose-500/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Типичная ошибка мышления:</span>
                  </div>
                  <p className="text-xs text-rose-200/90 font-mono">
                    {node.cognitiveTrap.myth}
                  </p>
                </div>

                <div className="p-3 bg-[#0d1020] rounded-xl border border-white/[0.06] space-y-1.5 text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5 text-indigo-400" />
                    Почему мозг так ошибается?
                  </span>
                  <p className="text-slate-400 leading-relaxed">
                    {node.cognitiveTrap.whyBrainFails}
                  </p>
                </div>

                <div className="p-3 bg-emerald-950/25 rounded-xl border border-emerald-500/30 space-y-1 text-xs">
                  <span className="font-bold text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Как на самом деле (Математическая правда):
                  </span>
                  <p className="text-emerald-100/90 leading-relaxed">
                    {node.cognitiveTrap.truth}
                  </p>
                </div>

                {node.cognitiveTrap.counterExample && (
                  <div className="text-xs text-slate-400 bg-black/40 p-2.5 rounded-lg border border-white/[0.06] font-mono">
                    <span className="text-amber-400 font-bold block mb-0.5">Контрпример-проверка:</span>
                    {node.cognitiveTrap.counterExample}
                  </div>
                )}
              </>
            ) : (
              /* Fallback default cognitive trap for algebra/arithmetic */
              <div className="space-y-3">
                <div className="p-3 bg-rose-950/30 rounded-xl border border-rose-500/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Типичная ошибка: путаница переноса и деления</span>
                  </div>
                  <p className="text-xs text-rose-200/90 font-mono">
                    «Если 2x = 6, то переносим 2 со знаком минус: x = 6 - 2 = 4»
                  </p>
                </div>

                <div className="p-3 bg-[#0d1020] rounded-xl border border-white/[0.06] space-y-1.5 text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5 text-indigo-400" />
                    Почему мозг так делает?
                  </span>
                  <p className="text-slate-400 leading-relaxed">
                    В школе часто заучивают механическую мантру «перенеси через знак равенства и смени плюс на минус». Мозг ленится анализировать операцию и применяет вычитание даже там, где стоит умножение (2 умножить на x).
                  </p>
                </div>

                <div className="p-3 bg-emerald-950/25 rounded-xl border border-emerald-500/30 space-y-1 text-xs">
                  <span className="font-bold text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Истинное правило:
                  </span>
                  <p className="text-emerald-100/90 leading-relaxed">
                    Число 2 связано с x умножением. Обратная операция к умножению — это <strong>деление</strong>, а не вычитание! Обе части делим на 2: x = 6 / 2 = 3.
                  </p>
                </div>

                <button
                  onClick={() => setShowCounterExample(!showCounterExample)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showCounterExample ? 'Скрыть контрпример' : 'Показать сокрушительный контрпример'}</span>
                </button>

                {showCounterExample && (
                  <div className="text-xs text-amber-200 bg-amber-950/30 p-2.5 rounded-lg border border-amber-500/30 font-mono animate-in fade-in duration-150">
                    Подставим x = 4: левая часть 2 · 4 = 8. А должно быть 6! 8 ≠ 6. Значит, x = 4 ложно!
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
