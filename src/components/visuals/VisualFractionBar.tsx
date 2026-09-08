import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

export const VisualFractionBar: React.FC = () => {
  const [f1Num, setF1Num] = useState(1);
  const [f1Den, setF1Den] = useState(2);
  const [f2Num, setF2Num] = useState(1);
  const [f2Den, setF2Den] = useState(3);
  const [showCommonSubdivision, setShowCommonSubdivision] = useState(true);

  // Common denominator (LCM)
  const gcd = (x: number, y: number): number => (!y ? x : gcd(y, x % y));
  const lcm = (x: number, y: number): number => (x * y) / gcd(x, y);

  const commonDen = lcm(f1Den, f2Den);
  const conv1Num = f1Num * (commonDen / f1Den);
  const conv2Num = f2Num * (commonDen / f2Den);
  const sumNum = conv1Num + conv2Num;

  return (
    <div className="bg-[#090c15] border border-white/[0.08] rounded-2xl p-4 text-slate-200 select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div>
          <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
            Дроби и доли: Наглядный общий знаменатель
          </div>
          <div className="text-sm font-bold text-white font-mono flex items-center gap-2 mt-0.5">
            <span>
              {f1Num}/{f1Den} + {f2Num}/{f2Den} = {conv1Num}/{commonDen} + {conv2Num}/{commonDen} ={' '}
              <span className="text-emerald-400 font-bold">{sumNum}/{commonDen}</span>
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowCommonSubdivision(!showCommonSubdivision)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
            showCommonSubdivision
              ? 'bg-indigo-600 text-white border-indigo-400'
              : 'bg-[#0e121e] text-slate-400 border-white/[0.08] hover:text-white'
          }`}
        >
          {showCommonSubdivision ? 'Сетка шестых (НОК)' : 'Исходные полосы'}
        </button>
      </div>

      {/* Visual Fraction Strips */}
      <div className="bg-[#04060a] p-4 rounded-xl border border-white/[0.05] space-y-4">
        {/* Strip 1: e.g. 1/2 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-indigo-300">
            <span>Первая дробь: {f1Num}/{f1Den} ({showCommonSubdivision ? `${conv1Num}/${commonDen}` : ''})</span>
            <span>{( (f1Num / f1Den) * 100 ).toFixed(0)}% единицы</span>
          </div>
          <div className="h-9 w-full bg-[#121626] rounded-lg border border-white/[0.08] overflow-hidden flex">
            {Array.from({ length: showCommonSubdivision ? commonDen : f1Den }).map((_, i) => {
              const isActive = showCommonSubdivision ? i < conv1Num : i < f1Num;
              return (
                <div
                  key={`f1-${i}`}
                  style={{ width: `${100 / (showCommonSubdivision ? commonDen : f1Den)}%` }}
                  className={`h-full border-r border-black/30 flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-transparent text-slate-600'
                  }`}
                >
                  {showCommonSubdivision ? '1/6' : '1/2'}
                </div>
              );
            })}
          </div>
        </div>

        {/* Strip 2: e.g. 1/3 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-purple-300">
            <span>Вторая дробь: {f2Num}/{f2Den} ({showCommonSubdivision ? `${conv2Num}/${commonDen}` : ''})</span>
            <span>{( (f2Num / f2Den) * 100 ).toFixed(0)}% единицы</span>
          </div>
          <div className="h-9 w-full bg-[#121626] rounded-lg border border-white/[0.08] overflow-hidden flex">
            {Array.from({ length: showCommonSubdivision ? commonDen : f2Den }).map((_, i) => {
              const isActive = showCommonSubdivision ? i < conv2Num : i < f2Num;
              return (
                <div
                  key={`f2-${i}`}
                  style={{ width: `${100 / (showCommonSubdivision ? commonDen : f2Den)}%` }}
                  className={`h-full border-r border-black/30 flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                    isActive ? 'bg-purple-600 text-white' : 'bg-transparent text-slate-600'
                  }`}
                >
                  {showCommonSubdivision ? '1/6' : '1/3'}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sum Combined Strip */}
        <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
          <div className="flex justify-between text-xs font-mono text-emerald-300 font-bold">
            <span>Результат суммы: {conv1Num} шестых + {conv2Num} шестых = {sumNum}/{commonDen}</span>
            <span>{((sumNum / commonDen) * 100).toFixed(0)}% целого</span>
          </div>
          <div className="h-10 w-full bg-[#121626] rounded-lg border border-emerald-500/30 overflow-hidden flex shadow-lg shadow-emerald-500/10">
            {Array.from({ length: commonDen }).map((_, i) => {
              const isFromF1 = i < conv1Num;
              const isFromF2 = i >= conv1Num && i < sumNum;
              const isFilled = isFromF1 || isFromF2;

              return (
                <div
                  key={`sum-${i}`}
                  style={{ width: `${100 / commonDen}%` }}
                  className={`h-full border-r border-black/30 flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                    isFromF1
                      ? 'bg-indigo-600 text-white'
                      : isFromF2
                      ? 'bg-purple-600 text-white'
                      : 'bg-transparent text-slate-600'
                  }`}
                >
                  {isFilled ? '1/6' : ''}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Warning Box on Common Misconception */}
      <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-xs text-rose-200 leading-relaxed">
        <strong>Главная ловушка у новичков:</strong> Ни в коем случае нельзя складывать числители и знаменатели: $1/2 + 1/3 \ne 2/5$! 
        Полоса $2/5$ — это меньше половины, а $1/2$ уже занимает пол-линейки. Правильный путь — нарезать обе полоски на одинаковые дольки (шестые части) и сложить их: $3/6 + 2/6 = 5/6$.
      </div>
    </div>
  );
};
