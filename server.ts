import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { initDb, closeDb, db, isDbConnected } from "./server/db";
import {
  generateToken,
  hashPassword,
  comparePassword,
  requireAuth,
  optionalAuth,
  AuthRequest,
} from "./server/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Production hardening middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Required for inline math and KaTeX CDN fonts
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "10mb" }));

// Rate limit AI requests to prevent spam & protect Gemini quotas
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Превышен лимит запросов к ИИ. Пожалуйста, подождите минуту." },
});
app.use("/api/ai", aiLimiter);

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "mathroots-production",
        },
      },
    });
  }
  return aiClient;
}

/**
 * Resilient Gemini caller with multiple model cascade and automatic backoff
 */
async function generateJsonWithFallback(prompt: string, ai: GoogleGenAI): Promise<any> {
  const models = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });
        const text = response.text || "{}";
        return JSON.parse(text);
      } catch (err: any) {
        lastError = err;
        const msg = err?.status || err?.message || String(err);
        console.warn(`[Gemini] Model ${model} attempt ${attempt} failed: ${typeof msg === "string" ? msg.slice(0, 100) : "error"}`);
        if (attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      }
    }
  }
  throw lastError;
}

/**
 * Fallback semantic decomposition generator if AI service is temporarily unreachable
 */
