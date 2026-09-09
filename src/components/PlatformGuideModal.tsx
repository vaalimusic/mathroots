import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Layers,
  Sparkles,
  Shield,
  Zap,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Compass,
  FileText,
  ArrowRight,
  Activity,
  PieChart,
  TrendingUp,
  Search,
} from 'lucide-react';
import { VisualLabTab } from './VisualLabModal';

interface PlatformGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVisualLab?: (tab?: VisualLabTab) => void;
  onOpenWorkout?: () => void;
  onOpenSyntaxInspector?: () => void;
  onOpenAdmin?: () => void;
  onOpenBuilder?: () => void;
  onOpenCheatSheet?: () => void;
  onOpenGaps?: () => void;
  onOpenAiSettings?: () => void;
}

type GuideTab = 'overview' | 'labs' | 'tools' | 'faq';

export const PlatformGuideModal: React.FC<PlatformGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenVisualLab,
  onOpenWorkout,
  onOpenSyntaxInspector,
  onOpenAdmin,
  onOpenBuilder,
  onOpenCheatSheet,
  onOpenGaps,
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('overview');

  if (!isOpen) return null;

  const tabs: Array<{ id: GuideTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: '1. Архитектура & Слои 0–4', icon: BookOpen },
    { id: 'labs', label: '2. 9 Визуальных лабораторий', icon: Layers },
    { id: 'tools', label: '3. Тренажер, AST & Пробелы', icon: Zap },
    { id: 'faq', label: '4. Сценарии & Hotkeys', icon: HelpCircle },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="platform-guide-modal"
        className="relative w-full max-w-5xl bg-[#090b14] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-slate-100"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#0e111d]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Руководство по платформе MathRoots
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PRODUCTION READY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Полная методическая документация: архитектура графа, 9 интерактивных лабораторий, тренажёр и горячие клавиши
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Закрыть руководство (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-black/40 border-b border-white/[0.06] overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-slate-300 text-sm leading-relaxed">
          {/* TAB 1: OVERVIEW & GRAPH ARCHITECTURE */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Vision Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900/80 border border-indigo-500/30 relative overflow-hidden">
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Философия MathRoots: Понимание вместо Зубрёжки</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Математика — это связный ориентированный граф, а не набор разрозненных формул
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
                    Когда школьник застревает на уравнении <code className="text-amber-300 font-mono">2x + 4 = 10</code>, 
                    проблема обычно не в самом уравнении, а в непонимании того, что такое равенство (принцип весов) или неявное 
                    умножение в записи <code className="text-emerald-300 font-mono">2x</code>. 
                    MathRoots визуализирует зависимости снизу вверх: от аксиом до сложных теорем.
                  </p>
                </div>
              </div>

              {/* The 5 Layers */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Пять слоёв познания (Layers 0 – 4)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-emerald-500/30 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Слой 0</div>
                      <div className="font-bold text-white text-xs">Фундамент & Аксиомы</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Числа, числовая ось, сложение/умножение, весы и идея равенства.
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-300/80 bg-emerald-950/50 px-2 py-1 rounded">
                      База начальной школы
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-sky-500/30 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-1">Слой 1</div>
                      <div className="font-bold text-white text-xs">Операции & Правила</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Обратные действия, перенос слагаемых, прибавление к обеим частям.
                      </div>
                    </div>
                    <div className="text-[10px] text-sky-300/80 bg-sky-950/50 px-2 py-1 rounded">
                      Свойства операций
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-indigo-500/30 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Слой 2</div>
                      <div className="font-bold text-white text-xs">Промежуточные свойства</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Приведение подобных слагаемых, вынесение общего множителя, скобки.
                      </div>
                    </div>
                    <div className="text-[10px] text-indigo-300/80 bg-indigo-950/50 px-2 py-1 rounded">
                      Алгебраические леммы
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-amber-500/30 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">Слой 3</div>
                      <div className="font-bold text-white text-xs">Метод решения</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Алгоритм изоляции переменной: сначала избавиться от свободных членов, затем от коэффициента.
                      </div>
                    </div>
                    <div className="text-[10px] text-amber-300/80 bg-amber-950/50 px-2 py-1 rounded">
                      Стратегия рассуждений
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-purple-500/30 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-1">Слой 4</div>
                      <div className="font-bold text-white text-xs">Итоговая задача</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Конкретная целевая задача, корень уравнения, ответ и его проверка.
                      </div>
                    </div>
                    <div className="text-[10px] text-purple-300/80 bg-purple-950/50 px-2 py-1 rounded">
                      Вершина графа
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Indicators */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                <h4 className="text-sm font-bold text-white">Индикаторы статуса узлов в графе:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0 shadow-lg shadow-emerald-500/50" />
                    <div>
                      <div className="text-xs font-bold text-emerald-300">Освоено (Mastered)</div>
                      <div className="text-[11px] text-slate-400">Тема пройдена и проверена на практике.</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                    <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shrink-0 shadow-lg shadow-rose-500/50 animate-pulse" />
                    <div>
                      <div className="text-xs font-bold text-rose-300">Пробел (Cognitive Gap)</div>
                      <div className="text-[11px] text-slate-400">Выявлена ошибка в базовом понятии.</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                    <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 shrink-0 shadow-lg shadow-indigo-500/50" />
                    <div>
                      <div className="text-xs font-bold text-indigo-300">В процессе (Active)</div>
                      <div className="text-[11px] text-slate-400">Текущий шаг решения задачи.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onOpenWorkout?.();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Открыть тренажер задач</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenCheatSheet?.();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 font-semibold text-xs transition-colors flex items-center gap-2 border border-white/[0.1]"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Смотреть конспекты & PDF</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: VISUAL LABS */}
          {activeTab === 'labs' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">9 Интерактивных визуальных лабораторий</h3>
                  <p className="text-xs text-slate-400">
                    Каждая лаборатория реализует физическую или геометрическую интуицию математического понятия
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenVisualLab?.('balance');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
                >
                  <Layers className="w-4 h-4" />
                  <span>Открыть все лаборатории</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Balances */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                        <Scale className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        Слой 0–1
                      </span>
                    </div>
                    <div className="font-bold text-white text-sm">1. Алгебраические весы</div>
                    <p className="text-xs text-slate-400">
                      Физическая аналогия уравнения: равенство как равновесие двух чаш. Добавление и вычитание гирь с обеих сторон.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenVisualLab?.('balance');
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Запустить весы</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 2. Parabola */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                        <Compass className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        Слой 2–3
                      </span>
                    </div>
                    <div className="font-bold text-white text-sm">2. Интерактивная парабола</div>
                    <p className="text-xs text-slate-400">
                      Исследование $ax^2+bx+c=0$. Интерактивные слайдеры коэффициентов, автоматический расчет дискриминанта и вершины.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenVisualLab?.('parabola');
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-xs font-semibold border border-purple-500/30 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Запустить параболу</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 3. Number Line */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                        <Activity className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                        Слой 0–1
                      </span>
                    </div>
                    <div className="font-bold text-white text-sm">3. Числовая прямая & Неравенства</div>
                    <p className="text-xs text-slate-400">
                      Визуализация положительных/отрицательных чисел, модуля числа, строгих ($&lt;$) и нестрогих ($\le$) интервалов.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenVisualLab?.('numberline');
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 text-xs font-semibold border border-sky-500/30 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Запустить числовую прямую</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 4. Fractions */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                        <PieChart className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Слой 1
                      </span>
                    </div>
                    <div className="font-bold text-white text-sm">4. Дроби: Полоски & Пирог</div>
                    <p className="text-xs text-slate-400">
                      Наглядное деление целого на части, приведение дробей к общему знаменателю и сложение без зубрёжки формул.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenVisualLab?.('fractions');
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Запустить дроби</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 5. Area Model */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        <Layers className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Слой 2
                      </span>
                    </div>
                    <div className="font-bold text-white text-sm">5. Модель площади (Скобки)</div>
                    <p className="text-xs text-slate-400">
                      Геометрическое раскрытие скобок $(a+b)(c+d) = ac+ad+bc+bd$ через разбиение площади прямоугольника на сектора.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenVisualLab?.('area');
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Запустить модель площади</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 6. Pythagoras */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                        <Compass className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        Слой 2–3
                      </span>
                    </div>
                    <div className="font-bold text-white text-sm">6. Теорема Пифагора</div>
                    <p className="text-xs text-slate-400">
                      Интерактивные квадраты на катетах $a^2, b^2$ и гипотенузе $c^2$. Наглядная сумма площадей $a^2 + b^2 = c^2$.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenVisualLab?.('pythagoras');
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Запустить теорему Пифагора</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 7. Trig Circle */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                        <Compass className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        Слой 2–4
                      </span>
                    </div>
                    <div className="font-bold text-white text-sm">7. Тригонометрический круг</div>
                    <p className="text-xs text-slate-400">
                      Единичный круг, вращение угла $\alpha$, синхронная проекция на оси $\cos$ и $\sin$, табличные значения и радианы.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenVisualLab?.('trig');
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Запустить тригонометрию</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 8. Derivative & Tangent */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                        Высшая математика
                      </span>
                    </div>
                    <div className="font-bold text-white text-sm">8. Производная & Касательная</div>
                    <p className="text-xs text-slate-400">
                      Геометрический смысл производной: стягивание секущей в касательную, угловой коэффициент наклона $k = f'(x_0)$.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenVisualLab?.('derivative');
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-teal-600/20 hover:bg-teal-600/40 text-teal-300 text-xs font-semibold border border-teal-500/30 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Запустить производную</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 9. Exp & Log */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30">
                        Слой 3–4
                      </span>
                    </div>
                    <div className="font-bold text-white text-sm">9. Экспонента & Логарифм</div>
                    <p className="text-xs text-slate-400">
                      Взаимно-обратные функции: графики $y = a^x$ и $y = \log_a(x)$, симметрия относительно диагонали $y = x$.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenVisualLab?.('explog');
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-orange-600/20 hover:bg-orange-600/40 text-orange-300 text-xs font-semibold border border-orange-500/30 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Запустить экспоненту/лог</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIAGNOSTICS, AST & WORKOUT */}
          {activeTab === 'tools' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Тренажер задач (100+ задач с генератором)</h4>
                    <p className="text-xs text-slate-400">Адаптивная практика с автоматической проверкой</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300">
                  Тренажер разбит на ключевые уровни: от простых уравнений 5-6 класса до квадратных уравнений, тригонометрии 
                  и производных. Ошибки ученика автоматически связываются с узлами понятийного графа, формируя карту пробелов.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenWorkout?.();
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition-colors"
                  >
                    Запустить тренажер
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Инспектор синтаксиса & AST (Дерево выражения)</h4>
                    <p className="text-xs text-slate-400">Визуализация скобок, неявного умножения и приоритета операций</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300">
                  Многие ошибки возникают из-за синтаксической путаницы: например, запись <code className="text-amber-300 font-mono">2(3)</code> означает{' '}
                  <code className="text-emerald-300 font-mono">2 * 3 = 6</code>, а выражение <code className="text-sky-300 font-mono">2 + 3 * 4</code>{' '}
                  выполняется как <code className="text-purple-300 font-mono">2 + 12 = 14</code>, а не <code className="text-rose-300 font-mono">20</code>. 
                  Инспектор строит интерактивное синтаксическое дерево (AST) и объясняет каждый символ.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSyntaxInspector?.();
                    }}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors"
                  >
                    Открыть инспектор синтаксиса
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Диагностика корней непонимания (Deep Gap Finder)</h4>
                    <p className="text-xs text-slate-400">Алгоритмический спуск по предкам графа</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300">
                  Если ученик нажимает «Не понимаю этот шаг», система задает 2-3 наводящих микро-вопроса по родительским узлам. 
                  Если ученик не справляется с базовым вопросом (например, сложение отрицательных чисел), узел помечается как когнитивный пробел, 
                  и ему предлагается визуальная мини-лаборатория для закрытия пробела.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenGaps?.();
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 font-bold text-xs transition-colors"
                  >
                    Посмотреть список моих пробелов
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SCENARIOS & HOTKEYS */}
          {activeTab === 'faq' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-3">
                <h4 className="text-base font-bold text-white">Ролевые сценарии использования</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                    <div className="text-indigo-400 font-bold text-xs uppercase">Для школьника / студента</div>
                    <div className="text-xs text-slate-300">
                      1. Открыть «Разобрать задачу».<br />
                      2. Если шаг непонятен — нажать «Почему?» или «Не понимаю».<br />
                      3. Открыть физическую визуальную лабораторию для наглядности.<br />
                      4. Закрепить в «Тренажере».
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                    <div className="text-emerald-400 font-bold text-xs uppercase">Для репетитора / учителя</div>
                    <div className="text-xs text-slate-300">
                      1. На уроке демонстрировать граф как карту темы.<br />
                      2. Показывать анимацию весов и параболы на интерактивной доске.<br />
                      3. Создавать кастомные деревья через «AI Конструктор» под свою программу.<br />
                      4. Печатать конспекты и карточки в PDF.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                    <div className="text-amber-400 font-bold text-xs uppercase">Для родителя</div>
                    <div className="text-xs text-slate-300">
                      1. Раздел «Мои пробелы» показывает точечные слабые места без стресса.<br />
                      2. Прогресс в процентах наглядно отражает закрытые темы.<br />
                      3. Нет механического списывания ответов: система учит рассуждать.
                    </div>
                  </div>
                </div>
              </div>

              {/* Hotkeys Table */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Горячие клавиши (Hotkeys)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-white/[0.08] flex justify-between items-center">
                    <span className="text-slate-400">Быстрый поиск темы / задачи</span>
                    <span className="px-2 py-1 rounded bg-white/10 text-white font-bold">Ctrl + K</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-white/[0.08] flex justify-between items-center">
                    <span className="text-slate-400">Новая произвольная задача</span>
                    <span className="px-2 py-1 rounded bg-white/10 text-white font-bold">Ctrl + N</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-white/[0.08] flex justify-between items-center">
                    <span className="text-slate-400">Открыть AI Конструктор</span>
                    <span className="px-2 py-1 rounded bg-white/10 text-white font-bold">Ctrl + B</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-white/[0.08] flex justify-between items-center">
                    <span className="text-slate-400">Закрыть окно / Выйти в граф</span>
                    <span className="px-2 py-1 rounded bg-white/10 text-white font-bold">Esc</span>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex justify-between items-center sm:col-span-2">
                    <span className="text-indigo-200 font-bold">Открыть руководство и инструкцию</span>
                    <span className="px-2 py-1 rounded bg-indigo-600/40 text-indigo-100 font-bold border border-indigo-400/40">F1</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:px-6 border-t border-white/[0.08] flex items-center justify-between bg-[#0e111d]/90 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>MathRoots Production v2.0 • Стек проверен и активен</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-semibold transition-colors"
          >
            Понятно, перейти к карте
          </button>
        </div>
      </div>
    </div>
  );
};
