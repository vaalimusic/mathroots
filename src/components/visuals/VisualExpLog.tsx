import React, { useState } from 'react';
import { RotateCcw, TrendingUp, Sparkles, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

interface VisualExpLogProps {
  initialBase?: number;
  initialX?: number;
}

export const VisualExpLog: React.FC<VisualExpLogProps> = ({
  initialBase = 2,
  initialX = 1.5,
}) => {
  const [base, setBase] = useState<number>(initialBase);
  const [x0, setX0] = useState<number>(initialX);
  const [activeScenario, setActiveScenario] = useState<'math' | 'growth' | 'richter' | 'decay'>('math');

  // Compute values
  const yExp = Math.pow(base, x0); // a^x0
  // Inverse point on log: if input is yExp, log_a(yExp) should be x0
  const logInput = Math.max(yExp, 0.001);
  const logVal = Math.log(logInput) / Math.log(base);

  // SVG coordinate transformation
  // ViewBox: 0 0 360 260
  // Coordinate space: x from -3.0 to 4.5, y from -3.0 to 5.5
  const minCoordX = -3.0;
  const maxCoordX = 4.5;
  const minCoordY = -3.0;
  const maxCoordY = 5.5;

  const mapX = (x: number) => 30 + ((x - minCoordX) / (maxCoordX - minCoordX)) * 300;
  const mapY = (y: number) => 235 - ((y - minCoordY) / (maxCoordY - minCoordY)) * 210;

  // Generate curve for y = a^x
  const expPoints: string[] = [];
  for (let x = -2.8; x <= 4.0; x += 0.1) {
    const y = Math.pow(base, x);
    if (y >= minCoordY - 1 && y <= maxCoordY + 1) {
      expPoints.push(`${mapX(x).toFixed(1)},${mapY(y).toFixed(1)}`);
    }
  }
  const expPath = expPoints.length > 0 ? `M ${expPoints.join(' L ')}` : '';

  // Generate curve for y = log_a(x), x > 0
  const logPoints: string[] = [];
  for (let x = 0.08; x <= 4.4; x += 0.08) {
    const y = Math.log(x) / Math.log(base);
    if (y >= minCoordY - 1 && y <= maxCoordY + 1) {
      logPoints.push(`${mapX(x).toFixed(1)},${mapY(y).toFixed(1)}`);
    }
  }
  const logPath = logPoints.length > 0 ? `M ${logPoints.join(' L ')}` : '';

  // Symmetry line y = x
  const symStartX = mapX(-2.5);
  const symStartY = mapY(-2.5);
  const symEndX = mapX(4.2);
  const symEndY = mapY(4.2);

  // Clamp visual points
  const pExpX = mapX(x0);
  const pExpY = mapY(Math.min(Math.max(yExp, minCoordY), maxCoordY));

  const pLogX = mapX(Math.min(Math.max(yExp, 0.01), maxCoordX));
  const pLogY = mapY(Math.min(Math.max(x0, minCoordY), maxCoordY));

  // Presets
  const setPreset = (presetBase: number, presetX: number, scenario: 'math' | 'growth' | 'richter' | 'decay') => {
    setBase(presetBase);
    setX0(presetX);
    setActiveScenario(scenario);
  };

  return (
    <div className="bg-[#090c15] border border-white/[0.08] rounded-2xl p-4 text-slate-200 select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div>
          <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Экспонента и Логарифм: Симметрия зеркала y = x
          </div>
          <div className="text-sm font-bold text-white font-mono flex items-center gap-2 mt-0.5">
            <span>Основание a = {base.toFixed(2)}</span>
            <span className="text-xs text-slate-400 font-sans font-normal">
              {base > 1 ? '(Экспоненциальный рост)' : '(Экспоненциальное затухание)'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setPreset(2, 1.5, 'math')}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          title="Сбросить параметры"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scenarios pills */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-[#05060b] rounded-xl border border-white/[0.06]">
        <button
          onClick={() => setPreset(2, 1.5, 'math')}
          className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
            activeScenario === 'math'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Чистая математика (a = 2)
        </button>
        <button
          onClick={() => setPreset(2.718, 1.0, 'growth')}
          className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
            activeScenario === 'growth'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Экспонента Эйлера e^x (a ≈ 2.718)
        </button>
        <button
          onClick={() => setPreset(10, 0.5, 'richter')}
          className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
            activeScenario === 'richter'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Десятичный логарифм lg(x) (a = 10)
        </button>
        <button
          onClick={() => setPreset(0.5, 2.0, 'decay')}
          className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
            activeScenario === 'decay'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Период полураспада (a = 0.5)
        </button>
      </div>

      {/* SVG Canvas Plot */}
      <div className="relative w-full h-72 bg-[#04060a] rounded-xl overflow-hidden border border-white/[0.05] flex items-center justify-center">
        <svg viewBox="0 0 360 260" className="w-full h-full max-w-[440px]">
          {/* Grid lines */}
          <line x1="20" y1={mapY(0)} x2="350" y2={mapY(0)} stroke="#272d42" strokeWidth="1.5" />
          <line x1={mapX(0)} y1="15" x2={mapX(0)} y2="250" stroke="#272d42" strokeWidth="1.5" />

          {/* Labels for axes */}
          <text x="342" y={mapY(0) - 8} fill="#94a3b8" fontSize="10" fontFamily="monospace">x</text>
          <text x={mapX(0) + 8} y="25" fill="#94a3b8" fontSize="10" fontFamily="monospace">y</text>

          {/* Diagonal Line of Symmetry: y = x */}
          <line
            x1={symStartX}
            y1={symStartY}
            x2={symEndX}
            y2={symEndY}
            stroke="#475569"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text
            x={symEndX - 40}
            y={symEndY - 8}
            fill="#64748b"
            fontSize="9"
            fontFamily="monospace"
          >
            Зеркало: y = x
          </text>

          {/* Exponential Curve y = a^x (Indigo) */}
          <path d={expPath} fill="none" stroke="#818cf8" strokeWidth="2.5" />

          {/* Logarithmic Curve y = log_a(x) (Emerald) */}
          <path d={logPath} fill="none" stroke="#34d399" strokeWidth="2.5" />

          {/* Reflection segment connecting P and Q */}
          {yExp >= minCoordY && yExp <= maxCoordY && (
            <line
              x1={pExpX}
              y1={pExpY}
              x2={pLogX}
              y2={pLogY}
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Point P on y = a^x */}
          {yExp >= minCoordY && yExp <= maxCoordY && (
            <g>
              <circle cx={pExpX} cy={pExpY} r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" />
              <text
                x={pExpX + 8}
                y={pExpY - 6}
                fill="#a5b4fc"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                P({x0.toFixed(1)}, {yExp.toFixed(2)})
              </text>
            </g>
          )}

          {/* Point Q on y = log_a(x) */}
          {yExp >= 0.01 && (
            <g>
              <circle cx={pLogX} cy={pLogY} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              <text
                x={pLogX + 8}
                y={pLogY + 12}
                fill="#6ee7b7"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                Q({yExp.toFixed(2)}, {x0.toFixed(1)})
              </text>
            </g>
          )}
        </svg>

        {/* Floating Legend */}
        <div className="absolute top-3 left-3 bg-[#0a0d18]/90 border border-white/[0.1] rounded-lg p-2 text-[11px] space-y-1 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-indigo-300 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
            <span>y = {base.toFixed(2)}^x (Прямая функция)</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-300 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>y = log_{base.toFixed(2)}(x) (Обратная функция)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400 text-[10px]">
            <span className="w-2.5 h-0.5 bg-amber-400 inline-block" />
            <span>Смена координат: (x, y) ↔ (y, x)</span>
          </div>
        </div>
      </div>

      {/* Interactive Controls Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#060810] p-3.5 rounded-xl border border-white/[0.06]">
        {/* Slider 1: Base a */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold">Основание степени (a):</span>
            <span className="text-indigo-400 font-mono font-bold">{base.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.3"
            max={Math.max(4.0, base)}
            step="0.05"
            value={base}
            onChange={(e) => {
              const newBase = parseFloat(e.target.value);
              // Avoid exactly base 1.0 (log not defined)
              setBase(Math.abs(newBase - 1.0) < 0.05 ? 1.08 : newBase);
            }}
            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0.3 (Затухание)</span>
            <span>1.0 (Сингулярность)</span>
            <span>{Math.max(4.0, base).toFixed(1)} (Быстрый рост)</span>
          </div>
        </div>

        {/* Slider 2: x0 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold">Показатель степени (x):</span>
            <span className="text-emerald-400 font-mono font-bold">{x0.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="-1.5"
            max="2.5"
            step="0.1"
            value={x0}
            onChange={(e) => setX0(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>-1.5</span>
            <span>0.0</span>
            <span>+2.5</span>
          </div>
        </div>
      </div>

      {/* Intuition Callout */}
      <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-xs space-y-1.5">
        <div className="font-bold text-white flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Математический инвариант:</span>
        </div>
        <div className="text-slate-300 leading-relaxed font-mono">
          {base.toFixed(2)}^{x0.toFixed(2)} = <span className="text-indigo-300 font-bold">{yExp.toFixed(2)}</span>
          {' ⟺ '}
          log_{base.toFixed(2)}({yExp.toFixed(2)}) = <span className="text-emerald-300 font-bold">{logVal.toFixed(2)}</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Логарифм — это обратная операция к возведению в степень. Графики симметричны относительно диагонали y = x, потому что аргумент и результат меняются местами.
        </p>
      </div>
    </div>
  );
};
