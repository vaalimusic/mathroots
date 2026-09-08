import React, { useState } from 'react';
import { X, Share2, Copy, Check, Globe, Link, Sparkles } from 'lucide-react';
import { MathTree } from '../types';
import { api } from '../utils/apiClient';

interface ShareTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tree: MathTree;
}

export const ShareTreeModal: React.FC<ShareTreeModalProps> = ({ isOpen, onClose, tree }) => {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerateShareLink = async () => {
    setIsGenerating(true);
    try {
      const res = await api.saveCustomTree(tree, true);
      const slug = res?.shareSlug || tree.id;
      const url = `${window.location.origin}/?shared=${slug}`;
      setShareUrl(url);
    } catch {
      const fallbackUrl = `${window.location.origin}/?shared=${tree.id}`;
      setShareUrl(fallbackUrl);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0c0f1d] border border-white/[0.1] rounded-3xl shadow-2xl p-6 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Поделиться деревом задачи</h3>
              <p className="text-xs text-slate-400">Для учеников, одноклассников и репетиторов</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1">
            <div className="text-xs text-slate-400 font-medium">Задача:</div>
            <div className="text-sm font-bold text-indigo-200 font-mono">{tree.title}</div>
            <div className="text-xs text-slate-400">{tree.category}</div>
          </div>

          {!shareUrl ? (
            <button
              type="button"
              onClick={handleGenerateShareLink}
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-950 transition-all flex items-center justify-center gap-2"
            >
              <Globe className="w-4 h-4" />
              <span>{isGenerating ? 'Создание ссылки...' : 'Создать публичную ссылку'}</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#131728] border border-white/[0.1]">
                <Link className="w-4 h-4 text-indigo-400 shrink-0" />
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="bg-transparent text-xs text-slate-200 w-full focus:outline-none font-mono selection:bg-indigo-600/50"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Скопировано!' : 'Копия'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                Любой пользователь по этой ссылке откроет интерактивное дерево, сможет исследовать корни и тренироваться.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
