import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

export const VisualPythagoras: React.FC = () => {
  const [a, setA] = useState<number>(3);
  const [b, setB] = useState<number>(4);

  const a2 = a * a;
  const b2 = b * b;
  const c2 = a2 + b2;
  const c = Math.sqrt(c2);

  return (
    <div className="bg-[#090c15] border border-white/[0.08] rounded-2xl p-4 text-slate-200 select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div>
          <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
            Геометрическая модель: Площади квадратов на сторонах
          </div>
          <div className="text-sm font-bold text-white font-mono flex items-center gap-2 mt-0.5">
            <span>
              a² + b² = c² ⟹ {a}² + {b}² = {a2} + {b2} ={' '}
              <span className="text-emerald-400 font-bold">{c2} (c = {c.toFixed(1)})</span>
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setA(3);
            setB(4);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          title="Сбросить к 3-4-5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* SVG Canvas for Triangle & Squares */}
      <div className="relative w-full h-72 bg-[#04060a] rounded-xl overflow-hidden border border-white/[0.05] flex items-center justify-center p-2">
        {(() => {
          const scale = 14;
          const x0 = 135;
          const y0 = 190;
          const aPx = a * scale;
          const bPx = b * scale;

          // Points
          const ptC = { x: x0, y: y0 };
          const ptA = { x: x0, y: y0 - aPx };
          const ptB = { x: x0 + bPx, y: y0 };
          const ptBPrime = { x: x0 + bPx + aPx, y: y0 - bPx };
          const ptAPrime = { x: x0 + aPx, y: y0 - aPx - bPx };

          const cCenterX = x0 + (aPx + bPx) / 2;
          const cCenterY = y0 - (aPx + bPx) / 2;

          return (
            <svg viewBox="0 0 410 290" className="w-full h-full max-w-[430px]">
              {/* Square on side a (left side) */}
              <rect
                x={x0 - aPx}
                y={y0 - aPx}
                width={aPx}
                height={aPx}
                fill="rgba(99, 102, 241, 0.25)"
                stroke="#818cf8"
                strokeWidth="1.5"
                rx="3"
              />
              <text
                x={x0 - aPx / 2}
                y={y0 - aPx / 2 + 5}
                fill="#c7d2fe"
                fontSize={aPx > 40 ? '12' : '10'}
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="monospace"
              >
                a² = {a2}
              </text>

              {/* Square on side b (bottom side) */}
              <rect
                x={x0}
                y={y0}
                width={bPx}
                height={bPx}
                fill="rgba(16, 185, 129, 0.25)"
                stroke="#34d399"
                strokeWidth="1.5"
                rx="3"
              />
              <text
                x={x0 + bPx / 2}
                y={y0 + bPx / 2 + 5}
                fill="#a7f3d0"
                fontSize={bPx > 40 ? '12' : '10'}
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="monospace"
              >
                b² = {b2}
              </text>

              {/* Square on Hypotenuse c (angled) */}
              <polygon
                points={`${ptA.x},${ptA.y} ${ptB.x},${ptB.y} ${ptBPrime.x},${ptBPrime.y} ${ptAPrime.x},${ptAPrime.y}`}
                fill="rgba(245, 158, 11, 0.2)"
                stroke="#fbbf24"
                strokeWidth="1.5"
              />
              <text
                x={cCenterX}
                y={cCenterY + 4}
                fill="#fde68a"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="monospace"
              >
                c² = {c2}
              </text>

              {/* Right Triangle itself */}
              <polygon
                points={`${ptC.x},${ptC.y} ${ptA.x},${ptA.y} ${ptB.x},${ptB.y}`}
                fill="#1e293b"
                stroke="#ffffff"
                strokeWidth="2"
              />

              {/* Right angle symbol at C */}
              <polyline
                points={`${x0},${y0 - 10} ${x0 + 10},${y0 - 10} ${x0 + 10},${y0}`}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.5"
              />

              {/* Labels on sides */}
              <text
                x={x0 + 6}
                y={y0 - aPx / 2}
                fill="#a5b4fc"
                fontSize="11"
                fontWeight="bold"
                fontFamily="monospace"
              >
                a={a}
              </text>
              <text
                x={x0 + bPx / 2}
                y={y0 - 6}
                fill="#6ee7b7"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="monospace"
              >
                b={b}
              </text>
              <text
                x={(ptA.x + ptB.x) / 2 + 12}
                y={(ptA.y + ptB.y) / 2 - 8}
                fill="#fcd34d"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="monospace"
              >
                c={c.toFixed(1)}
              </text>
            </svg>
          );
        })()}
      </div>

      {/* Sliders for legs a and b */}
      <div className="grid grid-cols-2 gap-4 pt-1 border-t border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono text-indigo-300">
            <span>Катет a = {a}</span>
            <span>a² = {a2}</span>
          </div>
          <input
            type="range"
            min="2"
            max="6"
            step="1"
            value={a}
            onChange={(e) => setA(parseInt(e.target.value, 10))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono text-emerald-300">
            <span>Катет b = {b}</span>
            <span>b² = {b2}</span>
          </div>
          <input
            type="range"
            min="2"
            max="6"
            step="1"
            value={b}
            onChange={(e) => setB(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Self-explanatory explanation */}
      <div className="p-3 bg-[#0c0f1a] rounded-xl border border-white/[0.06] text-xs text-slate-300 leading-relaxed">
        <strong>В чем истинная суть теоремы Пифагора?</strong> Это не просто абстрактная формула из букв, это физическое равенство площадей! 
        Если на сторонах прямоугольного треугольника построить настоящие квадраты из плитки, то количество плиток в двух малых квадратах ($a^2$ и $b^2$) в точности до одной плиточки замостит большой квадрат на гипотенузе ($c^2$).
      </div>
    </div>
  );
};