function createFallbackTree(problem: string) {
  const clean = problem.toLowerCase();
  const isQuad = clean.includes("^2") || clean.includes("²") || clean.includes("квадрат");

  if (isQuad) {
    return {
      title: `Квадратная зависимость: ${problem}`,
      goalFormula: problem,
      summary: "Анализ квадратного уравнения от свойств умножения до выделения квадрата или дискриминанта.",
      nodes: [
        {
          id: "root_arithmetic",
          title: "Свойства умножения и степеней",
          formula: "x^2 = x \\cdot x",
          layer: 0,
          type: "concept",
          branch: "main",
          explanationHuman: "Степень показывает число сомножителей. Квадрат любого вещественного числа неотрицателен: x^2 \\ge 0.",
          formalRule: "Определение натуральной степени числа.",
          visualSteps: ["x \\cdot x", "x^2"],
          whyCanIDoThis: "Аксиомы алгебры и определение степени.",
          practiceExercise: { question: "Чему равно (-3)^2?", expectedAnswer: "9", hint: "Минус на минус дает плюс." },
          requires: [],
        },
        {
          id: "root_distributive",
          title: "Распределительный закон",
          formula: "a(b + c) = ab + ac",
          layer: 1,
          type: "concept",
          branch: "main",
          explanationHuman: "Позволяет раскрывать скобки и группировать подобные слагаемые.",
          formalRule: "Дистрибутивность умножения относительно сложения.",
          visualSteps: ["(x + p)(x + q)", "x^2 + (p+q)x + pq"],
          whyCanIDoThis: "Геометрическая площадь прямоугольника, разбитого на секторы.",
          requires: ["root_arithmetic"],
        },
        {
          id: "step_discriminant",
          title: "Дискриминант и формула корней",
          formula: "D = b^2 - 4ac, \\quad x = \\frac{-b \\pm \\sqrt{D}}{2a}",
          layer: 2,
          type: "step",
          branch: "main",
          explanationHuman: "Дискриминант показывает, пересекает ли парабола ось OX и сколько действительных корней существует.",
          formalRule: "Формула корней квадратного трехчлена.",
          visualSteps: ["D > 0: 2 корня", "D = 0: 1 корень", "D < 0: нет действительных корней"],
          whyCanIDoThis: "Получается в результате полного выделения квадрата двучлена.",
          requires: ["root_distributive"],
        },
        {
          id: "goal_node",
          title: `Решение: ${problem}`,
          formula: problem,
          layer: 3,
          type: "goal",
          branch: "main",
          explanationHuman: "Нахождение и проверка найденных корней подстановкой в исходное равенство.",
          formalRule: "Проверка тождества.",
          visualSteps: ["Подстановка x_1 и x_2", "Проверка истинности"],
          whyCanIDoThis: "Аксиома равенства.",
          requires: ["step_discriminant"],
        },
      ],
    };
  }

  return {
    title: `Декомпозиция: ${problem}`,
    goalFormula: problem,
    summary: `Пошаговое построение фундамента решения задачи ${problem} от равенств к изолированию неизвестной.`,
    nodes: [
      {
        id: "root_equality",
        title: "Свойство равенства (весы)",
        formula: "a = b \\iff a \\pm c = b \\pm c",
        layer: 0,
        type: "concept",
        branch: "main",
        explanationHuman: "Если к обеим чашам весов добавить или отнять одинаковый вес, чаши останутся в равновесии.",
        formalRule: "Аксиома сохранения эквивалентности при обратимых операциях.",
        visualSteps: ["Левая чаша = Правая чаша", "Одинаковое изменение с двух сторон"],
        whyCanIDoThis: "Фундаментальное определение отношения равенства.",
        practiceExercise: { question: "Если 2x = 10, чему равно x?", expectedAnswer: "5", hint: "Разделите обе части на 2." },
        requires: [],
      },
      {
        id: "step_isolate_terms",
        title: "Изолирование слагаемых с переменной",
        formula: "ax + b = c \\implies ax = c - b",
        layer: 1,
        type: "step",
        branch: "main",
        explanationHuman: "Переносим все свободные числа в одну сторону, а слагаемые с переменной оставляем в другой.",
        formalRule: "Вычитание свободного коэффициента из обеих частей.",
        visualSteps: ["ax + b - b = c - b", "ax = c - b"],
        whyCanIDoThis: "Применение свойства равенства для взаимного уничтожения слагаемых: b - b = 0.",
        requires: ["root_equality"],
      },
      {
        id: "step_divide_coeff",
        title: "Деление на коэффициент при неизвестной",
        formula: "ax = d \\implies x = \\frac{d}{a} \\quad (a \\ne 0)",
        layer: 2,
        type: "step",
        branch: "main",
        explanationHuman: "Чтобы найти значение одной переменной, делим обе части на её множитель.",
        formalRule: "Умножение обеих частей на обратный элемент 1/a.",
        visualSteps: ["(1/a) \\cdot ax = (1/a) \\cdot d", "x = d / a"],
        whyCanIDoThis: "Существование обратного элемента по умножению для любого a \\ne 0.",
        requires: ["step_isolate_terms"],
      },
      {
        id: "goal_node",
        title: `Целевое решение: ${problem}`,
        formula: problem,
        layer: 3,
        type: "goal",
        branch: "main",
        explanationHuman: "Финальное значение неизвестного и обязательная проверка подстановкой в начальное условие.",
        formalRule: "Проверка тождества вычислением левой и правой части.",
        visualSteps: ["Подстановка найденного x", "Левая часть = Правая часть"],
        whyCanIDoThis: "Единственность решения линейного уравнения.",
        requires: ["step_divide_coeff"],
      },
    ],
  };
}

// -------------------------------------------------------------
// Core System & Health Endpoints
// -------------------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGemini: Boolean(process.env.GEMINI_API_KEY),
    database: isDbConnected() ? "postgresql" : "in-memory-resilient",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// Auth Endpoints
// -------------------------------------------------------------

// Guest session for immediate onboarding without registration barrier
app.post("/api/auth/guest", async (_req, res) => {
  try {
    const user = await db.createGuestUser();
    const token = generateToken(user);
    res.json({ success: true, token, user });
  } catch (err: any) {
    res.status(500).json({ error: "Не удалось создать гостевую сессию", details: err.message });
  }
});

// Register full account
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, displayName = "Ученик", role = "student" } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email и пароль обязательны" });
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "Пользователь с таким email уже зарегистрирован" });
    }

    const passwordHash = await hashPassword(password);
    const user = await db.createUser(email, passwordHash, displayName, role);
    const token = generateToken(user);
    res.json({ success: true, token, user });
  } catch (err: any) {
    res.status(500).json({ error: "Ошибка при регистрации", details: err.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email и пароль обязательны" });
    }

    const user = await db.findUserByEmail(email);
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }

    const token = generateToken(user);
    res.json({ success: true, token, user });
  } catch (err: any) {
    res.status(500).json({ error: "Ошибка при входе", details: err.message });
  }
});

