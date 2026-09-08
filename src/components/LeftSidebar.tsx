import React from 'react';
import {
  Map,
  Sparkles,
  BookOpen,
  AlertTriangle,
  History,
  Wand2,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  GitFork,
  HelpCircle,
  Binary,
  Layers,
  Zap,
  FileText
} from 'lucide-react';

export type LeftNavSection =
  | 'my_map'
  | 'solve_problem'
  | 'syntax_guide'
  | 'explore_topic'
  | 'workout'
  | 'cheat_sheet'
  | 'visual_lab'
  | 'my_gaps'
  | 'history'
  | 'builder';

interface LeftSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeSection: LeftNavSection | null;
  onSelectSection: (section: LeftNavSection) => void;
  masteredPercent: number;
  gapCount: number;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  activeSection,
  onSelectSection,
  masteredPercent,
  gapCount,
  onOpenSettings,
  onOpenProfile,
}) => {
  const navItems: Array<{
    id: LeftNavSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }> = [
    {
      id: 'my_map',
      label: 'Моя карта',
      icon: Map,
      badge: `${masteredPercent}%`,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
    {
      id: 'solve_problem',
      label: 'Разобрать задачу',
      icon: Sparkles,
      badge: '2x+4=10',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    },
    {
      id: 'syntax_guide',
      label: 'Скобки и синтаксис',
      icon: HelpCircle,
      badge: '2(3)+10',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'workout',
      label: 'Тренажер & 100+ задач',
      icon: Zap,
      badge: '100+',
      badgeColor: 'bg-gradient-to-r from-amber-500/30 to-indigo-500/30 text-amber-300 border border-amber-500/40',
    },
    {
      id: 'cheat_sheet',
      label: 'Конспект & PDF',
      icon: FileText,
      badge: 'MD',
      badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    },
    {
      id: 'explore_topic',
      label: 'Изучить тему',
      icon: BookOpen,
    },
    {
      id: 'visual_lab',
      label: 'Визуальная лаборатория',
      icon: Layers,
      badge: '9 моделей',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    },
    {
      id: 'my_gaps',
      label: 'Мои пробелы',
      icon: AlertTriangle,
      badge: gapCount > 0 ? gapCount : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse',
    },
    {
      id: 'history',
      label: 'История',
      icon: History,
    },
    {
      id: 'builder',
      label: 'AI Декомпозиция & Конструктор',
      icon: Wand2,
      badge: 'AI ✨',
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    },
  ];

  return (
    <aside
      id="mathroots-left-sidebar"
      className={`h-full bg-[#080a12]/95 backdrop-blur-xl border-r border-white/[0.08] flex flex-col justify-between transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Nav List */}
      <div className="p-3 space-y-1.5">
        {/* Toggle Collapse Button */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-3 px-1`}>
          {!isCollapsed && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Навигация
            </span>
          )}
          <button
            id="btn-collapse-sidebar"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title={isCollapsed ? 'Развернуть меню' : 'Свернуть в иконки'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation items */}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-300'
                }`}
              />

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between text-left truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-white/10 text-slate-300'}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Tooltip on collapsed hover */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-md shadow-xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {item.label}
                  {item.badge && <span className="ml-1.5 text-indigo-300 font-bold">({item.badge})</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Section: Настройки & Профиль */}
      <div className="p-3 border-t border-white/[0.08] space-y-1">
        <button
          id="btn-settings-sidebar"
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-colors group relative"
          title={isCollapsed ? 'Настройки' : undefined}
        >
          <Settings className="w-4 h-4 shrink-0 group-hover:rotate-45 transition-transform text-slate-400 group-hover:text-slate-200" />
          {!isCollapsed && <span>Настройки</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-md shadow-xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              Настройки
            </div>
          )}
        </button>

        <button
          id="btn-profile-sidebar"
          onClick={onOpenProfile}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-colors group relative"
          title={isCollapsed ? 'Профиль' : undefined}
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
            <User className="w-3.5 h-3.5" />
          </div>
          {!isCollapsed && (
            <div className="text-left truncate">
              <div className="text-xs font-semibold text-slate-200 truncate">Исследователь</div>
              <div className="text-[10px] text-emerald-400 font-mono">Освоено {masteredPercent}%</div>
            </div>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-md shadow-xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              Профиль ({masteredPercent}%)
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
