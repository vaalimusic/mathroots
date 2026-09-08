import katex from 'katex';
import { MathNode, ASTNode } from '../types';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Prepares LaTeX string containing Cyrillic text and natural language
 * so that KaTeX does not strip spaces between words in math mode.
 */
export function prepareTeXWithCyrillic(tex: string): string {
  if (!tex || typeof tex !== 'string') return '';

  // Standardize common Unicode math symbols and dashes for clean KaTeX rendering
  let clean = tex
    .replace(/—/g, ' \\text{ — } ')
    .replace(/–/g, ' \\text{ – } ')
    .replace(/✔/g, ' \\text{✓} ')
    .replace(/⇔/g, ' \\iff ')
    .replace(/⇒/g, ' \\implies ')
    .replace(/→/g, ' \\to ')
    .replace(/⟷/g, ' \\longleftrightarrow ')
    .replace(/·/g, ' \\cdot ')
    .replace(/×/g, ' \\times ');

  // If no Cyrillic letters are present, return cleaned string directly
  if (!/[а-яА-ЯёЁ]/.test(clean)) {
    return clean;
  }

  // Protect already existing \text{...}, \textbf{...}, \textit{...}, \mathrm{...}, \operatorname{...}
  const textBlocks: string[] = [];
  clean = clean.replace(/\\(?:text(?:bf|it)?|operatorname|mathrm)\{[^{}]*\}/g, (m) => {
    textBlocks.push(m);
    return `___TEXT_BLOCK_${textBlocks.length - 1}___`;
  });

  // Match sequences that start with a Cyrillic letter, containing Cyrillic words,
  // spaces, punctuation (:;,!?—–«»"'()№-), and standalone numbers not attached to Latin variables
  clean = clean.replace(
    /([а-яА-ЯёЁ]+(?:[\s,.:;!?—–«»"'()№-]+(?:[а-яА-ЯёЁ]+|(?:\d+(?![a-zA-Z]))))*[\s,.:;!?—–«»"'()№]*(?![a-zA-Z0-9]))/g,
    (m) => {
      if (/[а-яА-ЯёЁ]/.test(m)) {
        return `\\text{${m}}`;
      }
      return m;
    }
  );

  // Restore protected blocks
  return clean.replace(/___TEXT_BLOCK_(\d+)___/g, (_, idx) => textBlocks[Number(idx)]);
}

/**
 * Renders TeX into HTML string safely using KaTeX, with full support for Cyrillic prose and mixed formulas
 */
export function renderTeX(tex: string, displayMode = false): string {
  if (!tex) return '';
  try {
    const sanitized = prepareTeXWithCyrillic(tex);
    return katex.renderToString(sanitized, {
      displayMode,
      throwOnError: false,
      strict: false,
      output: 'html',
    });
  } catch (err) {
    console.warn('KaTeX render error:', err);
    return `<span class="font-sans">${escapeHtml(tex)}</span>`;
  }
}

/**
 * Normalizes mathematical expression for comparison
 * e.g., "3x + 12" <-> "12 + 3x", "3*x + 12", "x = 2; x = 3"
 */
export function checkMathAnswer(userAnswer: string, expectedAnswer: string): boolean {
  if (!userAnswer || !expectedAnswer) return false;

  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/\\cdot/g, '*')
      .replace(/\\times/g, '*')
      .replace(/×/g, '*')
      .replace(/−/g, '-')
      .replace(/;/g, ',')
      .replace(/\\,/g, '')
      .trim();

  const cleanUser = clean(userAnswer);
  const cleanExpected = clean(expectedAnswer);

  // Exact match
  if (cleanUser === cleanExpected) return true;

  // Handle commutativity of addition: e.g. "3x+12" vs "12+3x"
  const splitTerms = (str: string) => {
    // splits by + while respecting leading -
    return str
      .replace(/-/g, '+-')
      .split('+')
      .filter(Boolean)
      .map(t => t.replace(/\*/g, ''))
      .sort();
  };

  try {
    const userTerms = splitTerms(cleanUser);
    const expectedTerms = splitTerms(cleanExpected);
    if (userTerms.length > 1 && userTerms.length === expectedTerms.length) {
      if (userTerms.join(',') === expectedTerms.join(',')) return true;
    }
  } catch {
    // fallback
  }

  // Handle multiple roots: e.g. "x=2, x=3" or "2, 3" vs "3, 2"
  if (cleanExpected.includes(',')) {
    const expParts = cleanExpected.split(',').map(p => p.replace(/x=/g, '')).sort();
    const userParts = cleanUser.split(',').map(p => p.replace(/x=/g, '')).sort();
    if (expParts.join(',') === userParts.join(',')) return true;
  }

  // Handle multiplication normalization: "3*x+12" vs "3x+12"
  const withoutMulUser = cleanUser.replace(/\*/g, '');
  const withoutMulExp = cleanExpected.replace(/\*/g, '');
  if (withoutMulUser === withoutMulExp) return true;

  return false;
}

/**
 * Detect the deepest unmastered foundational gap for a given node
 */
export function findDeepestPrerequisiteGap(
  targetNodeId: string,
  allNodes: MathNode[],
  masteredIds: Set<string>
): MathNode | null {
  const nodeMap = new Map(allNodes.map(n => [n.id, n]));
  const target = nodeMap.get(targetNodeId);
  if (!target) return null;

  // Traverse down prerequisites
  const visited = new Set<string>();
  const queue: string[] = [...target.requires];
  let deepestGap: MathNode | null = null;
  let minLayer = 999;

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const currNode = nodeMap.get(currentId);
    if (!currNode) continue;

    if (!masteredIds.has(currNode.id)) {
      if (currNode.layer < minLayer) {
        minLayer = currNode.layer;
        deepestGap = currNode;
      }
    }

    if (currNode.requires) {
      queue.push(...currNode.requires);
    }
  }

  return deepestGap;
}

/**
 * Recursively find all ancestors (prerequisites) of a node up to root layer 0
 */
export function getNodeAncestors(targetNodeId: string, allNodes: MathNode[]): Set<string> {
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
  const ancestors = new Set<string>();
  const queue = [...(nodeMap.get(targetNodeId)?.requires || [])];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (ancestors.has(id)) continue;
    ancestors.add(id);
    const node = nodeMap.get(id);
    if (node && node.requires) {
      queue.push(...node.requires);
    }
  }
  return ancestors;
}

