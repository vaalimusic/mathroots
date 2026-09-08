import React, { useState } from 'react';
import { RotateCcw, TrendingUp, CheckCircle2, ZoomIn } from 'lucide-react';

interface VisualDerivativeTangentProps {
  x0?: number; // Base point (e.g. 1.0)
}

export const VisualDerivativeTangent: React.FC<VisualDerivativeTangentProps> = ({ x0 = 1.0 }) => {
  // Delta X slider from 2.0 down to 0.05
  const [deltaX, setDeltaX] = useState<number>(1.2);

  // Parabola f(x) = x^2
  const f = (x: number) => x * x;
  const fPrimeExact = 2 * x0; // Exact derivative at x0 for f(x)=x^2 is 2*x0 = 2

  const y0 = f(x0);
  const x1 = x0 + deltaX;
  const y1 = f(x1);

  const deltaY = y1 - y0;
  const secantSlope = deltaY / deltaX; // k_secant = Δy / Δx

  // Coordinate mapping to SVG (viewBox 0 0 340 240)
  // X range: [-0.5, 3.5] -> width 340
  // Y range: [-0.5, 9.0] -> height 240
  const mapX = (x: number) => 35 + ((x + 0.5) / 4.0) * 280;
  const mapY = (y: number) => 215 - ((y + 0.5) / 9.5) * 190;

  // Generate curve path for f(x) = x^2
  const curvePoints: string[] = [];
  for (let x = 0; x <= 3.0; x += 0.1) {
    curvePoints.push(`${mapX(x)},${mapY(f(x))}`);
  }
  const curvePath = `M ${curvePoints.join(' L ')}`;

  // Secant line points (extended through x0 and x1)
  const secLineStartX = x0 - 0.6;
  const secLineStartY = y0 - 0.6 * secantSlope;
  const secLineEndX = x1 + 0.6;
  const secLineEndY = y1 + 0.6 * secantSlope;

  // Tangent line points (exact derivative slope)
  const tanLineStartX = x0 - 0.7;
  const tanLineStartY = y0 - 0.7 * fPrimeExact;
  const tanLineEndX = x0 + 0.7;
  const tanLineEndY = y0 + 0.7 * fPrimeExact;

  const isVeryClose = deltaX <= 0.1;

  return (
    <div className="bg-[#090c15] border border-white/[0.08] rounded-2xl p-4 text-slate-200 select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div>
          <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Геометрический смысл производной: Касательная
          </div>
          <div className="text-sm font-bold text-white font-mono flex items-center gap-2 mt-0.5">
            <span>f(x) = x², точка x₀ = {x0}</span>
            {isVeryClose ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-sans font-semibold border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Секущая стала касательной! k = {secantSlope.toFixed(2)} ≈ {fPrimeExact}
              </span>
            ) : (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-sans font-semibold border border-amber-500/30">
                Секущая наклонена: k_сек = {secantSlope.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setDeltaX(1.2)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          title="Сбросить Δx"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* SVG Plotter */}
      <div className="relative w-full h-72 bg-[#04060a] rounded-xl overflow-hidden border border-white/[0.05] flex items-center justify-center">
        <svg viewBox="0 0 340 240" className="w-full h-full max-w-[400px]">
          {/* Grid and Axes */}
          <line x1="20" y1={mapY(0)} x2="330" y2={mapY(0)} stroke="#272d42" strokeWidth="1.5" />
          <line x1={mapX(0)} y1="10" x2={mapX(0)} y2="230" stroke="#272d42" strokeWidth="1.5" />

          {/* Axes labels */}
          <text x="325" y={mapY(0) - 8} fill="#94a3b8" fontSize="10" fontFamily="monospace">x</text>
          <text x={mapX(0) + 8} y="20" fill="#94a3b8" fontSize="10" fontFamily="monospace">y</text>

          {/* Function Curve f(x) = x^2 */}
          <path d={curvePath} fill="none" stroke="#6366f1" strokeWidth="2.5" />

          {/* Tangent line (Target limit state in dashed green) */}
          <line
            x1={mapX(tanLineStartX)}
            y1={mapY(tanLineStartY)}
            x2={mapX(tanLineEndX)}
            y2={mapY(tanLineEndY)}
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity={0.6}
          />

          {/* Secant line (Dynamic in bright orange/amber) */}
          <line
            x1={mapX(secLineStartX)}
            y1={mapY(secLineStartY)}
            x2={mapX(secLineEndX)}
            y2={mapY(secLineEndY)}
            stroke="#f59e0b"
            strokeWidth="2.5"
          />

          {/* Δx and Δy triangle steps */}
          <line
            x1={mapX(x0)}
            y1={mapY(y0)}
            x2={mapX(x1)}
            y2={mapY(y0)}
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray="2 2"
          />
          <line
            x1={mapX(x1)}
            y1={mapY(y0)}
            x2={mapX(x1)}
            y2={mapY(y1)}
            stroke="#ec4899"
            strokeWidth="2"
            strokeDasharray="2 2"
          />

          {/* Step Labels */}
          <text
            x={(mapX(x0) + mapX(x1)) / 2}
            y={mapY(y0) + 14}
            textAnchor="middle"
            fill="#38bdf8"
            fontSize="10"
            fontFamily="monospace"
          >
            Δx = {deltaX.toFixed(2)}
          </text>
          <text
            x={mapX(x1) + 8}
            y={(mapY(y0) + mapY(y1)) / 2 + 4}
            fill="#ec4899"
            fontSize="10"
            fontFamily="monospace"
          >
            Δy = {deltaY.toFixed(2)}
          </text>

          {/* Point P0 (x0, y0) */}
          <circle cx={mapX(x0)} cy={mapY(y0)} r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
          <text x={mapX(x0) - 22} y={mapY(y0) - 8} fill="#c7d2fe" fontSize="10" fontFamily="monospace" fontWeight="bold">
            P₀(1, 1)
          </text>

          {/* Point P1 (x0 + Δx, f(x0 + Δx)) */}
          <circle cx={mapX(x1)} cy={mapY(y1)} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
          <text x={mapX(x1) + 8} y={mapY(y1) - 4} fill="#fde68a" fontSize="10" fontFamily="monospace">
            P₁
          </text>
        </svg>

        {/* Dynamic Slope Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 text-[11px] font-mono">
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
            Наклон секущей k = Δy / Δx = {secantSlope.toFixed(3)}
          </span>
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
            Предел касательной f'(1) = 2.000
          </span>
        </div>
      </div>

      {/* Delta X Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium flex items-center gap-1.5">
            <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
            Приращение аргумента Δx (тяни влево, чтобы стянуть к 0):
          </span>
          <span className="font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">
            Δx = {deltaX.toFixed(2)}
          </span>
        </div>

        <input
          type="range"
          min="0.05"
          max="2.0"
          step="0.05"
          value={deltaX}
          onChange={(e) => setDeltaX(parseFloat(e.target.value))}
          className="w-full accent-amber-500 cursor-pointer"
        />

        <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
          <span className="text-emerald-400 font-bold">Δx → 0 (касательная, k=2)</span>
          <span>Δx = 1.0</span>
          <span>Δx = 2.0 (секущая дальше)</span>
        </div>
      </div>

      {/* Pedagogical Explanation */}
      <div className="p-3 bg-[#0c0f1a] rounded-xl border border-white/[0.06] text-xs text-slate-300 leading-relaxed">
        <strong>Что происходит при Δx → 0:</strong>
        {' '}Секущая прямая соединяет две точки P₀ и P₁. Когда мы уменьшаем Δx, вторая точка P₁ скользит по параболе прямо в P₀.
        Отношение Δy / Δx = ((1 + Δx)² − 1) / Δx = (2Δx + (Δx)²) / Δx = 2 + Δx.
        При Δx → 0 дробь стремится к ровно <span className="text-emerald-400 font-mono font-bold">2</span> — это и есть производная (угловой коэффициент касательной).
      </div>
    </div>
  );
};
