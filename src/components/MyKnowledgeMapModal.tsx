import React, { useState, useEffect } from 'react';
import { MathTree } from '../types';
import { formatMastery, renderTeX } from '../utils/mathEngine';
import { api } from '../utils/apiClient';
import {
  Brain,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  BarChart3,
  Award,
  Filter,
  X,
  Target,
  TrendingUp,
  XCircle,
  Zap,
  Activity,
  Layers
} from 'lucide-react';

interface MyKnowledgeMapModalProps {
  isOpen: boolean;
  trees: MathTree[];
  masteredIds: Set<string>;
  weakIds: Set<string>;
  onClose: () => void;
  onNavigateToNode: (treeId: string, nodeId: string) => void;
}

export const MyKnowledgeMapModal: React.FC<MyKnowledgeMapModalProps> = ({
  isOpen,
  trees,
  masteredIds,
  weakIds,
  onClose,
  onNavigateToNode,
}) => {
  const [activeTab, setActiveTab] = useState<'concepts' | 'analytics'>('concepts');
  const [filterMode, setFilterMode] = useState<'all' | 'mastered' | 'gaps'>('all');
  const [workoutStats, setWorkoutStats] = useState<{
    totalAttempts: number;
    correctAttempts: number;
    accuracy: number;
    totalTimeSec: number;
    byCategory: Record<string, { total: number; correct: number; accuracy: number }>;
    recentAttempts: any[];
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoadingStats(true);
      api.fetchWorkoutStats()
        .then((stats) => {
          if (stats) setWorkoutStats(stats);
        })
        .finally(() => setLoadingStats(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Aggregate all nodes from trees
  const allNodesWithCategory = trees.flatMap((t) =>
    t.nodes.map((n) => {
      const isMastered = masteredIds.has(n.id);
      const isWeak = weakIds.has(n.id);
      const score = isMastered ? 0.95 : isWeak ? 0.15 : 0.45;
      return {
        ...n,
        treeId: t.id,
        treeTitle: t.title,
        treeCategory: t.category,
        score,
      };
    })
  );

  const filteredNodes = allNodesWithCategory.filter((n) => {
    if (filterMode === 'mastered') return n.score >= 0.75;
    if (filterMode === 'gaps') return n.score < 0.25;
    return true;
  });

  const totalMastered = allNodesWithCategory.filter((n) => n.score >= 0.75).length;
  const totalGaps = allNodesWithCategory.filter((n) => n.score < 0.25).length;
  const overallPercentage = Math.round((totalMastered / (allNodesWithCategory.length || 1)) * 100);

  const formatSeconds = (sec: number) => {
    if (!sec || sec < 60) return `${sec || 0} сек`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m} мин ${s > 0 ? `${s} с` : ''}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0e18] border border-white/[0.1] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.08] bg-[#0d101c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  Mastery Engine & Analytics
                </span>
              </div>
              <h2 className="text-lg font-black text-white">Мой профиль и карта знаний</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-[#060810] p-1 rounded-xl border border-white/[0.08]">
              <button
                onClick={() => setActiveTab('concepts')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'concepts'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Карта понятий</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Аналитика тренировок</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {activeTab === 'concepts' ? (
          <>
            {/* Global Progress Dashboard */}
            <div className="grid grid-cols-3 gap-3 p-5 border-b border-white/[0.08] bg-[#050507]">
              <div className="p-3.5 bg-[#0d101a] rounded-xl border border-white/[0.06]">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Освоено понятий</div>
                <div className="text-xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <span>{totalMastered}</span>
                  <span className="text-xs text-slate-500 font-normal">/ {allNodesWithCategory.length}</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#0d101a] rounded-xl border border-white/[0.06]">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Общий прогресс</div>
                <div className="text-xl font-bold text-indigo-400 mt-1">{overallPercentage}%</div>
              </div>

              <div className="p-3.5 bg-[#0d101a] rounded-xl border border-white/[0.06]">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Выявлено пробелов</div>
                <div className="text-xl font-bold text-rose-400 mt-1 flex items-center gap-1.5">
                  <span>{totalGaps}</span>
                  <span className="text-xs text-rose-400/60 font-normal">в цепочке</span>
                </div>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <span className="text-xs text-slate-400">Фильтрация концептов:</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    filterMode === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  Все ({allNodesWithCategory.length})
                </button>
                <button
                  onClick={() => setFilterMode('mastered')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    filterMode === 'mastered'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  Освоено ✓ ({totalMastered})
                </button>
                <button
                  onClick={() => setFilterMode('gaps')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    filterMode === 'gaps'
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  Пробелы ✕ ({totalGaps})
                </button>
              </div>
            </div>

            {/* Node List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-2">
              {filteredNodes.map((node) => {
                const mastery = formatMastery(node.score);
                return (
                  <div
                    key={`${node.treeId}-${node.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#070911] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border ${mastery.badgeClass}`}
                      >
                        {mastery.symbol}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{node.title}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-indigo-400">{node.formula}</span>
                          <span>•</span>
                          <span>{node.treeCategory}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${mastery.badgeClass}`}>
                        {mastery.statusText}
                      </span>

                      <button
                        onClick={() => {
                          onNavigateToNode(node.treeId, node.id);
                          onClose();
                        }}
                        className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-indigo-600 text-slate-400 hover:text-white transition-colors"
                        title="Перейти к узлу на графе"
                      >
                        <Target className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Analytics & Workout Dashboard View */
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Top KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-[#0d101c] border border-white/[0.08]">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Решено задач</span>
                </div>
                <div className="text-2xl font-black text-white mt-1">
                  {workoutStats?.totalAttempts || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Верно: {workoutStats?.correctAttempts || 0}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0d101c] border border-white/[0.08]">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Точность</span>
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {workoutStats?.accuracy || 0}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  по всем попыткам
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0d101c] border border-white/[0.08]">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Время в практике</span>
                </div>
                <div className="text-2xl font-black text-indigo-300 mt-1">
                  {formatSeconds(workoutStats?.totalTimeSec || 0)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  чистое решение
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0d101c] border border-white/[0.08]">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Пробелы в базе</span>
                </div>
                <div className="text-2xl font-black text-rose-400 mt-1">
                  {totalGaps}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  требуют повторения
                </div>
              </div>
            </div>

            {/* Category Accuracy Breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Точность по тематическим категориям</span>
              </h3>

              {workoutStats && Object.keys(workoutStats.byCategory).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(workoutStats.byCategory).map(([cat, info]: [string, any]) => (
                    <div
                      key={cat}
                      className="p-3.5 rounded-2xl bg-[#070911] border border-white/[0.06] space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white capitalize">{cat}</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {info.accuracy}% ({info.correct}/{info.total})
                        </span>
                      </div>
                      <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
                          style={{ width: `${info.accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-[#070911] border border-white/[0.06] text-center text-slate-400 text-xs">
                  Пока нет завершённых задач в тренажёре. Откройте «Тренажер задач» на панели управления для старта!
                </div>
              )}
            </div>

            {/* Recent Workout History Log */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Журнал последних попыток</span>
              </h3>

              {workoutStats && workoutStats.recentAttempts && workoutStats.recentAttempts.length > 0 ? (
                <div className="space-y-2">
                  {workoutStats.recentAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#070911] border border-white/[0.06] text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        {attempt.is_correct ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold text-white">
                            Задача {attempt.problem_id}
                          </span>
                          <span className="text-slate-500 ml-2">
                            ({attempt.category || 'общая'})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {attempt.time_spent_sec ? (
                          <span className="text-slate-400 font-mono text-[11px]">
                            {attempt.time_spent_sec} сек
                          </span>
                        ) : null}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            attempt.is_correct
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {attempt.is_correct ? 'Верно' : 'Ошибка'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#070911] border border-white/[0.06] text-center text-slate-500 text-xs">
                  История тренировок пуста.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