/**
 * Recursively find all descendants (consequences / unlocked concepts) of a node
 */
export function getNodeDescendants(targetNodeId: string, allNodes: MathNode[]): Set<string> {
  // Build reverse adjacency list
  const dependentsMap = new Map<string, string[]>();
  allNodes.forEach((node) => {
    (node.requires || []).forEach((reqId) => {
      const list = dependentsMap.get(reqId) || [];
      list.push(node.id);
      dependentsMap.set(reqId, list);
    });
  });

  const descendants = new Set<string>();
  const queue = [...(dependentsMap.get(targetNodeId) || [])];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (descendants.has(id)) continue;
    descendants.add(id);
    const children = dependentsMap.get(id) || [];
    queue.push(...children);
  }
  return descendants;
}

/**
 * Finds shortest connection path between two nodes in the undirected dependency graph
 */
export function findConnectionPath(nodeAId: string, nodeBId: string, allNodes: MathNode[]): string[] {
  if (nodeAId === nodeBId) return [nodeAId];

  // Build undirected adjacency graph
  const adj = new Map<string, Set<string>>();
  allNodes.forEach((n) => {
    if (!adj.has(n.id)) adj.set(n.id, new Set());
    (n.requires || []).forEach((reqId) => {
      if (!adj.has(reqId)) adj.set(reqId, new Set());
      adj.get(n.id)!.add(reqId);
      adj.get(reqId)!.add(n.id);
    });
  });

  const queue: Array<{ id: string; path: string[] }> = [{ id: nodeAId, path: [nodeAId] }];
  const visited = new Set<string>([nodeAId]);

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    if (id === nodeBId) return path;

    const neighbors = adj.get(id) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, path: [...path, neighbor] });
      }
    }
  }

  return [];
}

export interface DynamicDiagnosticItem {
  id: string;
  conceptTitle: string;
  formula: string;
  questionText: string;
  targetNodeId: string;
  explanationIfUnknown: string;
  layer: number;
}

/**
 * Build dynamic diagnostic question chain descending from a target node down to layer 0 bedrock
 */
