import React, { useState } from 'react';
import { MathTree, MathNode } from '../types';
import { MathFormula } from './MathFormula';
import {
  FileText,
  X,
  Copy,
  Check,
  Printer,
  Download,
  Sparkles,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  Lightbulb,
  Layers,
  ChevronDown
} from 'lucide-react';

interface TreeCheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  tree: MathTree;
  masteredIds: Set<string>;
  onNavigateToNode: (nodeId: string) => void;
}

export const TreeCheatSheetModal: React.FC<TreeCheatSheetModalProps> = ({
  isOpen,
  onClose,
  tree,
  masteredIds,
  onNavigateToNode,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<number | 'all'>('all');

  if (!isOpen) return null;

  // Group nodes by layer
  const layerTitles: Record<number, { title: string; desc: string; color: string }> = {
    0: {
      title: 'Слой 0: Фундамент и Аксиомы',
      desc: 'Неделимые основы арифметики и базовые понятия',
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    },
    1: {
      title: 'Слой 1: Элементарные законы',
      desc: 'Определения равенства, правила операций и тождества',
      color: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    },
    2: {
      title: 'Слой 2: Промежуточные свойства',
      desc: 'Свойства равенства, правила переноса и ассоциативность',
      color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10',
    },
    3: {
      title: 'Слой 3: Шаги преобразования',
      desc: 'Конкретные математические действия для упрощения задачи',
      color: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
    },
    4: {
      title: 'Слой 4: Финальный результат и цель',
      desc: 'Итоговый ответ, проверка корня и геометрический смысл',
      color: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    },
  };

  const layers = [0, 1, 2, 3, 4];

  const filteredNodes = tree.nodes
    .filter((n) => (selectedLayer === 'all' ? true : n.layer === selectedLayer))
    .sort((a, b) => a.layer - b.layer);

  // Generate clean Markdown text for copy
  const generateMarkdown = () => {
    let md = `# Конспект-шпаргалка: ${tree.title}\n\n`;
    md += `**Целевая формула:** $${tree.goalFormula}$\n`;
    md += `**Описание:** ${tree.description}\n\n`;
    md += `---\n\n`;

    layers.forEach((layerNum) => {
      const layerNodes = tree.nodes.filter((n) => n.layer === layerNum);
      if (layerNodes.length === 0) return;

      const layerMeta = layerTitles[layerNum] || { title: `Слой ${layerNum}`, desc: '' };
      md += `## ${layerMeta.title}\n*${layerMeta.desc}*\n\n`;

      layerNodes.forEach((n) => {
        md += `### ${n.title}\n`;
        md += `- **Формула:** $${n.formula}$\n`;
        md += `- **Суть:** ${n.explanationHuman}\n`;
        md += `- **Формальное правило:** ${n.formalRule}\n`;
        md += `- **Почему это законно:** ${n.whyCanIDoThis}\n`;
        if (n.requires && n.requires.length > 0) {
          const reqTitles = n.requires
            .map((rid) => tree.nodes.find((tn) => tn.id === rid)?.title || rid)
            .join(', ');
          md += `- **Опирается на:** ${reqTitles}\n`;
        }
        md += `\n`;
      });
    });

    return md;
  };

  const handleCopyMarkdown = () => {
    const text = generateMarkdown();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const text = generateMarkdown();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tree.title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}_конспект.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="tree-cheat-sheet-modal"
      className="fixed inset-0 z-50 bg-[#05060c]/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0b0e18] border border-white/[0.1] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between gap-4 shrink-0 bg-[#0d101c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 font-mono">
                  Конспект & Шпаргалка
                </span>
                <span className="text-[11px] text-slate-400 bg-white/[0.06] px-2 py-0.5 rounded-full border border-white/[0.08]">
                  {tree.nodes.length} концептов
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>{tree.title}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-copy-cheat-sheet-md"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14192b] hover:bg-[#1f2642] text-slate-200 hover:text-white border border-white/[0.1] text-xs font-semibold transition-all"
              title="Скопировать в формате Markdown с LaTeX формулами"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Скопировано!' : 'Копировать MD'}</span>
            </button>

            <button
              id="btn-download-cheat-sheet-md"
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14192b] hover:bg-[#1f2642] text-slate-200 hover:text-white border border-white/[0.1] text-xs font-semibold transition-all"
              title="Скачать конспект в виде файла .md"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Скачать .md</span>
            </button>

            <button
              id="btn-print-cheat-sheet"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
              title="Печать или сохранение в PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Печать / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs by Layer */}
        <div className="no-print px-6 py-2.5 bg-[#090b14] border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs">
          <span className="text-slate-500 font-bold mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            Слой:
          </span>
          <button
            onClick={() => setSelectedLayer('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              selectedLayer === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Все ({tree.nodes.length})
          </button>
          {layers.map((l) => {
            const count = tree.nodes.filter((n) => n.layer === l).length;
            if (count === 0) return null;
            return (
              <button
                key={l}
                onClick={() => setSelectedLayer(l)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  selectedLayer === l
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                Слой {l} ({count})
              </button>
            );
          })}
        </div>

        {/* Content Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200">
          {/* Goal Highlight Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-[#0d101c] to-purple-950/30 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                Главный результат
              </span>
              <div className="text-lg font-black text-white mt-0.5">
                <MathFormula math={tree.goalFormula} />
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                {tree.description}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-[#060810] px-3 py-2 rounded-xl border border-white/[0.08] shrink-0 text-xs">
              <span className="text-slate-400">Освоено:</span>
              <span className="font-bold text-emerald-400">
                {tree.nodes.filter((n) => masteredIds.has(n.id)).length} из {tree.nodes.length}
              </span>
            </div>
          </div>

          {/* Node Cards */}
          <div className="space-y-4">
            {filteredNodes.map((node) => {
              const isMastered = masteredIds.has(node.id);
              const layerInfo = layerTitles[node.layer] || {
                title: `Слой ${node.layer}`,
                desc: '',
                color: 'border-white/10 text-slate-300 bg-white/5',
              };

              return (
                <div
                  key={node.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isMastered
                      ? 'bg-[#0a0d18] border-emerald-500/25'
                      : 'bg-[#0c0f1d] border-white/[0.08]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${layerInfo.color}`}
                      >
                        Слой {node.layer}
                      </span>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{node.title}</span>
                        {node.subtitle && (
                          <span className="text-xs text-slate-400 font-normal">
                            ({node.subtitle})
                          </span>
                        )}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="px-2.5 py-1 bg-black/40 rounded-lg border border-white/[0.08] font-mono text-emerald-300 text-xs">
                        <MathFormula math={node.formula} />
                      </div>

                      <button
                        onClick={() => {
                          onNavigateToNode(node.id);
                          onClose();
                        }}
                        className="p-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs transition-colors"
                        title="Показать этот узел на графе знаний"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 text-xs">
                    {/* Explanation */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-indigo-400" />
                        Интуитивная суть:
                      </span>
                      <p className="text-slate-300 leading-relaxed">
                        {node.explanationHuman}
                      </p>
                    </div>

                    {/* Formal Rule */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        Формальное правило:
                      </span>
                      <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                        {node.formalRule}
                      </p>
                    </div>

                    {/* Why can I do this */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3 text-amber-400" />
                        Почему это законно:
                      </span>
                      <p className="text-amber-200/90 leading-relaxed">
                        {node.whyCanIDoThis}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
