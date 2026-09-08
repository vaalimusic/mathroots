import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Layers,
  Sparkles,
  Shield,
  Server,
  Zap,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Compass,
  FileText,
  Copy,
  Check,
  ArrowRight,
  Database,
  Terminal,
  Activity,
  Cpu,
  Key,
  PieChart,
  TrendingUp,
  Search
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
}

type GuideTab = 'overview' | 'labs' | 'tools' | 'admin' | 'production' | 'faq';

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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const tabs: Array<{ id: GuideTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: '1. Архитектура & Слои 0–4', icon: BookOpen },
    { id: 'labs', label: '2. 9 Визуальных лабораторий', icon: Layers },
    { id: 'tools', label: '3. Тренажер, AST & Пробелы', icon: Zap },
    { id: 'admin', label: '4. Админ-панель & AI', icon: Shield },
    { id: 'production', label: '5. Production & Docker', icon: Server },
    { id: 'faq', label: '6. Сценарии & Hotkeys', icon: HelpCircle },
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
                Полная техническая и методическая документация: архитектура графа, 9 лабораторий, AI и деплой
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

          {/* TAB 4: ADMIN PANEL & AI PROVIDERS */}
          {activeTab === 'admin' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    <span>Учетные данные администратора по умолчанию</span>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAdmin?.();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
                  >
                    Войти в админ-панель
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/40 p-3 rounded-xl border border-white/[0.08] font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Логин:</span>
                    <span className="text-emerald-300 font-bold select-all">admin</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Пароль:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-300 font-bold select-all">SETUP_ON_FIRST_LOGIN</span>
                      <button
                        onClick={() => copyToClipboard('SETUP_ON_FIRST_LOGIN', 'pwd')}
                        className="text-slate-400 hover:text-white"
                        title="Скопировать пароль"
                      >
                        {copiedKey === 'pwd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">
                  Администратор гарантированно инициализируется в базе данных PostgreSQL при первом запуске сервера.
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  Поддерживаемые AI-провайдеры
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white text-xs">OpenRouter</div>
                      <span className="text-[10px] text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-500/20">Единый API</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Доступ ко всем мировым моделям: Claude 3.5 Sonnet, GPT-4o, Llama 3.1 405B, Gemini 1.5 Pro по единому ключу.
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white text-xs">DeepSeek (V3 / R1)</div>
                      <span className="text-[10px] text-sky-300 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-500/20">Лучший для математики</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Высокая точность математических рассуждений при минимальной стоимости токенов. Родной эндпоинт <code className="text-sky-300">api.deepseek.com</code>.
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white text-xs">Яндекс AI (YandexGPT 4)</div>
                      <span className="text-[10px] text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/20">РФ Хостинг</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Поддержка Yandex Cloud API (API Key + Folder ID). Полная независимость от зарубежных шлюзов, высокая скорость по РФ.
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white text-xs">Google Gemini & OpenAI</div>
                      <span className="text-[10px] text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">Универсальные</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Поддержка прямого Gemini API (`gemini-1.5-pro/flash`) и любых OpenAI-совместимых шлюзов с кастомным base URL.
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-1.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>DataKey (Claude & GPT)</span>
                        <span className="text-[10px] text-indigo-300 bg-indigo-900/60 px-1.5 py-0.5 rounded border border-indigo-500/30">Оплата в рублях</span>
                      </div>
                      <span className="text-[10px] text-emerald-300 font-mono">https://ai.datakey.one/v1</span>
                    </div>
                    <div className="text-xs text-slate-300">
                      API-прокси для топовых моделей Claude (Opus 5, Sonnet 4.6/5, Haiku) и GPT (5.6, 5.4-mini). Совместим с OpenAI SDK (drop-in). Один ключ открывает доступ ко всем моделям с оплатой в рублях через СБП или банковские карты РФ. В админ-панели доступна автоматическая проверка баланса и покупка ключа в 1 клик.
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart Token Caching */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Database className="w-4 h-4" />
                  <span>Умное кэширование ответов (Smart Token Saving Cache)</span>
                </div>
                <h5 className="font-bold text-white text-sm">
                  Экономия до 95% токенов и ускорение ответов с 3000 мс до 10 мс
                </h5>
                <p className="text-xs text-slate-300">
                  Все математические промпты декомпозиции и генерации деревьев нормализуются (удаление лишних пробелов, 
                  регистронезависимость) и хешируются через SHA-256 в таблице базы данных <code className="text-emerald-300 font-mono">ai_response_cache</code>. 
                  Повторный запрос идентичной задачи отдается мгновенно из кэша с нулевым расходом токенов.
                </p>
                <div className="text-[11px] text-slate-400">
                  В админке доступна кнопка ручной очистки кэша и живой тест задержки (Ping Latency).
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PRODUCTION DEPLOYMENT */}
          {activeTab === 'production' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Развертывание в Production</h3>
                  <p className="text-xs text-slate-400">
                    Готовый стек: Node.js/Express + React/Vite + PostgreSQL 16 Alpine в Docker
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  Docker Compose v2
                </span>
              </div>

              {/* Architecture Schema */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
                <div className="text-xs font-bold text-slate-300">Сетевая топология контейнеров:</div>
                <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 space-y-1.5 border border-white/[0.05]">
                  <div className="text-indigo-400">Internet / Пользователи</div>
                  <div className="text-slate-500">  │ (Port 80 / 443 HTTPS через Nginx)</div>
                  <div className="text-emerald-400">  ▼</div>
                  <div className="text-emerald-400">mathroots-app (Port 3000)</div>
                  <div className="text-slate-400">  ├─ React SPA Client (Статика Vite)</div>
                  <div className="text-slate-400">  ├─ Express API (/api/health, /api/auth, /api/ai/...)</div>
                  <div className="text-slate-400">  └─ AI Dispatcher + SHA-256 Token Cache</div>
                  <div className="text-sky-400">  │ (Docker Internal Network: postgres:5432)</div>
                  <div className="text-sky-400">  ▼</div>
                  <div className="text-sky-400">mathroots-postgres (Host port 5433 -&gt; Container port 5432)</div>
                  <div className="text-slate-400">  └─ Docker Volume: postgres_data (Постоянные данные)</div>
                </div>
              </div>

              {/* Command Cheat-sheet */}
              <div className="space-y-3">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Команды для терминала сервера
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-950 border border-white/[0.08] flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400 mb-1">Сборка и запуск контейнеров в фоне:</div>
                      <code className="text-emerald-300 font-mono text-xs">docker compose up -d --build</code>
                    </div>
                    <button
                      onClick={() => copyToClipboard('docker compose up -d --build', 'cmd1')}
                      className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300"
                    >
                      {copiedKey === 'cmd1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-white/[0.08] flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400 mb-1">Проверка статуса и здоровья (Healthcheck):</div>
                      <code className="text-emerald-300 font-mono text-xs">docker compose ps</code>
                    </div>
                    <button
                      onClick={() => copyToClipboard('docker compose ps', 'cmd2')}
                      className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300"
                    >
                      {copiedKey === 'cmd2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-white/[0.08] flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400 mb-1">Просмотр логов в реальном времени:</div>
                      <code className="text-emerald-300 font-mono text-xs">docker compose logs -f app</code>
                    </div>
                    <button
                      onClick={() => copyToClipboard('docker compose logs -f app', 'cmd3')}
                      className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300"
                    >
                      {copiedKey === 'cmd3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-white/[0.08] flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400 mb-1">Создание резервной копии БД (Backup):</div>
                      <code className="text-emerald-300 font-mono text-xs">
                        docker compose exec postgres pg_dump -U postgres mathroots &gt; backup.sql
                      </code>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          'docker compose exec postgres pg_dump -U postgres mathroots > backup.sql',
                          'cmd4'
                        )
                      }
                      className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300"
                    >
                      {copiedKey === 'cmd4' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* SSL & Nginx note */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                <div className="font-bold text-white text-xs">Рекомендация для публичного домена:</div>
                <p className="text-xs text-slate-400">
                  Установите на хост Nginx с <code className="text-indigo-300">certbot --nginx</code> и проксируйте 
                  запросы на <code className="text-indigo-300">http://127.0.0.1:3000</code> с заголовками 
                  <code className="text-indigo-300 font-mono"> proxy_set_header X-Forwarded-For $remote_addr;</code>. 
                  Все cookie авторизации уже настроены для защищенного production-окружения.
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: SCENARIOS & HOTKEYS */}
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
