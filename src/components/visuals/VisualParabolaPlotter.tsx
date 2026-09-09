import React, { useState } from 'react';
import { RotateCcw, Info, Sparkles, CheckCircle2 } from 'lucide-react';

interface VisualParabolaPlotterProps {
  initialA?: number;
  initialB?: number;
  initialC?: number;
}

export const VisualParabolaPlotter: React.FC<VisualParabolaPlotterProps> = ({
  initialA = 1,
  initialB = -5,
  initialC = 6,
}) => {
  const [a, setA] = useState<number>(initialA);
  const [b, setB] = useState<number>(initialB);
  const [c, setC] = useState<number>(initialC);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);

  // Discriminant
  const D = b * b - 4 * a * c;

  // Vertex (safe against division by zero if a === 0)
  const xv = a !== 0 ? -b / (2 * a) : 0;
  const yv = a * xv * xv + b * xv + c;

  // Roots
  let roots: number[] = [];
  if (a !== 0) {
    if (D > 0) {
      const r1 = (-b - Math.sqrt(D)) / (2 * a);
      const r2 = (-b + Math.sqrt(D)) / (2 * a);
      roots = [Math.min(r1, r2), Math.max(r1, r2)];
    } else if (D === 0) {
      roots = [xv];
    }
  }

  // Format quadratic equation string
  const formatFormula = () => {
    let res = '';
    if (a === 1) res += 'x²';
    else if (a === -1) res += '-x²';
    else if (a !== 0) res += `${a}x²`;

    if (b !== 0) {
      const sign = b > 0 ? (res ? ' + ' : '') : ' - ';
      const absB = Math.abs(b);
      res += `${sign}${absB === 1 ? '' : absB}x`;
    }

    if (c !== 0) {
      const sign = c > 0 ? (res ? ' + ' : '') : ' - ';
      res += `${sign}${Math.abs(c)}`;
    } else if (!res) {
      res = '0';
    }
    return res;
  };

  // Coordinate system mapping:
  // We want to map mathematical coordinates x in [-4, 8], y in [-4, 10]
  // onto SVG width 400, height 260
  const svgWidth = 400;
  const svgHeight = 240;
  const xMin = -3;
  const xMax = 7;
  const yMin = -3;
  const yMax = 9;

  const mapX = (xVal: number) => ((xVal - xMin) / (xMax - xMin)) * svgWidth;
  const mapY = (yVal: number) => svgHeight - ((yVal - yMin) / (yMax - yMin)) * svgHeight;

  // Generate smooth path points for the parabola
  const step = 0.1;
  const points: string[] = [];
  for (let x = xMin; x <= xMax; x += step) {
    const y = a * x * x + b * x + c;
    const px = mapX(x);
    const py = mapY(y);
    // Limit to reasonable viewport
    if (py >= -50 && py <= svgHeight + 50) {
      points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    }
  }
  const pathD = points.length > 0 ? `M ${points.join(' L ')}` : '';

  const handleApplyPreset = (pa: number, pb: number, pc: number) => {
    setA(pa);
    setB(pb);
    setC(pc);
  };

  return (
    <div className="bg-[#090c15] border border-white/[0.08] rounded-2xl p-4 text-slate-200 select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div>
          <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
            Геометрическая модель: График функции и нули
          </div>
          <div className="text-sm font-bold text-white font-mono flex items-center gap-2 mt-0.5">
            <span>y = {formatFormula()}</span>
          </div>
        </div>

        {/* Discriminant Tag */}
        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
              D > 0
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : D === 0
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
            }`}
          >
            D = {D.toFixed(1)} ({D > 0 ? '2 корня' : D === 0 ? '1 корень' : '0 корней'})
          </div>
          <button
            onClick={() => handleApplyPreset(1, -5, 6)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Сбросить к x² - 5x + 6"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Coordinate Plane */}
      <div className="relative w-full h-60 bg-[#04060a] rounded-xl overflow-hidden border border-white/[0.05]">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
            const mathX = xMin + (mouseX / svgWidth) * (xMax - xMin);
            const mathY = a * mathX * mathX + b * mathX + c;
            setHoverCoord({ x: mathX, y: mathY });
          }}
          onMouseLeave={() => setHoverCoord(null)}
        >
          {/* Grid lines */}
          {Array.from({ length: 11 }).map((_, i) => {
            const gx = xMin + i;
            const px = mapX(gx);
            return (
              <line
                key={`gx-${i}`}
                x1={px}
                y1="0"
                x2={px}
                y2={svgHeight}
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="1"
              />
            );
          })}
          {Array.from({ length: 13 }).map((_, i) => {
            const gy = yMin + i;
            const py = mapY(gy);
            return (
              <line
                key={`gy-${i}`}
                x1="0"
                y1={py}
                x2={svgWidth}
                y2={py}
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="1"
              />
            );
          })}

          {/* Axes: Ox (y=0) & Oy (x=0) */}
          <line
            x1="0"
            y1={mapY(0)}
            x2={svgWidth}
            y2={mapY(0)}
            stroke="#475569"
            strokeWidth="1.5"
          />
          <line
            x1={mapX(0)}
            y1="0"
            x2={mapX(0)}
            y2={svgHeight}
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* Axis Labels */}
          <text x={svgWidth - 16} y={mapY(0) - 6} fill="#94a3b8" fontSize="11" fontFamily="monospace">
            x
          </text>
          <text x={mapX(0) + 6} y="16" fill="#94a3b8" fontSize="11" fontFamily="monospace">
            y
          </text>

          {/* Tick numbers on Ox */}
          {[-2, -1, 1, 2, 3, 4, 5, 6].map((tick) => (
            <text
              key={`tick-${tick}`}
              x={mapX(tick)}
              y={mapY(0) + 14}
              fill="#64748b"
              fontSize="9"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {tick}
            </text>
          ))}

          {/* Shaded Area between roots when D > 0 */}
          {D > 0 && roots.length === 2 && (
            <rect
              x={mapX(roots[0])}
              y={Math.min(mapY(0), mapY(yv))}
              width={mapX(roots[1]) - mapX(roots[0])}
              height={Math.abs(mapY(0) - mapY(yv))}
              fill="rgba(99, 102, 241, 0.08)"
            />
          )}

          {/* Parabola Curve */}
          <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />

          {/* Vertex Point */}
          <circle
            cx={mapX(xv)}
            cy={mapY(yv)}
            r="4.5"
            fill="#a855f7"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <text
            x={mapX(xv)}
            y={mapY(yv) + (yv < 0 ? 15 : -8)}
            fill="#c084fc"
            fontSize="10"
            textAnchor="middle"
            fontFamily="monospace"
            fontWeight="bold"
          >
            Вершина ({xv.toFixed(1)}, {yv.toFixed(1)})
          </text>

          {/* Root Points on Ox */}
          {roots.map((rootVal, idx) => (
            <g key={`root-${idx}`}>
              <circle
                cx={mapX(rootVal)}
                cy={mapY(0)}
                r="6"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
                className="animate-pulse"
              />
              <text
                x={mapX(rootVal)}
                y={mapY(0) - 10}
                fill="#34d399"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="monospace"
              >
                x{roots.length > 1 ? idx + 1 : ''} = {rootVal.toFixed(1)}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Coordinate Tooltip */}
        {hoverCoord && (
          <div className="absolute top-2 left-2 bg-[#0c101d]/90 border border-white/[0.1] rounded px-2 py-0.5 text-[10px] font-mono text-slate-300">
            x: {hoverCoord.x.toFixed(2)}, y: {hoverCoord.y.toFixed(2)}
          </div>
        )}
      </div>

      {/* Preset Buttons */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-400">Быстрые примеры:</div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleApplyPreset(1, -5, 6)}
            className="px-2.5 py-1 text-xs font-mono rounded-lg bg-[#0e121e] border border-white/[0.06] hover:border-indigo-500/40 text-slate-300 transition-colors"
          >
            x² - 5x + 6 = 0 (2 корня: 2 и 3)
          </button>
          <button
            onClick={() => handleApplyPreset(1, -4, 4)}
            className="px-2.5 py-1 text-xs font-mono rounded-lg bg-[#0e121e] border border-white/[0.06] hover:border-indigo-500/40 text-slate-300 transition-colors"
          >
            x² - 4x + 4 = 0 (D = 0, корень 2)
          </button>
          <button
            onClick={() => handleApplyPreset(1, 2, 4)}
            className="px-2.5 py-1 text-xs font-mono rounded-lg bg-[#0e121e] border border-white/[0.06] hover:border-indigo-500/40 text-slate-300 transition-colors"
          >
            x² + 2x + 4 = 0 (D &lt; 0, висит в воздухе)
          </button>
        </div>
      </div>

      {/* Interactive Coefficient Sliders */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/[0.08]">
        <div>
          <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
            <span>a = {a}</span>
          </div>
          <input
            type="range"
            min="-2"
            max="3"
            step="0.5"
            value={a}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (val !== 0) setA(val);
            }}
            className="w-full accent-indigo-500 cursor-pointer"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
            <span>b = {b}</span>
          </div>
          <input
            type="range"
            min="-8"
            max="8"
            step="1"
            value={b}
            onChange={(e) => setB(parseInt(e.target.value, 10))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
            <span>c = {c}</span>
          </div>
          <input
            type="range"
            min="-8"
            max="10"
            step="1"
            value={c}
            onChange={(e) => setC(parseInt(e.target.value, 10))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Clear Self-Explanatory Summary Box */}
      <div className="p-3 bg-[#0c0f1a] rounded-xl border border-white/[0.06] text-xs text-slate-300 leading-relaxed">
        <strong>Геометрическая суть корней:</strong> Решить уравнение <span className="font-mono text-indigo-300 font-semibold">{formatFormula()} = 0</span> — это значит найти точки, где парабола опускается до высоты <span className="font-mono text-emerald-400">y = 0</span> (пересекает ось <span className="font-mono">Ox</span>).{' '}
        {roots.length === 2 ? (
          <span>В точках <span className="font-mono text-emerald-400 font-bold">x = {roots[0].toFixed(1)}</span> и <span className="font-mono text-emerald-400 font-bold">x = {roots[1].toFixed(1)}</span> высота равна строго 0!</span>
        ) : roots.length === 1 ? (
          <span>В вершине <span className="font-mono text-emerald-400 font-bold">x = {roots[0].toFixed(1)}</span> парабола касается оси Ox (ровно 1 корень)!</span>
        ) : (
          <span className="text-rose-300">Парабола висит в воздухе и не пересекает ось Ox (действительных корней нет, D &lt; 0).</span>
        )}
      </div>
    </div>
  );
};
