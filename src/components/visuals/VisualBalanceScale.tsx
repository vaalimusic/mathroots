import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Grid,
  PieChart,
  HelpCircle,
  Plus,
  Minus,
  Divide,
  Sparkles
} from 'lucide-react';

export type BalanceScaleMode = 'linear' | 'quadratic' | 'fractions';

interface VisualBalanceScaleProps {
  initialA?: number; // coefficient of x (e.g. 2)
  initialB?: number; // constant term added (e.g. 4)
  initialC?: number; // right side target (e.g. 10)
  interactive?: boolean;
}

export const VisualBalanceScale: React.FC<VisualBalanceScaleProps> = ({
  initialA = 2,
  initialB = 4,
  initialC = 10,
  interactive = true,
}) => {
  const [mode, setMode] = useState<BalanceScaleMode>('linear');

  // --- LINEAR SCALE STATE («УБЕРИ ЛИШНЕЕ С ЧАШИ») ---
  const [boxesLeft, setBoxesLeft] = useState<number>(initialA);
  const [weightsLeft, setWeightsLeft] = useState<number>(initialB);
  const [weightsRight, setWeightsRight] = useState<number>(initialC);
  const [actionMessage, setActionMessage] = useState<string>(
    'Исходное уравнение 2x + 4 = 10. Кликайте по гирям или кнопкам ниже, чтобы изолировать x.'
  );

  // Assumed true weight of 1 box x: (initialC - initialB) / initialA
  const trueX = (initialC - initialB) / initialA;
  const [simulatedX, setSimulatedX] = useState<number>(trueX);

  // Total physical weights on pans
  const leftPanWeight = boxesLeft * simulatedX + weightsLeft;
  const rightPanWeight = weightsRight;
  const diff = leftPanWeight - rightPanWeight;

  // Beam tilt angle (-14 to +14 deg)
  const tiltAngle = Math.max(-14, Math.min(14, diff * 2.8));
  const isStrictlyBalanced = Math.abs(diff) < 0.01;
  const isSolved = boxesLeft === 1 && weightsLeft === 0 && Math.abs(weightsRight - trueX) < 0.01;

  // --- LINEAR ACTIONS ---
  const removeOneBothSides = () => {
    if (weightsLeft >= 1 && weightsRight >= 1) {
      setWeightsLeft((w) => w - 1);
      setWeightsRight((w) => w - 1);
      setActionMessage('Убрали по 1 гире с обеих чаш (−1 с каждой стороны). Равновесие сохранено!');
    } else {
      setActionMessage('Нельзя убрать гирю с обеих сторон: на одной из чаш больше нет свободных гирь.');
    }
  };

  const removeAllConstantWeights = () => {
    const toRemove = weightsLeft;
    if (toRemove > 0 && weightsRight >= toRemove) {
      setWeightsLeft(0);
      setWeightsRight((w) => w - toRemove);
      setActionMessage(
        `Сняли все ${toRemove} гири с обеих чаш (−${toRemove} с обеих сторон)! Слева остались только коробки с x.`
      );
    } else {
      setActionMessage('Гири уже убраны с левой чаши.');
    }
  };

  const divideBothSides = () => {
    if (boxesLeft > 1) {
      if (weightsLeft > 0) {
        setActionMessage('Сначала уберите свободные гири с левой чаши, чтобы делить только неизвестные x!');
        return;
      }
      const divisor = boxesLeft;
      const newRight = weightsRight / divisor;
      setBoxesLeft(1);
      setWeightsRight(newRight);
      setActionMessage(
        `Разделили обе чаши на ${divisor} равные стопки! В одной стопке остался ровно 1 x = ${newRight}. Уравнение решено!`
      );
    }
  };

  const removeOneLeftOnly = () => {
    if (weightsLeft > 0) {
      setWeightsLeft((w) => w - 1);
      setActionMessage(
        'Внимание! Вы убрали 1 гирю ТОЛЬКО с левой чаши! Весы перекосило. Нарушен фундаментальный закон равенства: левая часть стала легче!'
      );
    }
  };

  const removeOneRightOnly = () => {
    if (weightsRight > 0) {
      setWeightsRight((w) => w - 1);
      setActionMessage(
        'Внимание! Вы убрали 1 гирю ТОЛЬКО с правой чаши! Весы перекосило в другую сторону. Левая чаша перевесила!'
      );
    }
  };

  const resetLinear = (a = initialA, b = initialB, c = initialC) => {
    setBoxesLeft(a);
    setWeightsLeft(b);
    setWeightsRight(c);
    const newTrueX = (c - b) / a;
    setSimulatedX(newTrueX);
    setActionMessage(`Весы сброшены в исходное состояние: ${a}x + ${b} = ${c}.`);
  };

  // --- QUADRATIC MODE STATE (COMPLETING THE SQUARE / TILES) ---
  const [quadX, setQuadX] = useState<number>(3); // x side of tiles
  const quadB = 4; // x^2 + 4x = 21 -> (x + 2)^2 = 25 -> x = 3

  return (
    <div className="bg-[#090c15] border border-white/[0.08] rounded-2xl p-4 text-slate-200 select-none space-y-4">
      {/* Top Header with Mode Selector */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/[0.08] pb-3 gap-2">
        <div>
          <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5" />
            Интерактивный симулятор: Модели равновесия
          </div>
          <div className="text-sm font-bold text-white font-mono flex items-center gap-2 mt-0.5">
            {mode === 'linear' && (
              <>
                <span>
                  {boxesLeft}x {weightsLeft > 0 ? `+ ${weightsLeft}` : ''} {isStrictlyBalanced ? '=' : '≠'}{' '}
                  {weightsRight}
                </span>
                {isSolved ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-sans font-semibold border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Решено! x = {weightsRight}
                  </span>
                ) : isStrictlyBalanced ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-sans font-semibold border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    В равновесии
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-sans font-semibold border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {leftPanWeight > rightPanWeight ? 'Левая чаша перевешивает' : 'Правая чаша перевешивает'}
                  </span>
                )}
              </>
            )}

            {mode === 'quadratic' && <span>x² + 4x = 21 (Геометрическое дополнение до квадрата)</span>}

            {mode === 'fractions' && <span>Баланс дробей: 1/2 + 1/3 = 5/6</span>}
          </div>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex items-center gap-1 bg-[#05070d] p-1 rounded-xl border border-white/[0.06]">
          <button
            onClick={() => setMode('linear')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              mode === 'linear'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            Линейные весы
          </button>
          <button
            onClick={() => setMode('quadratic')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              mode === 'quadratic'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            Плитки (Квадрат)
          </button>
          <button
            onClick={() => setMode('fractions')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              mode === 'fractions'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            Доли дробей
          </button>
        </div>
      </div>

      {/* ===================== 1. MODE: LINEAR BALANCE SCALE ===================== */}
      {mode === 'linear' && (
        <div className="space-y-4">
          {/* Preset Equations Quick Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Пресеты уравнений:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => resetLinear(2, 4, 10)}
                className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-indigo-300 font-mono text-[11px]"
              >
                2x + 4 = 10
              </button>
              <button
                onClick={() => resetLinear(2, 5, 15)}
                className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-indigo-300 font-mono text-[11px]"
              >
                2x + 5 = 15
              </button>
              <button
                onClick={() => resetLinear(3, 6, 18)}
                className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-indigo-300 font-mono text-[11px]"
              >
                3x + 6 = 18
              </button>
              <button
                onClick={() => resetLinear()}
                className="p-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white ml-1"
                title="Сбросить весы"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive SVG Scale Canvas */}
          <div className="relative w-full h-64 bg-[#04060a] rounded-xl overflow-hidden border border-white/[0.05] flex items-center justify-center">
            <svg viewBox="0 0 400 220" className="w-full h-full max-w-[440px]">
              {/* Central Fulcrum Stand */}
              <path d="M 180 210 L 220 210 L 205 110 L 195 110 Z" fill="#1e2438" stroke="#333f63" strokeWidth="2" />
              <circle cx="200" cy="110" r="8" fill="#6366f1" stroke="#a5b4fc" strokeWidth="2" />

              {/* Tilting Group around fulcrum (200, 110) */}
              <g transform={`rotate(${tiltAngle} 200 110)`} className="transition-transform duration-300 ease-out">
                {/* Main Crossbeam */}
                <rect x="50" y="106" width="300" height="8" rx="4" fill="#333f63" stroke="#4f5e8d" strokeWidth="1" />
                <circle cx="65" cy="110" r="4" fill="#a5b4fc" />
                <circle cx="335" cy="110" r="4" fill="#a5b4fc" />

                {/* Left Hanger Strings */}
                <line x1="65" y1="110" x2="35" y2="155" stroke="#64748b" strokeWidth="1.5" />
                <line x1="65" y1="110" x2="95" y2="155" stroke="#64748b" strokeWidth="1.5" />

                {/* Left Pan */}
                <ellipse cx="65" cy="158" rx="38" ry="8" fill="#1e293b" stroke="#6366f1" strokeWidth="2" />

                {/* Left Pan: Boxes "x" (Clickable!) */}
                {Array.from({ length: boxesLeft }).map((_, i) => (
                  <g
                    key={`box-x-${i}`}
                    transform={`translate(${38 + i * 22}, 132)`}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() =>
                      setActionMessage(
                        'Это неизвестный мешочек x. Его нельзя просто так выбросить с одной чаши! Нужно делить обе части на количество x.'
                      )
                    }
                  >
                    <rect width="20" height="20" rx="4" fill="#4338ca" stroke="#818cf8" strokeWidth="1.5" />
                    <text
                      x="10"
                      y="14"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      x
                    </text>
                  </g>
                ))}

                {/* Left Pan: Free Weight Units (Clickable!) */}
                {Array.from({ length: Math.round(weightsLeft) }).map((_, i) => (
                  <circle
                    key={`left-dot-${i}`}
                    cx={46 + (i % 4) * 11}
                    cy={150 - Math.floor(i / 4) * 9}
                    r="4.5"
                    fill="#f59e0b"
                    stroke="#fbbf24"
                    strokeWidth="1.2"
                    className="cursor-pointer hover:scale-125 transition-transform"
                    onClick={removeOneLeftOnly}
                  >
                    <title>Нажмите, чтобы снять 1 гирю с левой чаши</title>
                  </circle>
                ))}

                {/* Right Hanger Strings */}
                <line x1="335" y1="110" x2="305" y2="155" stroke="#64748b" strokeWidth="1.5" />
                <line x1="335" y1="110" x2="365" y2="155" stroke="#64748b" strokeWidth="1.5" />

                {/* Right Pan */}
                <ellipse cx="335" cy="158" rx="38" ry="8" fill="#1e293b" stroke="#10b981" strokeWidth="2" />

                {/* Right Pan: Weight Units (Clickable!) */}
                {Array.from({ length: Math.min(24, Math.round(weightsRight)) }).map((_, i) => (
                  <circle
                    key={`right-dot-${i}`}
                    cx={316 + (i % 5) * 9}
                    cy={150 - Math.floor(i / 5) * 8}
                    r="4"
                    fill="#10b981"
                    stroke="#34d399"
                    strokeWidth="1.2"
                    className="cursor-pointer hover:scale-125 transition-transform"
                    onClick={removeOneRightOnly}
                  >
                    <title>Нажмите, чтобы снять 1 гирю с правой чаши</title>
                  </circle>
                ))}
              </g>

              {/* Red Balance Needle at the Center */}
              <line
                x1="200"
                y1="110"
                x2={200 + Math.sin((tiltAngle * Math.PI) / 180) * 38}
                y2={110 - Math.cos((tiltAngle * Math.PI) / 180) * 38}
                stroke={isStrictlyBalanced ? '#10b981' : '#f43f5e'}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            {/* Pan Weight Overlays */}
            <div className="absolute bottom-2 left-4 text-[11px] font-mono text-indigo-300 bg-[#0c101d]/85 px-2.5 py-1 rounded-lg border border-indigo-500/20">
              Левая чаша: {leftPanWeight.toFixed(1)} ед. ({boxesLeft}x + {weightsLeft})
            </div>
            <div className="absolute bottom-2 right-4 text-[11px] font-mono text-emerald-300 bg-[#0c101d]/85 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Правая чаша: {rightPanWeight.toFixed(1)} ед. ({weightsRight} гирь)
            </div>
          </div>

          {/* «Убери лишнее с чаши»: Action Control Panel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Интерактивные действия с весами:
              </span>
              <span className="text-[11px] text-slate-500">Кликайте гири или кнопки ниже</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={removeOneBothSides}
                disabled={weightsLeft === 0 || weightsRight === 0}
                className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-[#111628] hover:bg-indigo-600 hover:text-white border border-indigo-500/30 text-indigo-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
              >
                <Minus className="w-3.5 h-3.5" />
                −1 с обеих чаш
              </button>

              <button
                onClick={removeAllConstantWeights}
                disabled={weightsLeft === 0}
                className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-[#111628] hover:bg-indigo-600 hover:text-white border border-indigo-500/30 text-indigo-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
              >
                <Minus className="w-3.5 h-3.5" />
                Снять все {weightsLeft} гири
              </button>

              <button
                onClick={divideBothSides}
                disabled={boxesLeft <= 1 || weightsLeft > 0}
                className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-[#111628] hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-emerald-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
              >
                <Divide className="w-3.5 h-3.5" />
                Разделить на {boxesLeft} (найти x)
              </button>

              <button
                onClick={() => resetLinear()}
                className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/[0.08] transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Сбросить
              </button>
            </div>

            {/* Real-time Explanatory Feedback Box */}
            <div
              className={`p-3 rounded-xl border text-xs leading-relaxed transition-colors ${
                isStrictlyBalanced
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                  : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
              }`}
            >
              <strong>Отклик симулятора:</strong> {actionMessage}
            </div>
          </div>

          {/* Interactive Slider for simulated X weight */}
          {interactive && (
            <div className="pt-2 border-t border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Проверь значение веса мешочка x вручную:</span>
                <span className="font-mono font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded">
                  x = {simulatedX.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={simulatedX}
                onChange={(e) => setSimulatedX(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
                <span>x=1.0 (легче)</span>
                <span className="text-emerald-400 font-bold">x={trueX} (истинный корень!)</span>
                <span>x=8.0 (тяжелее)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== 2. MODE: QUADRATIC TILES ===================== */}
      {mode === 'quadratic' && (
        <div className="space-y-4">
          <div className="p-3 bg-[#0c0f1a] rounded-xl border border-white/[0.06] text-xs text-slate-300 leading-relaxed">
            <strong>Метод аль-Хорезми (Дополнение до квадрата):</strong> Уравнение $x^2 + 4x = 21$.
            Представим $x^2$ как большой квадрат, а $4x$ разрежем пополам на две полоски по $2x$ и приставим к краям.
            В углу не хватает маленького квадратика $2 \times 2 = 4$. Добавим $4$ к обеим частям: $(x + 2)^2 = 25 \implies x + 2 = 5 \implies x = 3$.
          </div>

          {/* SVG Geometric Tile Canvas */}
          <div className="relative w-full h-64 bg-[#04060a] rounded-xl overflow-hidden border border-white/[0.05] flex items-center justify-center">
            <svg viewBox="0 0 340 220" className="w-full h-full max-w-[360px]">
              {/* Big Square x * x */}
              <rect x="50" y="30" width="100" height="100" rx="4" fill="#4338ca" stroke="#818cf8" strokeWidth="2" />
              <text x="100" y="85" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="bold" fontFamily="monospace">
                x²
              </text>

              {/* Right strip: 2 * x */}
              <rect x="154" y="30" width="45" height="100" rx="4" fill="#6366f1" stroke="#a5b4fc" strokeWidth="1.5" />
              <text x="176" y="85" textAnchor="middle" fill="#ffffff" fontSize="12" fontFamily="monospace">
                2x
              </text>

              {/* Bottom strip: 2 * x */}
              <rect x="50" y="134" width="100" height="45" rx="4" fill="#6366f1" stroke="#a5b4fc" strokeWidth="1.5" />
              <text x="100" y="162" textAnchor="middle" fill="#ffffff" fontSize="12" fontFamily="monospace">
                2x
              </text>

              {/* Missing corner: 2 * 2 = 4 */}
              <rect
                x="154"
                y="134"
                width="45"
                height="45"
                rx="4"
                fill="#f59e0b"
                stroke="#fbbf24"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              <text x="176" y="162" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="monospace">
                +4
              </text>

              {/* Labels on sides */}
              <text x="100" y="22" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                x
              </text>
              <text x="176" y="22" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                +2
              </text>
              <text x="36" y="85" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                x
              </text>
              <text x="36" y="162" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                +2
              </text>

              {/* Right Side Equation Label */}
              <g transform="translate(230, 90)">
                <text x="0" y="0" fill="#94a3b8" fontSize="12" fontFamily="monospace">
                  Площадь = 21 + 4
                </text>
                <text x="0" y="20" fill="#34d399" fontSize="14" fontWeight="bold" fontFamily="monospace">
                  = 25 = 5²
                </text>
                <text x="0" y="42" fill="#818cf8" fontSize="12" fontFamily="monospace">
                  x + 2 = 5
                </text>
                <text x="0" y="62" fill="#38bdf8" fontSize="14" fontWeight="bold" fontFamily="monospace">
                  x = 3 ✔
                </text>
              </g>
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">Сторона полного квадрата:</span>
            <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              (x + 2)² = 25 ⇒ x = 3
            </span>
          </div>
        </div>
      )}

      {/* ===================== 3. MODE: FRACTIONS BALANCE ===================== */}
      {mode === 'fractions' && (
        <div className="space-y-4">
          <div className="p-3 bg-[#0c0f1a] rounded-xl border border-white/[0.06] text-xs text-slate-300 leading-relaxed">
            <strong>Баланс долей:</strong> Чтобы положить на чаши весов дроби с разными знаменателями, их нужно разрезать на одинаковые мерки (общий знаменатель 6).
            Половина круга — это 3 кусочка по 1/6 ($1/2 = 3/6$). Треть круга — это 2 кусочка по 1/6 ($1/3 = 2/6$).
            Вместе они дают $3/6 + 2/6 = 5/6$.
          </div>

          <div className="relative w-full h-56 bg-[#04060a] rounded-xl overflow-hidden border border-white/[0.05] flex items-center justify-center">
            <svg viewBox="0 0 360 180" className="w-full h-full max-w-[380px]">
              {/* Pan Left: 1/2 circle */}
              <g transform="translate(70, 75)">
                <path d="M 0 0 L 40 0 A 40 40 0 0 1 -40 0 Z" fill="#3b82f6" fillOpacity="0.7" stroke="#60a5fa" strokeWidth="2" />
                <text x="0" y="-10" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  1/2 (3/6)
                </text>
              </g>

              {/* Plus sign */}
              <text x="135" y="80" textAnchor="middle" fill="#94a3b8" fontSize="20" fontWeight="bold">
                +
              </text>

              {/* Pan Left: 1/3 circle */}
              <g transform="translate(190, 75)">
                <path
                  d="M 0 0 L 40 0 A 40 40 0 0 1 -20 34.6 Z"
                  fill="#10b981"
                  fillOpacity="0.7"
                  stroke="#34d399"
                  strokeWidth="2"
                />
                <text x="10" y="16" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  1/3 (2/6)
                </text>
              </g>

              {/* Equals sign */}
              <text x="245" y="80" textAnchor="middle" fill="#94a3b8" fontSize="20" fontWeight="bold">
                =
              </text>

              {/* Combined 5/6 circle */}
              <g transform="translate(305, 75)">
                <path
                  d="M 0 0 L 40 0 A 40 40 0 1 1 20 -34.6 Z"
                  fill="#8b5cf6"
                  fillOpacity="0.7"
                  stroke="#a78bfa"
                  strokeWidth="2"
                />
                <text x="-5" y="4" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="monospace">
                  5/6
                </text>
              </g>
            </svg>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-mono text-indigo-300 bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20">
            <span>3/6 (половина) + 2/6 (треть) = 5/6 (пять шестых) ✔</span>
          </div>
        </div>
      )}
    </div>
  );
};