// Current user profile
app.get("/api/auth/me", requireAuth, async (req: AuthRequest, res) => {
  res.json({ success: true, user: req.user });
});

// -------------------------------------------------------------
// User Progress, Mastery & Workouts Endpoints
// -------------------------------------------------------------

app.get("/api/user/mastery", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || "anonymous";
    const data = await db.getMasteredNodes(userId);
    res.json({ success: true, ...data });
  } catch (err: any) {
    res.status(500).json({ error: "Ошибка загрузки прогресса", details: err.message });
  }
});

app.post("/api/user/mastery", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || "anonymous";
    const { nodeId, treeId, score = 1.0, isCorrect = true } = req.body;
    if (!nodeId || !treeId) {
      return res.status(400).json({ error: "nodeId и treeId обязательны" });
    }

    const mastery = await db.upsertNodeMastery(userId, nodeId, treeId, score, isCorrect);
    res.json({ success: true, mastery });
  } catch (err: any) {
    res.status(500).json({ error: "Ошибка сохранения mastery", details: err.message });
  }
});

app.post("/api/user/workout", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || "anonymous";
    const { problemId, category, selectedOption, isCorrect, timeSpentSec = 0 } = req.body;
    if (!problemId) {
      return res.status(400).json({ error: "problemId обязателен" });
    }

    const record = await db.recordWorkoutAttempt(
      userId,
      problemId,
      category || "general",
      selectedOption ?? 0,
      Boolean(isCorrect),
      timeSpentSec
    );
    res.json({ success: true, attempt: record });
  } catch (err: any) {
    res.status(500).json({ error: "Ошибка сохранения попытки", details: err.message });
  }
});

// Workout stats & analytics
app.get("/api/user/workout-stats", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || "anonymous";
    const stats = await db.getUserWorkoutStats(userId);
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ error: "Ошибка загрузки статистики тренировок", details: err.message });
  }
});

// Cognitive Gaps journal
app.get("/api/user/gaps", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || "anonymous";
    const gaps = await db.getUserGaps(userId);
    res.json({ success: true, gaps });
  } catch (err: any) {
    res.status(500).json({ error: "Ошибка загрузки пробелов", details: err.message });
  }
});

app.post("/api/user/gaps", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || "anonymous";
    const { rootNodeId, targetNodeId, gapConcept, rootCause } = req.body;
    const gap = await db.recordCognitiveGap(
      userId,
      rootNodeId || "",
      targetNodeId || "",
      gapConcept || "",
      rootCause || ""
    );
    res.json({ success: true, gap });
  } catch (err: any) {
    res.status(500).json({ error: "Ошибка сохранения пробела", details: err.message });
  }
});

// -------------------------------------------------------------
// Custom Trees & Social Sharing Endpoints
// -------------------------------------------------------------

app.get("/api/trees/custom", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || "anonymous";
    const trees = await db.getCustomTrees(userId);
    res.json({ success: true, trees: trees.map((t) => t.tree_data) });
  } catch (err: any) {
    res.status(500).json({ error: "Ошибка загрузки деревьев", details: err.message });
  }
});

app.post("/api/trees/custom", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || "anonymous";
    const { tree, isPublic = false } = req.body;
    if (!tree || !tree.id) {
      return res.status(400).json({ error: "Данные дерева обязательны" });
    }

    const saved = await db.saveCustomTree(userId, tree, isPublic);
    res.json({ success: true, tree: saved.tree_data, shareSlug: saved.share_slug });
  } catch (err: any) {
    res.status(500).json({ error: "Ошибка сохранения дерева", details: err.message });
  }
});

app.get("/api/trees/shared/:shareSlug", async (req, res) => {
  try {
    const tree = await db.getSharedTree(req.params.shareSlug);
    if (!tree) {
      return res.status(404).json({ error: "Общее дерево не найдено" });
    }
    res.json({ success: true, tree: tree.tree_data });
  } catch (err: any) {
    res.status(500).json({ error: "Ошибка загрузки общего дерева", details: err.message });
  }
});

