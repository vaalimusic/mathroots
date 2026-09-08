import React, { useState } from 'react';
import { RotateCcw, ArrowRight } from 'lucide-react';

interface VisualNumberLineProps {
  initialX?: number;
}

export const VisualNumberLine: React.FC<VisualNumberLineProps> = ({ initialX = 3 }) => {
  const [xVal, setXVal] = useState<number>(initialX);
  const [mode, setMode] = useState<'forward' | 'inverse'>('forward');

  // Forward: Start at 0 -> hop to 2x -> hop +4 -> lands at 2x + 4
  const term2x = 2 * xVal;
  const result = term2x + 4;

  // Axis bounds: -2 to 14
  const minVal = -2;
  const maxVal = 14;
  const svgWidth = 420;
  const mapPos = (val: number) => ((val - minVal) / (maxVal - minVal)) * (svgWidth - 40) + 20;

  return (
    <div className="bg-[#090c15] border border-white/[0.08] rounded-2xl p-4 text-slate-200 select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div>
          <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
            Числовая ось: Шаги и инверсия операций
          </div>
          <div className="text-sm font-bold text-white font-mono flex items-center gap-2 mt-0.5">
            {mode === 'forward' ? (
              <span>
                2({xVal}) + 4 = {result}{' '}
                {result === 10 ? (
                  <span className="text-emerald-400 font-sans font-semibold text-xs ml-1">✔ Цель 10 достигнута!</span>
                ) : (
                  <span className="text-slate-400 font-sans font-normal text-xs ml-1">(цель = 10)</span>
                )}
              </span>
            ) : (
              <span>
                10 - 4 = 6, затем 6 : 2 = 3
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMode(mode === 'forward' ? 'inverse' : 'forward')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#0e121e] border border-white/[0.08] text-indigo-300 hover:text-white transition-colors"
          >
            {mode === 'forward' ? 'Прямой ход (2x+4)' : 'Обратный ход (10-4:2)'}
          </button>
        </div>
      </div>

      {/* SVG Number Line Canvas */}
      <div className="relative w-full h-48 bg-[#04060a] rounded-xl overflow-hidden border border-white/[0.05] flex items-center justify-center p-2">
        <svg viewBox={`0 0 ${svgWidth} 140`} className="w-full h-full max-w-[440px]">
          {/* Main Axis Line */}
          <line x1="10" y1="90" x2={svgWidth - 10} y2="90" stroke="#475569" strokeWidth="2" />
          {/* Arrow at end */}
          <polygon
            points={`${svgWidth - 8},90 ${svgWidth - 16},85 ${svgWidth - 16},95`}
            fill="#475569"
          />

          {/* Tick marks & numbers */}
          {Array.from({ length: maxVal - minVal + 1 }).map((_, i) => {
            const val = minVal + i;
            const px = mapPos(val);
            const isTarget = val === 10;
            const isZero = val === 0;

            return (
              <g key={`tick-${val}`}>
                <line
                  x1={px}
                  y1={isZero || isTarget ? 80 : 84}
                  x2={px}
                  y2={isZero || isTarget ? 100 : 96}
                  stroke={isTarget ? '#10b981' : isZero ? '#cbd5e1' : '#64748b'}
                  strokeWidth={isTarget || isZero ? 2 : 1}
                />
                <text
                  x={px}
                  y="115"
                  fill={isTarget ? '#34d399' : isZero ? '#f8fafc' : '#64748b'}
                  fontSize={isTarget || isZero ? '11' : '9'}
                  fontWeight={isTarget || isZero ? 'bold' : 'normal'}
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Target 10 Flag Marker */}
          <g transform={`translate(${mapPos(10)}, 70)`}>
            <circle cx="0" cy="0" r="4" fill="#10b981" />
            <line x1="0" y1="0" x2="0" y2="-25" stroke="#10b981" strokeWidth="1.5" />
            <polygon points="0,-25 15,-20 0,-15" fill="#10b981" />
          </g>

          {mode === 'forward' ? (
            <>
              {/* Arc 1: Hop 0 -> 2x */}
              <path
                d={`M ${mapPos(0)} 90 Q ${(mapPos(0) + mapPos(term2x)) / 2} 35 ${mapPos(term2x)} 90`}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />
              <text
                x={(mapPos(0) + mapPos(term2x)) / 2}
                y="35"
                fill="#a5b4fc"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="monospace"
              >
                2 · {xVal} = {term2x}
              </text>

              {/* Arc 2: Hop 2x -> 2x + 4 */}
              <path
                d={`M ${mapPos(term2x)} 90 Q ${(mapPos(term2x) + mapPos(result)) / 2} 45 ${mapPos(result)} 90`}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
              />
              <text
                x={(mapPos(term2x) + mapPos(result)) / 2}
                y="48"
                fill="#fcd34d"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="monospace"
              >
                +4
              </text>

              {/* Current landing indicator */}
              <circle
                cx={mapPos(result)}
                cy="90"
                r="6"
                fill={result === 10 ? '#10b981' : '#f43f5e'}
                stroke="#ffffff"
                strokeWidth="2"
                className={result === 10 ? 'animate-pulse' : ''}
              />
            </>
          ) : (
            <>
              {/* Backward Arc 1: 10 -> 6 (-4) */}
              <path
                d={`M ${mapPos(10)} 90 Q ${(mapPos(10) + mapPos(6)) / 2} 40 ${mapPos(6)} 90`}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
              />
              <text
                x={(mapPos(10) + mapPos(6)) / 2}
                y="38"
                fill="#fcd34d"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="monospace"
              >
                -4
              </text>

              {/* Backward Arc 2: 6 -> 3 (:2) */}
              <path
                d={`M ${mapPos(6)} 90 Q ${(mapPos(6) + mapPos(3)) / 2} 45 ${mapPos(3)} 90`}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
              />
              <text
                x={(mapPos(6) + mapPos(3)) / 2}
                y="45"
                fill="#6ee7b7"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="monospace"
              >
                : 2
              </text>

              {/* Final target point 3 */}
              <circle
                cx={mapPos(3)}
                cy="90"
                r="6"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
                className="animate-pulse"
              />
            </>
          )}
        </svg>
      </div>

      {/* Slider */}
      <div className="space-y-2 pt-1 border-t border-white/[0.08]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium">Перемести x и посмотри, куда упадет стрелка:</span>
          <span className="font-mono font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded">
            x = {xVal}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="5"
          step="1"
          value={xVal}
          onChange={(e) => setXVal(parseInt(e.target.value, 10))}
          className="w-full accent-indigo-500 cursor-pointer"
        />
      </div>

      {/* Self-explanatory explanation */}
      <div className="p-3 bg-[#0c0f1a] rounded-xl border border-white/[0.06] text-xs text-slate-300 leading-relaxed">
        <strong>Что показывает прямая:</strong> Решение уравнения — это поиск такого шага $x$, чтобы после прыжка на $2x$ и смещения на $+4$ мы приземлились ровно в отметку $10$. Только шаг $x = 3$ приводит ровно в цель!
      </div>
    </div>
  );
};
