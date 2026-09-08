import React, { useState, useEffect } from 'react';
import {
  X,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calculator,
  Layers,
  BookOpen,
  Eye,
  Check,
  RotateCcw
} from 'lucide-react';
import { renderTeX } from '../utils/mathEngine';
import { MathFormula } from './MathFormula';

interface MathSyntaxInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialExpression?: string;
  initialXValue?: number;
}

interface ExpressionPreset {
  id: string;
  label: string;
  expression: string;
  description: string;
  defaultX: number;
}

const PRESETS: ExpressionPreset[] = [
  {
    id: 'user_case',
    label: '2x + 10 (Вопрос пользователя)',
    expression: '2x + 10',
    description: 'Что делать с 3 в скобках при подстановке x = 3?',
    defaultX: 3,
  },
  {
    id: 'linear_canonical',
    label: '2x + 4 (Проверка уравнения)',
    expression: '2x + 4',
    description: 'Верификация корня x = 3 в уравнении 2x + 4 = 10',
    defaultX: 3,
  },
  {
    id: 'distributive',
    label: '2(x + 5) (Раскрытие скобок)',
    expression: '2(x + 5)',
    description: 'Умножение числа на сумму внутри скобок',
    defaultX: 4,
  },
  {
    id: 'negative_sub',
    label: '3x - 4 при x = -2 (Отрицательное число)',
    expression: '3x - 4',
    description: 'Защитные скобки при подстановке отрицательного x = -2',
    defaultX: -2,
  },
  {
    id: 'quadratic_sub',
    label: 'x² - 5x + 6 (Квадратное уравнение)',
    expression: 'x^2 - 5x + 6',
    description: 'Проверка корня x = 2: скобки для степени и умножения',
    defaultX: 2,
  },
];

interface QuizQuestion {
  id: number;
  question: string;
  formula: string;
  options: { label: string; isCorrect: boolean; explanation: string }[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'Что означает запись 2(3) в выражении 2(3) + 10?',
    formula: '2(3) + 10 = ?',
    options: [
      {
        label: 'Число 23 (цифры 2 и 3 слиплись)',
        isCorrect: false,
        explanation: 'Неверно! В математике цифры никогда не склеиваются. Скобка вплотную к числу означает операцию умножения: 2 · 3 = 6.',
      },
      {
        label: 'Сложение: 2 + 3 = 5',
        isCorrect: false,
        explanation: 'Неверно! Между 2 и скобкой нет знака плюс (+). Неявное умножение связывает 2 и (3).',
      },
      {
        label: 'Умножение: 2 · 3 = 6, затем 6 + 10 = 16',
        isCorrect: true,
        explanation: 'Идеально верно! Скобка вплотную к числу без знака — это неявное умножение: 2 · (3) = 6. Затем прибавляем 10 и получаем 16.',
      },
      {
        label: 'Выражение 2x(3), где x еще нужно найти',
        isCorrect: false,
        explanation: 'Неверно! При подстановке буква x полностью исчезает со сцены, её заменяет число 3 в скобках.',
      },
    ],
  },
  {
    id: 2,
    question: 'Почему при подстановке x = 3 в выражение 2x + 10 НЕЛЬЗЯ писать 2x(3) + 10?',
    formula: '2x + 10 \\xrightarrow{x = 3} ?',
    options: [
      {
        label: 'Потому что буква x уже заменена числом 3 и больше не существует в формуле',
        isCorrect: true,
        explanation: 'В точку! Переменная x — это закрытая коробка. Когда мы открываем её и кладем 3, сам ярлык x исчезает: 2 · (3) + 10. Если написать 2x(3), получится 2 · x · 3 = 6x!',
      },
      {
        label: 'Потому что так запретил калькулятор',
        isCorrect: false,
        explanation: 'Дело в математическом смысле: x — это неизвестное, если вы его нашли (3), незачем повторять букву x снова.',
      },
      {
        label: 'Потому что скобки разрешены только для отрицательных чисел',
        isCorrect: false,
        explanation: 'Скобки ставятся для любых подставляемых чисел, чтобы отделить множители друг от друга.',
      },
    ],
  },
  {
    id: 3,
    question: 'Чему равно 2(-4) + 5?',
    formula: '2(-4) + 5 = ?',
    options: [
      {
        label: '2 - 4 + 5 = 3',
        isCorrect: false,
        explanation: 'Опасная ловушка! Запись 2(-4) — это УМНОЖЕНИЕ 2 на (-4), а не вычитание: 2 · (-4) = -8.',
      },
      {
        label: '-8 + 5 = -3',
        isCorrect: true,
        explanation: 'Блестяще! Сначала выполняем умножение 2 · (-4) = -8, затем складываем -8 + 5 = -3.',
      },
      {
        label: '-3',
        isCorrect: true,
        explanation: 'Верно! 2 · (-4) + 5 = -8 + 5 = -3.',
      },
    ],
  },
  {
    id: 4,
    question: 'В чем разница между 2(3) и 2(x + 3)?',
    formula: '2(3) \\quad \\text{vs} \\quad 2(x + 3)',
    options: [
      {
        label: 'Никакой разницы нет',
        isCorrect: false,
        explanation: 'Разница огромна! В первом случае внутри уже конкретное число, во втором — алгебраическая сумма.',
      },
      {
        label: '2(3) = 6 (число умножается на число), а в 2(x + 3) нужно раскрыть скобки: 2x + 6',
        isCorrect: true,
        explanation: 'Абсолютно точно! В 2(3) внутри скобок число 3, умножаем сразу: 2 · 3 = 6. В 2(x + 3) работает дистрибутивный закон: умножаем 2 и на x, и на 3.',
      },
    ],
  },
];

