import React, { useState } from 'react';
import { RotateCcw, Compass, CheckCircle2 } from 'lucide-react';

interface VisualTrigCircleProps {
  initialAngle?: number;
}

export const VisualTrigCircle: React.FC<VisualTrigCircleProps> = ({ initialAngle = 45 }) => {
  const [angleDeg, setAngleDeg] = useState<number>(initialAngle);

  const angleRad = (angleDeg * Math.PI) / 180;
  const cosVal = Math.cos(angleRad);
  const sinVal = Math.sin(angleRad);

  // SVG dimensions
  const center = 160;
  const radius = 110;

  // Point coordinates on circle
  const px = center + cosVal * radius;
  const py = center - sinVal * radius; // Inverted Y in SVG

  const cosSq = cosVal * cosVal;
  const sinSq = sinVal * sinVal;
  const sumSq = cosSq + sinSq; // mathematically 1.000

  // Arc path for the angle
  const arcRadius = 28;
  const arcStartX = center + arcRadius;
  const arcStartY = center;
  const arcEndX = center + Math.cos(angleRad) * arcRadius;
  const arcEndY = center - Math.sin(angleRad) * arcRadius;
  const largeArcFlag = angleDeg > 180 ? 1 : 0;
  const arcPath = `M ${center} ${center} L ${arcStartX} ${arcStartY} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} 0 ${arcEndX} ${arcEndY} Z`;

  const presetAngles = [0, 30, 45, 60, 90, 120, 180, 270, 360];

  return (
    <div className="bg-[#090c15] border border-white/[0.08] rounded-2xl p-4 text-slate-200 select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div>
          <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            Интерактивная тригонометрия: Единичная окружность
          </div>
          <div className="text-sm font-bold text-white font-mono flex items-center gap-2 mt-0.5">
            <span>sin²({angleDeg}°) + cos²({angleDeg}°) = 1</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-sans font-semibold border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {sumSq.toFixed(4)} = 1 (Инвариант)
            </span>
          </div>
        </div>

        <button
          onClick={() => setAngleDeg(45)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          title="Сбросить угол"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main SVG Circle Visualizer */}
      <div className="relative w-full h-72 bg-[#04060a] rounded-xl overflow-hidden border border-white/[0.05] flex items-center justify-center">
        <svg viewBox="0 0 320 320" className="w-full h-full max-w-[340px]">
          {/* Grid lines */}
          <line x1="20" y1={center} x2="300" y2={center} stroke="#272d42" strokeWidth="1.5" />
          <line x1={center} y1="20" x2={center} y2="300" stroke="#272d42" strokeWidth="1.5" />

          {/* Unit Circle */}
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#374151" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx={center} cy={center} r={radius} fill="#4f46e5" fillOpacity="0.04" />

          {/* Axis Labels */}
          <text x="295" y={center - 8} fill="#94a3b8" fontSize="10" fontFamily="monospace">x (cos)</text>
          <text x={center + 8} y="32" fill="#94a3b8" fontSize="10" fontFamily="monospace">y (sin)</text>
          <text x={center + radius + 4} y={center + 14} fill="#64748b" fontSize="9" fontFamily="monospace">+1</text>
          <text x={center - radius - 16} y={center + 14} fill="#64748b" fontSize="9" fontFamily="monospace">-1</text>
          <text x={center + 6} y={center - radius - 4} fill="#64748b" fontSize="9" fontFamily="monospace">+1</text>
          <text x={center + 6} y={center + radius + 12} fill="#64748b" fontSize="9" fontFamily="monospace">-1</text>

          {/* Angle sector arc */}
          {angleDeg === 360 ? (
            <circle cx={center} cy={center} r={arcRadius} fill="#f43f5e" fillOpacity="0.25" stroke="#f43f5e" strokeWidth="1.5" />
          ) : angleDeg > 0 ? (
            <path d={arcPath} fill="#f43f5e" fillOpacity="0.25" stroke="#f43f5e" strokeWidth="1.5" />
          ) : null}

          {/* Right Triangle formed by projection */}
          {/* Horizontal leg (cos x) */}
          <line x1={center} y1={center} x2={px} y2={center} stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />

          {/* Vertical leg (sin x) */}
          <line x1={px} y1={center} x2={px} y2={py} stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 2" />

          {/* Hypotenuse (Radius = 1) */}
          <line x1={center} y1={center} x2={px} y2={py} stroke="#f43f5e" strokeWidth="2.5" />

          {/* Right angle marker */}
          {Math.abs(cosVal) > 0.15 && Math.abs(sinVal) > 0.15 && (
            <rect
              x={cosVal >= 0 ? px - 8 : px}
              y={sinVal >= 0 ? center - 8 : center}
              width="8"
              height="8"
              fill="none"
              stroke="#64748b"
              strokeWidth="1"
            />
          )}

          {/* Point M on circle */}
          <circle cx={px} cy={py} r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />

          {/* Center Point */}
          <circle cx={center} cy={center} r="3" fill="#cbd5e1" />
        </svg>

        {/* Readout Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 text-[11px] font-mono">
          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">
            Катет cos(α) = {cosVal.toFixed(3)}
          </span>
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
            Катет sin(α) = {sinVal.toFixed(3)}
          </span>
          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded">
            Гипотенуза R = 1.000
          </span>
        </div>

        <div className="absolute bottom-3 right-3 text-right text-[11px] font-mono bg-[#0b0e1b]/90 px-2.5 py-1.5 rounded-lg border border-white/[0.08]">
          <div className="text-slate-400 text-[10px]">Теорема Пифагора:</div>
          <div className="text-white font-bold">
            ({cosVal.toFixed(2)})² + ({sinVal.toFixed(2)})² =
          </div>
          <div className="text-emerald-400 font-bold">
            {cosSq.toFixed(3)} + {sinSq.toFixed(3)} = 1.000
          </div>
        </div>
      </div>

      {/* Angle Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium">Угол поворота α:</span>
          <span className="font-mono font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">
            α = {angleDeg}° ({((angleDeg * Math.PI) / 180).toFixed(2)} rad)
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="360"
          step="1"
          value={angleDeg}
          onChange={(e) => setAngleDeg(parseInt(e.target.value, 10))}
          className="w-full accent-rose-500 cursor-pointer"
        />

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1 pt-1">
          <span className="text-[11px] text-slate-500 mr-1">Углы:</span>
          {presetAngles.map((deg) => (
            <button
              key={deg}
              onClick={() => setAngleDeg(deg)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                angleDeg === deg
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.1]'
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>
      </div>

      {/* Pedagogical Explanation */}
      <div className="p-3 bg-[#0c0f1a] rounded-xl border border-white/[0.06] text-xs text-slate-300 leading-relaxed">
        <strong>Связь с корнями:</strong> Точка на единичной окружности имеет координаты $(x, y) = (\cos \alpha, \sin \alpha)$.
        По теореме Пифагора для прямоугольного треугольника с гипотенузой $R = 1$ сумма квадратов катетов всегда равна квадрату гипотенузы:
        <span className="text-white font-mono font-semibold ml-1">x² + y² = 1 ⇒ cos²(α) + sin²(α) = 1</span>.
      </div>
    </div>
  );
};
