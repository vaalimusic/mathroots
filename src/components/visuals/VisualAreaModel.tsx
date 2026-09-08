import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface VisualAreaModelProps {
  mode?: 'distributive' | 'binomial'; // e.g. 2*(x + 2) = 2x + 4 or (x + 2)(x + 3) = x^2 + 5x + 6
}

export const VisualAreaModel: React.FC<VisualAreaModelProps> = ({ mode = 'distributive' }) => {
  const [currentMode, setCurrentMode] = useState<'distributive' | 'binomial'>(mode);
  const [xVal, setXVal] = useState<number>(3);
  const [constA, setConstA] = useState<number>(2);
  const [constB, setConstB] = useState<number>(3);

  // For distributive mode: 2 * (x + 2) = 2x + 4
  const distMultiplier = 2;
  const distConst = 2;
  const distArea1 = distMultiplier * xVal;
  const distArea2 = distMultiplier * distConst;
  const distTotalArea = distArea1 + distArea2;

  // For binomial mode: (x + constA) * (x + constB)
  const binAreaX2 = xVal * xVal;
  const binAreaAx = constA * xVal;
  const binAreaBx = constB * xVal;
  const binAreaAB = constA * constB;
  const binTotalArea = (xVal + constA) * (xVal + constB);

  return (
    <div className="bg-[#090c15] border border-white/[0.08] rounded-2xl p-4 text-slate-200 select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div>
          <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
            Геометрическая модель: Площадь прямоугольника
          </div>
          <div className="text-sm font-bold text-white font-mono flex items-center gap-2 mt-0.5">
            {currentMode === 'distributive' ? (
              <span>2 · (x + 2) = 2x + 4 = {distTotalArea}</span>
            ) : (
              <span>
                (x + {constA})(x + {constB}) = x² + {constA + constB}x + {constA * constB} = {binTotalArea}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex p-0.5 bg-[#0e121e] rounded-lg border border-white/[0.08]">
            <button
              onClick={() => setCurrentMode('distributive')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                currentMode === 'distributive' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              2(x + 2)
            </button>
            <button
              onClick={() => setCurrentMode('binomial')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                currentMode === 'binomial' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              (x + a)(x + b)
            </button>
          </div>
        </div>
      </div>

      {/* Visual Rectangle Grid */}
      <div className="relative w-full h-56 bg-[#04060a] rounded-xl overflow-hidden border border-white/[0.05] flex items-center justify-center p-3">
        {currentMode === 'distributive' ? (
          <svg viewBox="0 0 360 160" className="w-full h-full max-w-[380px]">
            {/* Height label: 2 */}
            <text x="30" y="85" fill="#94a3b8" fontSize="13" fontWeight="bold" fontFamily="monospace">
              2
            </text>

            {/* Sub-rectangle 1: 2 * x */}
            <rect x="55" y="30" width="160" height="100" fill="#4338ca" stroke="#818cf8" strokeWidth="2" rx="4" />
            <text x="135" y="20" fill="#a5b4fc" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              ширина: x ({xVal})
            </text>
            <text x="135" y="80" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              2x = {distArea1}
            </text>
            <text x="135" y="100" fill="#c7d2fe" fontSize="10" textAnchor="middle">
              (синяя площадь)
            </text>

            {/* Sub-rectangle 2: 2 * 2 */}
            <rect x="220" y="30" width="90" height="100" fill="#d97706" stroke="#fcd34d" strokeWidth="2" rx="4" />
            <text x="265" y="20" fill="#fde68a" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              ширина: 2
            </text>
            <text x="265" y="80" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              4
            </text>
            <text x="265" y="100" fill="#fef3c7" fontSize="10" textAnchor="middle">
              (оранжевая)
            </text>
          </svg>
        ) : (
          <svg viewBox="0 0 360 180" className="w-full h-full max-w-[380px]">
            {/* Labels on top: x and b */}
            <text x="110" y="18" fill="#a5b4fc" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              x ({xVal})
            </text>
            <text x="235" y="18" fill="#fbbf24" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {constB}
            </text>

            {/* Labels on left: x and a */}
            <text x="20" y="70" fill="#a5b4fc" fontSize="11" fontWeight="bold" fontFamily="monospace">
              x
            </text>
            <text x="20" y="135" fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="monospace">
              {constA}
            </text>

            {/* Tile 1: x * x = x^2 */}
            <rect x="50" y="25" width="120" height="80" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1.5" rx="3" />
            <text x="110" y="70" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              x² ({binAreaX2})
            </text>

            {/* Tile 2: x * b */}
            <rect x="175" y="25" width="120" height="80" fill="#f59e0b" stroke="#fde68a" strokeWidth="1.5" rx="3" />
            <text x="235" y="70" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {constB}x ({binAreaBx})
            </text>

            {/* Tile 3: a * x */}
            <rect x="50" y="110" width="120" height="50" fill="#10b981" stroke="#6ee7b7" strokeWidth="1.5" rx="3" />
            <text x="110" y="140" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {constA}x ({binAreaAx})
            </text>

            {/* Tile 4: a * b */}
            <rect x="175" y="110" width="120" height="50" fill="#ec4899" stroke="#f472b6" strokeWidth="1.5" rx="3" />
            <text x="235" y="140" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {binAreaAB}
            </text>
          </svg>
        )}
      </div>

      {/* Interactive Value Slider */}
      <div className="space-y-2 pt-1 border-t border-white/[0.08]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium">Значение переменной x:</span>
          <span className="font-mono font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded">
            x = {xVal}
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="6"
          step="1"
          value={xVal}
          onChange={(e) => setXVal(parseInt(e.target.value, 10))}
          className="w-full accent-indigo-500 cursor-pointer"
        />
      </div>

      {/* Clear Self-Explanatory Summary Box */}
      <div className="p-3 bg-[#0c0f1a] rounded-xl border border-white/[0.06] text-xs text-slate-300 leading-relaxed">
        <strong>Геометрический смысл:</strong> Произведение сомножителей — это площадь прямоугольника. Если разбить одну из сторон на кусочки ($x$ и $2$), общая площадь просто складывается из кусочков: $2 \times x + 2 \times 2 = 2x + 4$. Никакой магии!
      </div>
    </div>
  );
};