// -------------------------------------------------------------
// Canvas Layout Endpoints
// -------------------------------------------------------------

app.get("/api/canvas/layout/:treeId", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || "anonymous";
    const positions = await db.getCanvasLayout(userId, req.params.treeId);
    res.json({ success: true, positions });
  } catch (err: any) {
    res.status(500).json({ error: "Ошибка загрузки раскладки холста", details: err.message });
  }
});

app.put("/api/canvas/layout/:treeId", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || "anonymous";
    const { positions } = req.body;
    await db.saveCanvasLayout(userId, req.params.treeId, positions || {});
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Ошибка сохранения раскладки холста", details: err.message });
  }
});

// -------------------------------------------------------------
// AI Endpoints (Decomposition, Deep Why, Cognitive Diagnosis)
// -------------------------------------------------------------

app.post("/api/ai/decompose", async (req, res) => {
  try {
    const { problem, masteredTopics = [] } = req.body;
    if (!problem || typeof problem !== "string") {
      return res.status(400).json({ error: "Missing problem text" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      const fallbackTree = createFallbackTree(problem);
      return res.json({ success: true, tree: fallbackTree, fallback: true });
    }

    const prompt = `
Ты — математический архитектор и создатель карт знаний MathRoots ("Любая сложная задача имеет корни").
Задача пользователя: "${problem}".
Уже освоенные темы пользователя: ${JSON.stringify(masteredTopics)}.

Построй дерево математических зависимостей снизу вверх (от фундаментальных корней к цели) для этой задачи.
В дереве должны быть:
1. Корневые фундаментальные знания внизу (layer 0: числа, базовые операции)
2. Промежуточные навыки (layer 1, 2: свойства, уравнения, функции)
3. Шаги решения самой задачи (верхний уровень)
4. Если применимо, покажи альтернативные пути решения (например, для квадратного уравнения: факторизация, дискриминант, графический метод).
5. Включи узел типа "bridge" (мост), показывающий глубокую связь между операциями (например, умножение как повторяющееся сложение).

Верни валидный JSON следующей структуры:
{
  "title": "Название задачи",
  "goalFormula": "Формула цели в TeX",
  "summary": "Краткая концепция решения в 2-3 предложениях",
  "nodes": [
    {
      "id": "уникальный id на латинице (например: root_addition, step_expand)",
      "title": "Название узла",
      "formula": "Ключевая формула в KaTeX (например: a(b+c) = ab+ac)",
      "layer": 0,
      "type": "concept",
      "branch": "main",
      "explanationHuman": "Простое человеческое объяснение сути",
      "formalRule": "Строгое математическое правило",
      "visualSteps": ["2 * (x + 3)", "(x + 3) + (x + 3)", "2x + 6"],
      "whyCanIDoThis": "Почему я могу это сделать? Обоснование шага или правила",
      "practiceExercise": {
        "question": "Короткий проверочный вопрос",
        "expectedAnswer": "Правильный ответ (например: 3x+12)",
        "hint": "Подсказка"
      },
      "requires": ["id_другого_узла_который_нужен_для_понимания"]
    }
  ]
}
`;

    try {
      const data = await generateJsonWithFallback(prompt, ai);
      return res.json({ success: true, tree: data });
    } catch (genErr) {
      console.warn("Gemini cascade failed, using high-fidelity fallback:", genErr);
      const fallbackTree = createFallbackTree(problem);
      return res.json({ success: true, tree: fallbackTree, fallback: true });
    }
  } catch (error: any) {
    console.error("Error in /api/ai/decompose:", error);
    const fallbackTree = createFallbackTree(req.body?.problem || "Математическая задача");
    res.json({ success: true, tree: fallbackTree, fallback: true });
  }
});

app.post("/api/ai/explain-why", async (req, res) => {
  const { nodeTitle, formula, stepContext, level = "school" } = req.body;

  const personaInstructions: Record<string, string> = {
    novice: "Объясни для новичка/ребенка (10 лет) на пальцах через простые физические предметы, яблоки, коробки, без сложного жаргона.",
    school: "Объясни как школьный учитель математики: правила алгебры, ассоциативность, дистрибутивность, стандартные примеры с раскрытием скобок.",
    university: "Объясни как профессор университета: аксиоматика Пеано, кольца, поля, дистрибутивность умножения относительно сложения в кольце, формальное доказательство.",
    programmer: "Объясни для программиста через аналогии: функции map/reduce, чистые функции, типы данных, циклы, эквивалентность преобразований AST.",
  };

  const fallbackExplanation = {
    shortAnswer: `Математическое преобразование для «${nodeTitle}» сохраняет тождество и истинность уравнения.`,
    detailedExplanation: `Когда мы применяем правило ${formula}, мы совершаем обратимое алгебраическое действие. Если к обеим частям равенства применить одну и ту же операцию, значение равенства не нарушается. В случае формулы ${formula} это прямое следствие законов поля действительных чисел.`,
    analogy: "Представь чашечные весы в точном равновесии. Если на обе чаши положить или убрать одинаковые грузики, весы останутся строго горизонтальными.",
    axiomOrProof: "Аксиомы поля действительных чисел и свойства транзитивности отношения равенства: a = b \\implies f(a) = f(b).",
    deeperQuestion: `Почему именно операция над формулой ${formula} является обратимой?`,
  };

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ success: true, explanation: fallbackExplanation, fallback: true });
    }

    const personaDesc = personaInstructions[level] || personaInstructions.school;
    const prompt = `
Ты — интеллектуальный преподаватель MathRoots.
Тема: "${nodeTitle}"
Формула: "${formula}"
Контекст перехода/шага: "${stepContext || "почему это преобразование справедливо"}"
Уровень аудитории: ${level} (${personaDesc})

Дай ясное, глубокое объяснение, отвечающее на вопрос:
"Почему я могу это сделать? Почему это фундаментально работает?"

Верни JSON:
{
  "shortAnswer": "Одно-два емких предложения с сутью",
  "detailedExplanation": "Основное объяснение в 3-4 абзацах с формулами в TeX",
  "analogy": "Наглядная аналогия",
  "axiomOrProof": "Краткая ссылка на аксиому или математическое доказательство",
  "deeperQuestion": "Вопрос для дальнейшего копания"
}
`;

    try {
      const data = await generateJsonWithFallback(prompt, ai);
      return res.json({ success: true, explanation: data });
    } catch (genErr) {
      console.warn("Gemini cascade failed for explain-why, returning fallback:", genErr);
      return res.json({ success: true, explanation: fallbackExplanation, fallback: true });
    }
  } catch (error: any) {
    console.error("Error in /api/ai/explain-why:", error);
    res.json({ success: true, explanation: fallbackExplanation, fallback: true });
  }
});

