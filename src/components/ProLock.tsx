import React from 'react';
import { useLicense } from '../context/LicenseContext';
import { Lock, Crown } from 'lucide-react';

interface ProLockProps {
  children: React.ReactNode;
  featureName?: string;
  className?: string;
  showOverlay?: boolean;
}

/**
 * Wraps UI elements that require a PRO license.
 * If user is Free: shows lock badge/overlay and opens LicenseModal on click.
 * If user is PRO: renders children normally.
 */
export const ProLock: React.FC<ProLockProps> = ({
  children,
  featureName = 'Премиум функция',
  className = '',
  showOverlay = false,
}) => {
  const { isPro, openUpgradeModal } = useLicense();

  if (isPro) {
    return <>{children}</>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    openUpgradeModal(featureName);
  };

  if (showOverlay) {
    return (
      <div className={`relative group ${className}`} onClick={handleClick}>
        <div className="opacity-40 pointer-events-none filter blur-[1px]">
          {children}
        </div>
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-xl border border-amber-500/30 cursor-pointer hover:bg-black/50 transition-all p-2 text-center">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-md shadow-amber-950/50 mb-1.5 group-hover:scale-110 transition-transform">
            <Lock className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-amber-200">
            {featureName} (PRO)
          </span>
          <span className="text-[9px] text-slate-300 mt-0.5">
            Нажмите, чтобы разблокировать
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`relative cursor-pointer group ${className}`}
      title={`${featureName} — Доступно в версии PRO`}
    >
      {children}
      <div className="absolute -top-1.5 -right-1.5 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-black text-[9px] shadow-md shadow-indigo-950/60 pointer-events-none group-hover:scale-110 transition-transform">
        <Lock className="w-2.5 h-2.5 text-amber-100" />
        <span>PRO</span>
      </div>
    </div>
  );
};

/**
 * Compact lock badge for buttons and tabs
 */
export const ProBadge: React.FC<{ featureName?: string; className?: string }> = ({
  featureName = 'PRO',
  className = '',
}) => {
  const { isPro, openUpgradeModal } = useLicense();

  if (isPro) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        openUpgradeModal(featureName);
      }}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-bold tracking-tight transition-colors shadow-sm ${className}`}
      title={`${featureName} — Требуется лицензия PRO`}
    >
      <Lock className="w-2.5 h-2.5" />
      <span>PRO</span>
    </button>
  );
};