export function buildDiagnosticChainForNode(targetNode: MathNode, allNodes: MathNode[]): DynamicDiagnosticItem[] {
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

  // Priority queue / BFS collecting ancestors ordered by layer descending (from top target down to bedrock 0)
  const ancestors = Array.from(getNodeAncestors(targetNode.id, allNodes))
    .map((id) => nodeMap.get(id))
    .filter((n): n is MathNode => Boolean(n))
    .sort((a, b) => b.layer - a.layer);

  // If no direct ancestors found, add base roots (layer 0)
  if (ancestors.length === 0) {
    const roots = allNodes.filter((n) => n.layer === 0 && n.id !== targetNode.id);
    ancestors.push(...roots);
  }

  const allOrderedNodes = [targetNode, ...ancestors];

  return allOrderedNodes.map((n, idx) => {
    let qText = '';
    if (idx === 0) {
      qText = `Понятно ли тебе, как устроена концепция «${n.title}» (${n.formula}) и почему этот переход справедлив?`;
    } else if (n.layer === 0) {
      qText = `Понятен ли этот фундаментальный кирпичик: «${n.title}» (${n.formula})?`;
    } else {
      qText = `Понятно ли базовое свойство: «${n.title}» (${n.formalRule || n.formula})?`;
    }

    return {
      id: `diag_${n.id}`,
      conceptTitle: n.title,
      formula: n.formula,
      questionText: qText,
      targetNodeId: n.id,
      explanationIfUnknown: n.whyCanIDoThis || n.explanationHuman || n.formalRule,
      layer: n.layer,
    };
  });
}

/**
 * Calculates auto layout coordinates for nodes with generous spacing
 * so that cards (width 290px, height ~160px) never overlap.
 * Supports optional custom user-dragged positions override.
 */
export function calculateTreeCoordinates(
  nodes: MathNode[],
  invertedRootsAtBottom = true,
  customPositions?: Record<string, { x: number; y: number }>
): MathNode[] {
  if (!nodes || nodes.length === 0) return [];

  // Group by layer
  const layerMap = new Map<number, MathNode[]>();
  nodes.forEach((n) => {
    const list = layerMap.get(n.layer) || [];
    list.push(n);
    layerMap.set(n.layer, list);
  });

  const maxLayer = Math.max(...nodes.map((n) => n.layer), 0);
  // Generous spacing: 420px horizontal center distance gives 130px clear gap between 290px cards.
  // 280px vertical layer step gives ~110px clear vertical gap for bezier connectors and Why-pills.
  const colSpacing = 420;
  const layerHeight = 280;

  const result: MathNode[] = [];

  layerMap.forEach((layerNodes, layer) => {
    // Sort nodes in layer by their original x coordinate to preserve logical left-to-right branch flow
    const sorted = [...layerNodes].sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
    const count = sorted.length;

    sorted.forEach((node, idx) => {
      // If user has dragged this node to a custom position, respect it
      if (customPositions && customPositions[node.id]) {
        result.push({
          ...node,
          x: customPositions[node.id].x,
          y: customPositions[node.id].y,
        });
        return;
      }

      // Default spacious layout
      const x = Math.round((idx - (count - 1) / 2) * colSpacing);
      const y = invertedRootsAtBottom
        ? Math.round((maxLayer - layer) * layerHeight + 60)
        : Math.round(layer * layerHeight + 60);

      result.push({
        ...node,
        x,
        y,
      });
    });
  });

  return result;
}

/**
 * Parses simple algebraic equation into an AST
 * Supports linear equations like "2x + 4 = 10", "(x+5)/3 = 7", "ax^2 - 5x + 6 = 0"
 */
export function parseEquationToAST(equation: string): ASTNode {
  const clean = equation.replace(/\s+/g, '').replace(/−/g, '-');
  const parts = clean.split('=');

  if (parts.length === 2) {
    return {
      type: 'Equality',
      description: 'Равенство двух частей уравнения (Инвариант весов)',
      left: parseExpressionToAST(parts[0]),
      right: parseExpressionToAST(parts[1]),
    };
  }

  return parseExpressionToAST(clean);
}