export const MathSyntaxInspectorModal: React.FC<MathSyntaxInspectorModalProps> = ({
  isOpen,
  onClose,
  initialExpression,
  initialXValue = 3,
}) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'rules' | 'quiz'>('simulator');
  const [selectedPreset, setSelectedPreset] = useState<string>('user_case');
  const [xVal, setXVal] = useState<number>(initialXValue);
  const [subStep, setSubStep] = useState<number>(3); // 0..4

  useEffect(() => {
    if (isOpen) {
      if (initialXValue !== undefined) {
        setXVal(initialXValue);
      }
      if (initialExpression) {
        const clean = initialExpression.replace(/\s+/g, '');
        if (clean.includes('2x+4')) {
          setSelectedPreset('linear_canonical');
        } else if (clean.includes('x^2') || clean.includes('x²') || clean.includes('5x')) {
          setSelectedPreset('quadratic_sub');
        } else if (clean.includes('x+5') || clean.includes('(x+')) {
          setSelectedPreset('distributive');
        } else if (clean.includes('3x-4') || (initialXValue !== undefined && initialXValue < 0)) {
          setSelectedPreset('negative_sub');
        } else {
          setSelectedPreset('user_case');
        }
      }
      setSubStep(3);
    }
  }, [isOpen, initialExpression, initialXValue]);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  if (!isOpen) return null;

  const currentPreset = PRESETS.find((p) => p.id === selectedPreset) || PRESETS[0];

  // Step breakdown calculation based on selected preset and xVal
  const calculateSteps = () => {
    switch (currentPreset.id) {
      case 'user_case': {
        // 2x + 10
        const mult = 2 * xVal;
        const total = mult + 10;
        return [
          {
            stepNum: 1,
            title: 'Исходное алгебраическое выражение',
            tex: '2x + 10',
            label: 'Буква x обозначает неизвестное или входное значение',
            note: 'Обратите внимание: между 2 и x нет знака, но там скрыто умножение: 2 · x',
            highlight: '2x',
          },
          {
            stepNum: 2,
            title: 'Проявляем скрытый знак умножения',
            tex: '2 \\cdot x + 10',
            label: 'Математики опускают точку умножения перед буквами, чтобы не путать её с x',
            note: 'Запись 2x строго означает «взять x два раза»: x + x',
            highlight: '2 \\cdot x',
          },
          {
            stepNum: 3,
            title: 'Подстановка: заменяем x на число ' + xVal,
            tex: `2 \\cdot (${xVal}) + 10`,
            subTex: `2(${xVal}) + 10`,
            label: 'Куда делась буква x? Она полностью исчезла, её место заняла скобка (' + xVal + ')!',
            note: '⚠️ НЕЛЬЗЯ писать 2x(' + xVal + ')! Буква x уже выполнила свою роль и уступила место числу.',
            highlight: `(${xVal})`,
            isCritical: true,
          },
          {
            stepNum: 4,
            title: 'Что делать со скобками? Умножаем 2 на ' + xVal + '!',
            tex: `${mult} + 10`,
            label: `Скобка вплотную к числу — это умножение: 2 · (${xVal}) = ${mult}`,
            note: `Это не число 2${xVal} и не 2 + ${xVal}, а строго произведение: 2 × ${xVal} = ${mult}!`,
            highlight: `${mult}`,
            isCritical: true,
          },
          {
            stepNum: 5,
            title: 'Финальное сложение',
            tex: `${mult} + 10 = ${total}`,
            label: `Складываем результат умножения с 10: результат равен ${total}`,
            note: 'Порядок операций: сначала умножение 2(3) = 6, затем сложение 6 + 10 = 16.',
            highlight: `${total}`,
          },
        ];
      }
      case 'linear_canonical': {
        // 2x + 4
        const mult = 2 * xVal;
        const total = mult + 4;
        return [
          {
            stepNum: 1,
            title: 'Левая часть уравнения',
            tex: '2x + 4 = 10',
            label: 'Нам нужно проверить корень x = 3',
            note: 'Две коробки x плюс 4 гири должны уравновесить 10 гирь.',
            highlight: '2x',
          },
          {
            stepNum: 2,
            title: 'Проявляем скрытое умножение',
            tex: '2 \\cdot x + 4 = 10',
            label: 'Коэффициент 2 умножается на неизвестное x',
            note: '2 · x — это умножение.',
            highlight: '2 \\cdot x',
          },
          {
            stepNum: 3,
            title: 'Подстановка найденного корня x = ' + xVal,
            tex: `2 \\cdot (${xVal}) + 4 = 10`,
            subTex: `2(${xVal}) + 4 = 10`,
            label: 'Буква x заменена на (' + xVal + ') в защитных скобках',
            note: 'Скобки защищают число от слияния с двойкой (чтобы не получилось 23!).',
            highlight: `(${xVal})`,
            isCritical: true,
          },
          {
            stepNum: 4,
            title: 'Раскрываем умножение 2 · (' + xVal + ')',
            tex: `${mult} + 4 = 10`,
            label: `2 умножить на ${xVal} дает ${mult}`,
            note: 'Скобки выполнили свою задачу и исчезают, оставляя результат умножения 6.',
            highlight: `${mult}`,
            isCritical: true,
          },
          {
            stepNum: 5,
            title: 'Тождество подтверждено!',
            tex: `${total} = 10 \\quad \\checkmark`,
            label: '10 = 10 — обе чаши весов находятся в абсолютном балансе!',
            note: 'Корень x = 3 математически доказан и верен.',
            highlight: `${total} = 10`,
          },
        ];
      }
      case 'distributive': {
        // 2(x + 5)
        const inside = xVal + 5;
        const total = 2 * inside;
        return [
          {
            stepNum: 1,
            title: 'Выражение со скобками: число перед суммой',
            tex: '2(x + 5)',
            label: 'Двойка стоит вплотную перед скобкой с выражением (x + 5)',
            note: 'Это не одно число в скобках, а целая сумма: здесь работает распределительный закон!',
            highlight: '2(x + 5)',
          },
          {
            stepNum: 2,
            title: 'Способ А: Раскрытие скобок (дистрибутивность)',
            tex: '2 \\cdot x + 2 \\cdot 5 = 2x + 10',
            label: 'Умножаем двойку снаружи на КАЖДОЕ слагаемое внутри скобок',
            note: '2 умножить на x = 2x, и 2 умножить на 5 = 10.',
            highlight: '2x + 10',
          },
          {
            stepNum: 3,
            title: 'Способ Б: Вычисление внутри скобок при x = ' + xVal,
            tex: `2(${xVal} + 5) = 2(${inside})`,
            label: 'Сначала считаем выражение внутри скобок: ' + xVal + ' + 5 = ' + inside,
            note: 'Приоритет операций: то, что в скобках, считается первым!',
            highlight: `(${inside})`,
            isCritical: true,
          },
          {
            stepNum: 4,
            title: 'Умножение числа снаружи на результат скобок',
            tex: `2 \\cdot (${inside}) = ${total}`,
            label: `Что делать со скобками теперь? 2 умножить на ${inside} = ${total}`,
            note: `Число вплотную к скобке — это всегда умножение: 2 × ${inside} = ${total}.`,
            highlight: `${total}`,
            isCritical: true,
          },
          {
            stepNum: 5,
            title: 'Оба способа дают один результат!',
            tex: `2(${xVal} + 5) = 2x + 10 = ${total}`,
            label: 'Математическая гармония: раскрывать скобки или считать внутри — ответ идентичен!',
            note: 'Сравни: 2(9) = 18 и 2(4) + 10 = 8 + 10 = 18.',
            highlight: `${total}`,
          },
        ];
      }
      case 'negative_sub': {
        // 3x - 4 at x = -2
        const mult = 3 * xVal;
        const total = mult - 4;
        return [
          {
            stepNum: 1,
            title: 'Выражение с неизвестным x',
            tex: '3x - 4',
            label: 'Требуется подставить отрицательное число x = -2',
            note: 'Отрицательные числа требуют предельного внимания к скобкам!',
            highlight: '3x',
          },
          {
            stepNum: 2,
            title: 'Проявляем скрытое умножение',
            tex: '3 \\cdot x - 4',
            label: '3 умножается на значение x',
            note: 'Между тройкой и x скрыта точка умножения.',
            highlight: '3 \\cdot x',
          },
          {
            stepNum: 3,
            title: 'Защитные скобки для отрицательного числа!',
            tex: `3 \\cdot (${xVal}) - 4`,
            subTex: `3(${xVal}) - 4`,
            label: `Обязательно оборачиваем отрицательное число в скобки: (${xVal})`,
            note: `⚠️ ЕСЛИ НЕ ПОСТАВИТЬ СКОБКИ: запись 3-2-4 превратилась бы в вычитание! Скобки спасают знак умножения.`,
            highlight: `(${xVal})`,
            isCritical: true,
          },
          {
            stepNum: 4,
            title: 'Умножение положительного на отрицательное: 3 · (-2) = -6',
            tex: `${mult} - 4`,
            label: 'Плюс на минус дает минус: 3 × (-2) = -6',
            note: 'Что делать со скобками? Умножаем 3 на -2, получаем -6.',
            highlight: `${mult}`,
            isCritical: true,
          },
          {
            stepNum: 5,
            title: 'Вычитание отрицательных чисел',
            tex: `${mult} - 4 = ${total}`,
            label: 'Долг 6 рублей и ещё долг 4 рубля дают суммарный долг 10 рублей',
            note: `-6 - 4 = -10. Итоговый ответ: ${total}.`,
            highlight: `${total}`,
          },
        ];
      }
      default: {
        // quadratic x^2 - 5x + 6
        const xSq = xVal * xVal;
        const mult5 = 5 * xVal;
        const total = xSq - mult5 + 6;
        return [
          {
            stepNum: 1,
            title: 'Квадратный трехчлен: x² - 5x + 6',
            tex: 'x^2 - 5x + 6 = 0',
            label: 'Проверяем корень x = ' + xVal,
            note: 'Здесь x встречается дважды: во 2-й степени и с коэффициентом -5.',
            highlight: 'x^2 - 5x',
          },
          {
            stepNum: 2,
            title: 'Проявляем операции: степень и умножение',
            tex: '(x)^2 - 5 \\cdot (x) + 6',
            label: 'Каждое вхождение x мысленно оборачиваем в скобки',
            note: 'Это защищает степени и знаки при подстановке.',
            highlight: '(x)',
          },
          {
            stepNum: 3,
            title: 'Подставляем x = ' + xVal + ' в скобки',
            tex: `(${xVal})^2 - 5 \\cdot (${xVal}) + 6`,
            subTex: `(${xVal})^2 - 5(${xVal}) + 6`,
            label: 'Буквы x исчезли! На их местах стоят защитные скобки (' + xVal + ')',
            note: 'Запись 5(' + xVal + ') — это не 52 и не 5x(' + xVal + '), а 5 умножить на ' + xVal + '!',
            highlight: `(${xVal})`,
            isCritical: true,
          },
          {
            stepNum: 4,
            title: 'Вычисляем степени и умножение: ' + xSq + ' - ' + mult5 + ' + 6',
            tex: `${xSq} - ${mult5} + 6`,
            label: `Степень: (${xVal})² = ${xSq}. Умножение: 5 · (${xVal}) = ${mult5}.`,
            note: 'Приоритет: сначала возведение в степень и умножение, затем сложение и вычитание.',
            highlight: `${xSq} - ${mult5}`,
            isCritical: true,
          },
          {
            stepNum: 5,
            title: 'Итоговая проверка нуля: ' + total + ' = 0',
            tex: `${total} = 0 \\quad ${total === 0 ? '\\checkmark' : '\\times'}`,
            label: total === 0 ? 'Корень подтвержден! 0 = 0' : `Не равно 0 (${total} ≠ 0)`,
            note: total === 0 ? `Значение x = ${xVal} действительно обращает выражение в ноль.` : 'Попробуйте x = 2 или x = 3.',
            highlight: `${total} = 0`,
          },
        ];
      }
    }
  };

  const steps = calculateSteps();
  const currentStep = steps[Math.min(subStep, steps.length - 1)];

  const curQuiz = QUIZ_QUESTIONS[quizIndex];

  const handleQuizAnswer = (optionIdx: number) => {
    if (hasAnswered) return;
    setSelectedAnswer(optionIdx);
    setHasAnswered(true);
    if (curQuiz.options[optionIdx].isCorrect) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const nextQuizQuestion = () => {
    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
    }
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setQuizScore(0);
  };

  return (
    <div
      id="math-syntax-inspector-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0c0f1a] border border-white/[0.12] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#111626]/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center shadow-inner">
              <Calculator className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Анатомия скобок и неявного умножения
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Что значит 2(3)?
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Подробный разбор: почему пишут <span className="font-mono text-indigo-300 font-semibold">2(3) + 10</span>, куда исчезает буква <span className="font-mono text-emerald-300 font-semibold">x</span> и почему нельзя писать <span className="font-mono text-rose-300 font-semibold">2x(3)</span>
              </p>
            </div>
          </div>

          <button
            id="btn-close-syntax-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-white/[0.06] bg-[#0e1220]">
          <button
            id="tab-syntax-simulator"
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'simulator'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-300" />
            <span>Интерактивный симулятор подстановки</span>
          </button>

          <button
            id="tab-syntax-rules"
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'rules'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-300" />
            <span>5 правил: что делать со скобками</span>
          </button>

          <button
            id="tab-syntax-quiz"
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'quiz'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Проверь себя (Квиз)</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: INTERACTIVE SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-6">
              {/* Preset Selector */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Выберите выражение для наглядного разбора:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPreset(p.id);
                        setXVal(p.defaultX);
                        setSubStep(2); // Jump straight to substitution step
                      }}
                      className={`p-3 rounded-2xl text-left border transition-all flex flex-col gap-1 ${
                        selectedPreset === p.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-[#121626] border-white/[0.06] text-slate-300 hover:border-white/[0.15] hover:bg-[#181e32]'
                      }`}
                    >
                      <div className="text-xs font-bold text-indigo-300 font-mono">
                        {p.expression}
                      </div>
                      <div className="text-[11px] font-semibold text-white truncate">
                        {p.label}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">
                        {p.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* x-Value Selector Slider / Chips */}
              <div className="p-4 bg-[#121626] rounded-2xl border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-300">Значение переменной:</span>
                  <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-mono text-base font-extrabold rounded-xl border border-indigo-500/30">
                    x = {xVal}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Быстрый выбор:</span>
                  {[-3, -2, 0, 1, 2, 3, 5, 10].map((v) => (
                    <button
                      key={v}
                      onClick={() => setXVal(v)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                        xVal === v
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step Progression Visualizer */}
              <div className="p-6 bg-[#080a12] rounded-3xl border border-white/[0.08] relative overflow-hidden shadow-2xl space-y-6">
                {/* Step indicator pills */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 border-b border-white/[0.06]">
                  {steps.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSubStep(idx)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        idx === subStep
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 ring-1 ring-indigo-400'
                          : idx < subStep
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-white/20">
                        {idx + 1}
                      </span>
                      <span>{s.title.split(':')[0]}</span>
                    </button>
                  ))}
                </div>

                {/* Big Formula Showcase Box */}
                <div className="text-center py-6 px-4 bg-[#0e1324] rounded-2xl border border-white/[0.1] shadow-inner relative">
                  <div className="text-[11px] uppercase tracking-widest text-indigo-400 font-bold mb-3">
                    Шаг {subStep + 1} из {steps.length}: {currentStep.title}
                  </div>

                  {/* Main TeX Display */}
                  <div
                    className="text-3xl sm:text-4xl font-serif text-white py-2 overflow-x-auto tracking-wider"
                    dangerouslySetInnerHTML={{ __html: renderTeX(currentStep.tex, true) }}
                  />

                  {currentStep.subTex && (
                    <div className="mt-2 text-sm text-slate-400 flex items-center justify-center gap-2">
                      <span>Или в компактной записи без точки:</span>
                      <span
                        className="font-mono text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                        dangerouslySetInnerHTML={{ __html: renderTeX(currentStep.subTex) }}
                      />
                    </div>
                  )}

                  {/* Highlight callout */}
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-200 text-xs font-medium border border-indigo-500/30">
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Фокус шага: </span>
                    <span className="font-mono font-bold text-white">{currentStep.highlight}</span>
                  </div>
                </div>

                {/* Detailed Narrative Explanation */}
                <div className="p-5 rounded-2xl bg-[#121626] border border-white/[0.08] space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                      <HelpCircle className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {currentStep.label}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">
                        {currentStep.note}
                      </p>
                    </div>
                  </div>

                  {/* Clarification Alert if critical step (e.g. substitution or parentheses resolution) */}
                  {currentStep.isCritical && (
                    <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-200 leading-relaxed">
                        <span className="font-bold text-white">Золотое правило скобок: </span>
                        Когда число стоит вплотную перед скобкой без знака — как в <span className="font-mono font-bold text-white">2(3)</span>, это ВСЕГДА УМНОЖЕНИЕ! Не двадцать три (23) и не два плюс три (5), а строго <span className="font-mono font-bold text-white">2 × 3 = 6</span>.
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons for Steps */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setSubStep((prev) => Math.max(0, prev - 1))}
                    disabled={subStep === 0}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white"
                  >
                    ← Назад
                  </button>

                  <div className="flex items-center gap-1.5">
                    {steps.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === subStep ? 'w-6 bg-indigo-500' : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setSubStep((prev) => Math.min(steps.length - 1, prev + 1))}
                    disabled={subStep === steps.length - 1}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                  >
                    <span>Следующий шаг</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FIVE RULES FOR PARENTHESES */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed">
                В математике скобки <span className="font-mono font-bold text-white">( )</span> выполняют три разные задачи:
                1) защитная капсула для подставляемого числа;
                2) знак неявного умножения;
                3) повышение приоритета операций. Ниже 5 главных ситуаций:
              </div>

              {/* Rule Card 1 */}
              <div className="p-5 rounded-2xl bg-[#121626] border border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Правило 1: Что делать с тройкой в 2(3) + 10?
                  </span>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                    2(3) = 2 · 3 = 6
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Когда между числом и скобкой нет знака плюс (+) или минус (-), там стоит <strong className="text-white">неявный знак умножения</strong>.
                  <br />
                  Поэтому <span className="font-mono text-emerald-300 font-bold">2(3) + 10</span> означает:
                </p>
                <div className="p-3 bg-[#090c16] rounded-xl border border-white/[0.06] font-mono text-xs text-emerald-300 space-y-1">
                  <div>1. Раскрываем умножение: 2 · 3 = 6</div>
                  <div>2. Прибавляем 10: 6 + 10 = 16</div>
                  <div>Итог: 16 (не 23, не 5, не 28!)</div>
                </div>
              </div>

              {/* Rule Card 2 */}
              <div className="p-5 rounded-2xl bg-[#121626] border border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    Правило 2: Почему нельзя писать 2x(3)? Куда делся x?
                  </span>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold">
                    2x → 2(3), НЕ 2x(3)
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Буква <span className="font-mono text-emerald-300">x</span> — это просто «пустой контейнер» под число.
                  Когда вы узнали, что <span className="font-mono text-white">x = 3</span>, вы вынимаете букву <span className="font-mono text-emerald-300">x</span> и ставите на её место число <span className="font-mono text-white">(3)</span>.
                </p>
                <div className="p-3 bg-[#090c16] rounded-xl border border-white/[0.06] text-xs text-slate-300 space-y-1">
                  <div className="text-rose-300 font-mono font-bold">
                    ❌ Ошибка: 2x(3) + 10  →  означает 2 · x · 3 + 10 = 6x + 10 (буква x осталась!)
                  </div>
                  <div className="text-emerald-300 font-mono font-bold">
                    ✓ Верно: 2 · (3) + 10  →  буквы x больше нет, только числа: 6 + 10 = 16
                  </div>
                </div>
              </div>

              {/* Rule Card 3 */}
              <div className="p-5 rounded-2xl bg-[#121626] border border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Правило 3: Зачем скобки для отрицательных чисел?
                  </span>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-bold">
                    2(-3) = -6
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Если подставить <span className="font-mono text-white">x = -3</span> в выражение <span className="font-mono text-white">2x</span>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                    <div>Без скобок: 2 - 3 = -1</div>
                    <div className="text-[10px] text-rose-400 mt-1">Знак умножения потерялся и превратился в вычитание! Грубейшая ошибка.</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                    <div>Со скобками: 2 · (-3) = -6</div>
                    <div className="text-[10px] text-emerald-400 mt-1">Скобки защищают знак минус и сохраняют операцию умножения.</div>
                  </div>
                </div>
              </div>

              {/* Rule Card 4 */}
              <div className="p-5 rounded-2xl bg-[#121626] border border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    Правило 4: 2(3) против 2(x + 3) (Число vs Выражение)
                  </span>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
                    Дистрибутивность
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-300">
                  <div>
                    • В <span className="font-mono text-indigo-300 font-bold">2(3)</span> внутри скобок одно число. Здесь нечего раскрывать — просто перемножаем: <span className="font-mono text-white font-bold">2 × 3 = 6</span>.
                  </div>
                  <div>
                    • В <span className="font-mono text-indigo-300 font-bold">2(x + 3)</span> внутри скобок сумма. Множитель 2 умножается на КАЖДОГО жителя скобок:
                    <span className="font-mono text-emerald-300 font-bold ml-1">2 · x + 2 · 3 = 2x + 6</span>.
                  </div>
                </div>
              </div>

              {/* Rule Card 5 */}
              <div className="p-5 rounded-2xl bg-[#121626] border border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                    Правило 5: Приоритет операций (BODMAS / PEMDAS)
                  </span>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold">
                    1. Скобки → 2. Степени → 3. Умножение → 4. Сложение
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  В выражении <span className="font-mono text-white font-bold">2(3) + 10</span>:
                  <br />
                  Сначала выполняется действие <strong className="text-white">умножения 2 на 3</strong> (получаем 6), и только ПОТОМ сложение с 10: <span className="font-mono text-emerald-300 font-bold">6 + 10 = 16</span>.
                  Нельзя сначала прибавить 3 к 10 (получив 13) и умножить на 2 (получив 26)!
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: QUIZ */}
          {activeTab === 'quiz' && (
            <div className="p-6 bg-[#080a12] rounded-3xl border border-white/[0.08] space-y-6">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Вопрос {quizIndex + 1} из {QUIZ_QUESTIONS.length}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                    Счет: {quizScore}
                  </span>
                </div>
                <button
                  onClick={resetQuiz}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Начать заново</span>
                </button>
              </div>

              {/* Question Box */}
              <div>
                <h3 className="text-base font-bold text-white mb-2">
                  {curQuiz.question}
                </h3>
                <div
                  className="text-2xl font-serif text-indigo-300 my-3 text-center py-3 bg-[#0e1324] rounded-xl border border-white/[0.06]"
                  dangerouslySetInnerHTML={{ __html: renderTeX(curQuiz.formula, true) }}
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                {curQuiz.options.map((opt, idx) => {
                  const isSelected = selectedAnswer === idx;
                  let btnStyle = 'bg-[#121626] border-white/[0.08] text-slate-200 hover:bg-[#181e32] hover:border-white/[0.15]';

                  if (hasAnswered) {
                    if (opt.isCorrect) {
                      btnStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-bold ring-1 ring-emerald-400';
                    } else if (isSelected && !opt.isCorrect) {
                      btnStyle = 'bg-rose-950/70 border-rose-500 text-rose-200 font-bold ring-1 ring-rose-400';
                    } else {
                      btnStyle = 'opacity-40 bg-[#0d101a] border-white/[0.04] text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuizAnswer(idx)}
                      disabled={hasAnswered}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center font-mono font-bold shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt.label}</span>
                      </div>
                      {hasAnswered && opt.isCorrect && (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {hasAnswered && isSelected && !opt.isCorrect && (
                        <X className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback Explanation */}
              {hasAnswered && (
                <div
                  className={`p-4 rounded-2xl border text-xs leading-relaxed animate-in fade-in duration-200 ${
                    curQuiz.options[selectedAnswer!].isCorrect
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  }`}
                >
                  <div className="font-bold text-white mb-1 flex items-center gap-2">
                    {curQuiz.options[selectedAnswer!].isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Верно!</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>Разбор ошибки:</span>
                      </>
                    )}
                  </div>
                  <p>{curQuiz.options[selectedAnswer!].explanation}</p>
                </div>
              )}

              {/* Next Question Button */}
              {hasAnswered && (
                <div className="flex justify-end pt-2">
                  {quizIndex < QUIZ_QUESTIONS.length - 1 ? (
                    <button
                      onClick={nextQuizQuestion}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                    >
                      <span>Следующий вопрос</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-300 font-semibold">
                        Тест завершен! Итог: {quizScore} из {QUIZ_QUESTIONS.length}
                      </span>
                      <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Понятно, закрыть</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.08] bg-[#090b14] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Инструмент первопринципной ясности MathRoots</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-semibold transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
