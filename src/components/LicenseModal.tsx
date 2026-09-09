import React, { useState } from 'react';
import { useLicense, LicensePlan } from '../context/LicenseContext';
import {
  X,
  Sparkles,
  CheckCircle2,
  Crown,
  Key,
  ShieldCheck,
  Zap,
  Printer,
  FileSpreadsheet,
  BrainCircuit,
  GraduationCap,
  ExternalLink,
  Copy,
  Check,
  Flame,
  AlertCircle
} from 'lucide-react';

export const LicenseModal: React.FC = () => {
  const {
    isPro,
    plan,
    licenseKey,
    expiresAt,
    isUpgradeModalOpen,
    closeUpgradeModal,
    targetFeature,
    activateKey,
    removeLicense,
  } = useLicense();

  const [inputKey, setInputKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isUpgradeModalOpen) return null;

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      setErrorMessage('Пожалуйста, введите лицензионный ключ');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await activateKey(inputKey);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(res.message || 'Лицензия успешно активирована!');
      setInputKey('');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } else {
      setErrorMessage(res.error || 'Не удалось активировать ключ');
    }
  };

  const getPlanTitle = (p: LicensePlan) => {
    switch (p) {
      case 'pro_month':
        return 'PRO Месяц';
      case 'pro_year':
        return 'PRO Год';
      case 'pro_lifetime':
        return 'PRO Навсегда';
      case 'tutor_school':
        return 'Школа / Репетитор';
      default:
        return 'Базовый (Free)';
    }
  };

  const PRO_FEATURES = [
    {
      icon: Zap,
      title: 'Безлимитный AI-декомпозитор',
      desc: 'Разбор любых произвольных задач, уравнений и интегралов на корни без ограничений.',
    },
    {
      icon: Printer,
      title: 'Экспорт в PDF и чистая печать A4',
      desc: 'Готовые шпаргалки с KaTeX формулами, шагами и обоснованиями без лишнего интерфейса.',
    },
    {
      icon: GraduationCap,
      title: 'Полный интерактивный тренажёр',
      desc: 'Восхождение от аксиом Layer 0 до цели с мгновенной проверкой формул и подсказками.',
    },
    {
      icon: BrainCircuit,
      title: 'Карта когнитивных пробелов',
      desc: 'Глубокий анализ слабых мест и персональный план устранения пробелов в знаниях.',
    },
    {
      icon: FileSpreadsheet,
      title: 'Генератор вариантов и банк задач',
      desc: 'Процедурная генерация тренировочных примеров по каждому узлу и ветке решения.',
    },
    {
      icon: Sparkles,
      title: 'Продвинутые эталонные деревья',
      desc: 'Доступ ко всем вузовским темам: кратные интегралы, ряды, тензоры, комплексные числа.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#0b0e17] border border-indigo-500/30 rounded-3xl shadow-2xl shadow-indigo-950/60 overflow-hidden my-8">
        {/* Glow decoration */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative p-6 sm:p-8 border-b border-white/[0.08] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
              <Crown className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  MathRoots <span className="bg-gradient-to-r from-amber-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent">PRO Лицензия</span>
                </h2>
                {isPro && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                    АКТИВНА
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {targetFeature ? (
                  <span className="text-indigo-300 font-medium">
                    Функция «{targetFeature}» доступна в полной версии PRO.
                  </span>
                ) : (
                  'Получите неограниченный доступ ко всем возможностям математической платформы'
                )}
              </p>
            </div>
          </div>

          <button
            onClick={closeUpgradeModal}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-8 max-h-[75vh] overflow-y-auto">
          {/* Active License Status Banner (if user already PRO) */}
          {isPro && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>У вас активен тариф:</span>
                    <span className="text-emerald-300 font-extrabold">{getPlanTitle(plan)}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {expiresAt ? `Действует до: ${new Date(expiresAt).toLocaleDateString('ru-RU')}` : 'Бессрочный доступ (Lifetime)'}
                    {licenseKey && ` • Ключ: ${licenseKey}`}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={removeLicense}
                className="text-xs text-rose-400 hover:text-rose-300 hover:underline shrink-0"
              >
                Деактивировать на этом устройстве
              </button>
            </div>
          )}

          {/* Key Activation Form */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <form onSubmit={handleActivate} className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-indigo-400" />
                <span>У вас есть лицензионный ключ? Активируйте его здесь:</span>
              </label>

              <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                  placeholder="MR-PRO-XXXX-XXXX-XXXX"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#0f1422] border border-white/[0.12] focus:border-indigo-500 text-white font-mono text-sm tracking-wider uppercase placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !inputKey.trim()}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-sm shadow-lg shadow-indigo-950/50 transition-colors flex items-center justify-center gap-2 shrink-0"
                >
                  {isSubmitting ? (
                    <span>Проверка...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Активировать</span>
                    </>
                  )}
                </button>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}
            </form>
          </div>

          {/* Pricing Tiers */}
          <div>
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-white">Доступные тарифные планы</h3>
              <p className="text-xs text-slate-400 mt-1">
                Выберите подходящий период доступа и получите персональный ключ
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: PRO Month */}
              <div className="p-5 rounded-2xl bg-[#0e1220] border border-white/[0.08] flex flex-col justify-between hover:border-white/[0.2] transition-colors relative">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Интенсив
                  </div>
                  <div className="text-lg font-extrabold text-white mt-1">PRO Месяц</div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">490 ₽</span>
                    <span className="text-xs text-slate-400">/ 30 дней</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Идеально для быстрой подготовки к контрольной, зачету или сложному разделу.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-white/[0.06] text-xs text-slate-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Безлимитный AI разбор</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Печать шпаргалок A4</span>
                  </div>
                </div>
              </div>

              {/* Card 2: PRO Year (HIT) */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-indigo-950/60 to-[#0e1220] border-2 border-indigo-500/60 flex flex-col justify-between shadow-xl shadow-indigo-950/50 relative">
                <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 text-[10px] font-black text-white shadow-md flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-200" />
                  ХИТ • СКИДКА 60%
                </div>
                <div>
                  <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    Учебный год
                  </div>
                  <div className="text-lg font-extrabold text-white mt-1">PRO Год</div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">2 490 ₽</span>
                    <span className="text-xs text-slate-400">/ 365 дней</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Полный учебный год с неограниченными тренировками и анализом пробелов в знаниях.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-white/[0.06] text-xs text-slate-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="font-semibold text-white">Все возможности PRO</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Карта когнитивных пробелов</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Генератор вариантов задач</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Lifetime */}
              <div className="p-5 rounded-2xl bg-[#0e1220] border border-white/[0.08] flex flex-col justify-between hover:border-white/[0.2] transition-colors relative">
                <div>
                  <div className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                    Навсегда
                  </div>
                  <div className="text-lg font-extrabold text-white mt-1">PRO Lifetime</div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">4 990 ₽</span>
                    <span className="text-xs text-slate-400">разово</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Бессрочный доступ ко всем текущим функциям и всем будущим обновлениям платформы.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-white/[0.06] text-xs text-slate-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="font-semibold text-white">Вечный доступ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Приоритетная поддержка</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Что входит в полный пакет PRO:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {PRO_FEATURES.map((f, idx) => {
                const IconComponent = f.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{f.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {f.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Purchase / Contact Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-[#0e1220] border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-white">Как приобрести ключ?</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Оплата через СБП / Карту РФ / Telegram. Ключ генерируется моментально администратором.
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-bold border border-white/[0.1] transition-colors flex items-center gap-1.5"
              >
                <span>Купить через Telegram</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-white/[0.08] bg-[#080b12] flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Лицензия привязывается к ключу и сохраняется в вашем браузере
          </div>
          <button
            onClick={closeUpgradeModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