function parseExpressionToAST(expr: string): ASTNode {
  // Handle division: e.g. (x+5)/3
  if (expr.includes('/') && !expr.startsWith('(')) {
    const slashIndex = expr.lastIndexOf('/');
    const leftPart = expr.substring(0, slashIndex);
    const rightPart = expr.substring(slashIndex + 1);
    return {
      type: 'Divide',
      description: 'Деление (Обратная операция к умножению)',
      left: parseExpressionToAST(leftPart),
      right: parseExpressionToAST(rightPart),
    };
  }

  // Handle addition / subtraction (respecting parentheses)
  let parenDepth = 0;
  let opIndex = -1;
  let opType: 'Add' | 'Subtract' | null = null;

  for (let i = expr.length - 1; i >= 0; i--) {
    const ch = expr[i];
    if (ch === ')') parenDepth++;
    else if (ch === '(') parenDepth--;
    else if (parenDepth === 0 && (ch === '+' || (ch === '-' && i > 0))) {
      opIndex = i;
      opType = ch === '+' ? 'Add' : 'Subtract';
      break;
    }
  }

  if (opIndex !== -1 && opType) {
    return {
      type: opType,
      description: opType === 'Add' ? 'Сложение (Объединение величин)' : 'Вычитание (Уменьшение величины)',
      left: parseExpressionToAST(expr.substring(0, opIndex)),
      right: parseExpressionToAST(expr.substring(opIndex + 1)),
    };
  }

  // Handle parentheses wrapper e.g. (x+5)
  if (expr.startsWith('(') && expr.endsWith(')')) {
    return {
      type: 'Paren',
      description: 'Группировка слагаемых (Скобки)',
      children: [parseExpressionToAST(expr.substring(1, expr.length - 1))],
    };
  }

  // Handle multiplication like 2x, 2*x, 3(x+4)
  const mulMatch = expr.match(/^([0-9]+)\*?([a-zA-Z]+|\(.*\))$/);
  if (mulMatch) {
    return {
      type: 'Multiply',
      description: 'Умножение (Повторное сложение)',
      left: { type: 'Number', value: Number(mulMatch[1]), description: `Коэффициент ${mulMatch[1]}` },
      right: parseExpressionToAST(mulMatch[2]),
    };
  }

  // Handle power like x^2
  if (expr.includes('^')) {
    const [base, exp] = expr.split('^');
    return {
      type: 'Power',
      description: 'Возведение в степень',
      left: parseExpressionToAST(base),
      right: { type: 'Number', value: Number(exp), description: `Показатель ${exp}` },
    };
  }

  // Single Variable (e.g. x)
  if (/^[a-zA-Z]$/.test(expr)) {
    return {
      type: 'Variable',
      value: expr,
      description: `Неизвестная переменная ${expr}`,
    };
  }

  // Single Number
  const num = Number(expr);
  if (!isNaN(num)) {
    return {
      type: 'Number',
      value: num,
      description: `Числовое значение ${num}`,
    };
  }

  // Fallback
  return {
    type: 'Variable',
    value: expr,
    description: `Элемент ${expr}`,
  };
}

/**
 * Diagnoses misconceptions in linear equation solving
 * E.g. for 2x + 4 = 10:
 * If user enters "2x = 14", detects adding 4 instead of subtracting
 */
export function diagnoseLinearStepError(
  equation: string,
  userStep: string
): { isCorrect: boolean; feedback: string; prerequisiteNodeId?: string } {
  const clean = userStep.replace(/\s+/g, '').toLowerCase();

  // For 2x + 4 = 10
  if (equation.includes('2x+4=10') || equation.includes('2x + 4 = 10')) {
    if (clean === '2x=6' || clean === '2*x=6') {
      return {
        isCorrect: true,
        feedback: 'Верно! Вычли 4 из обеих частей уравнения, сохранив равенство.',
      };
    }
    if (clean === '2x=14' || clean === '2*x=14') {
      return {
        isCorrect: false,
        feedback:
          'Похоже, вместо вычитания 4 из правой части выполнено сложение: 10 + 4 = 14. Чтобы убрать слагаемое +4, применяется обратная операция: вычитание (-4).',
        prerequisiteNodeId: 'node_addition',
      };
    }
    if (clean === 'x=3') {
      return {
        isCorrect: true,
        feedback: 'Верно! Найден конечный корень x = 3.',
      };
    }
    if (clean === 'x=5' || clean === 'x=6') {
      return {
        isCorrect: false,
        feedback:
          'Обрати внимание: после получения 2x = 6 необходимо разделить обе части уравнения на коэффициент при x (на 2), то есть 6 / 2 = 3.',
        prerequisiteNodeId: 'node_distributive_law',
      };
    }
  }

  // Generic check
  return {
    isCorrect: false,
    feedback: 'Попробуй проверить эквивалентность преобразования: то, что делается с левой частью, должно зеркально делаться с правой.',
  };
}

/**
 * Formats user mastery score (0.00 to 1.00) with visual indicators from spec
 */
export function formatMastery(score: number): {
  statusText: string;
  symbol: string;
  badgeClass: string;
} {
  if (score >= 0.75) {
    return {
      statusText: 'Освоено',
      symbol: '✓',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    };
  }
  if (score >= 0.5) {
    return {
      statusText: 'Уверенно понимает',
      symbol: '△',
      badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    };
  }
  if (score >= 0.25) {
    return {
      statusText: 'Знаком',
      symbol: '△',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    };
  }
  return {
    statusText: 'Пробел в цепочке',
    symbol: '✕',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  };
}