app.post("/api/ai/diagnose-stuck", async (req, res) => {
  const {
    currentNode,
    userMistakes = [],
    history = [],
    userEquation,
    customQuery,
    treeTitle,
    activeFormula,
    recentSteps = [],
  } = req.body;

  const nodeTitle = currentNode?.title || treeTitle || "Текущий шаг";
  const formula = currentNode?.formula || activeFormula || userEquation || "";
  const mistakeContext = userEquation || customQuery || (userMistakes.length ? userMistakes.join("; ") : "Затруднение в понимании перехода");

  const fallbackDiagnosis = {
    gapConcept: "Свойства равенства и знаки операций",
    rootCauseAnalysis: `Трудность в узле «${nodeTitle}» связана с переходом между прямой и обратной операцией или работой со знаками: ${mistakeContext}.`,
    pathFromRoot: ["Сложение", "Вычитание", "Отрицательные числа (пробел)", "Перенос слагаемых", nodeTitle],
    recommendedAction: "Повтори правило чашечных весов: любое действие должно синхронно выполняться с обеими частями выражения.",
    targetNodeId: currentNode?.id || "lin2_prop_equality",
    missingFoundationalConcept: "Свойства равенства и знаки операций",
    explanation: `Трудность в узле «${nodeTitle}» связана с фундаментальным правилом сохранения равенства.`,
    recommendedPrerequisiteNodeId: currentNode?.id || "lin2_prop_equality",
    remedialStepQuestions: ["Сложение", "Вычитание", "Отрицательные числа"],
  };

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ success: true, diagnosis: fallbackDiagnosis, fallback: true });
    }

    const prompt = `
Ты — математический отладчик когнитивных пробелов MathRoots.
Пользователь застрял на узле "${nodeTitle}".
Формула узла: "${formula}".
Контекст ошибки/запроса пользователя: "${mistakeContext}".
Недавние шаги: ${JSON.stringify(recentSteps)}.
История пройденных тем: ${JSON.stringify(history)}.

Проанализируй граф понятий: в чем кроется истинный когнитивный пробел в корнях (фундаменте)?
Верни строгий JSON:
{
  "gapConcept": "Название фундаментального пробела (например: Правило весов при вычитании)",
  "rootCauseAnalysis": "Четкий анализ истинной причины ошибки (2-3 предложения)",
  "pathFromRoot": ["Аксиома/База", "Свойство", "Пробел", "Текущая задача"],
  "recommendedAction": "Конкретная рекомендация и практическое микро-упражнение",
  "targetNodeId": "${currentNode?.id || "node_target"}"
}
`;

    try {
      const rawData = await generateJsonWithFallback(prompt, ai);
      const data = {
        gapConcept: rawData.gapConcept || rawData.missingFoundationalConcept || fallbackDiagnosis.gapConcept,
        rootCauseAnalysis: rawData.rootCauseAnalysis || rawData.explanation || fallbackDiagnosis.rootCauseAnalysis,
        pathFromRoot: Array.isArray(rawData.pathFromRoot) ? rawData.pathFromRoot : fallbackDiagnosis.pathFromRoot,
        recommendedAction: rawData.recommendedAction || fallbackDiagnosis.recommendedAction,
        targetNodeId: rawData.targetNodeId || rawData.recommendedPrerequisiteNodeId || fallbackDiagnosis.targetNodeId,
        missingFoundationalConcept: rawData.gapConcept || rawData.missingFoundationalConcept || fallbackDiagnosis.gapConcept,
        explanation: rawData.rootCauseAnalysis || rawData.explanation || fallbackDiagnosis.rootCauseAnalysis,
        recommendedPrerequisiteNodeId: rawData.targetNodeId || rawData.recommendedPrerequisiteNodeId || fallbackDiagnosis.targetNodeId,
        remedialStepQuestions: Array.isArray(rawData.pathFromRoot) ? rawData.pathFromRoot : fallbackDiagnosis.pathFromRoot,
      };
      return res.json({ success: true, diagnosis: data });
    } catch (genErr) {
      console.warn("Gemini cascade failed for diagnose-stuck, returning fallback:", genErr);
      return res.json({ success: true, diagnosis: fallbackDiagnosis, fallback: true });
    }
  } catch (error: any) {
    console.error("Error in /api/ai/diagnose-stuck:", error);
    res.json({ success: true, diagnosis: fallbackDiagnosis, fallback: true });
  }
});

// -------------------------------------------------------------
// Vite and Static File Serving
// -------------------------------------------------------------

async function startServer() {
  // Initialize Database
  await initDb();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // Serve static assets with long cache
    app.use(
      "/assets",
      express.static(path.join(distPath, "assets"), {
        maxAge: "1y",
        immutable: true,
      })
    );
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[MathRoots Server] running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });

  // Graceful Shutdown
  const shutdown = (signal: string) => {
    console.log(`\n[MathRoots Server] Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
      console.log("[MathRoots Server] HTTP server closed.");
      await closeDb();
      console.log("[MathRoots Server] Graceful shutdown completed.");
      process.exit(0);
    });

    setTimeout(() => {
      console.error("[MathRoots Server] Forced shutdown due to timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer();
