import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { db, DbAiConfig } from './db';

// Extract pure JSON from LLM markdown codeblocks or raw text
export function extractJsonFromText(rawText: string): any {
  let text = rawText.trim();
  // Strip ```json ... ```
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    // Attempt fuzzy JSON matching for { ... }
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error(`Не удалось распарсить JSON из ответа ИИ: ${text.slice(0, 150)}...`);
  }
}

// Generate normalized SHA-256 cache key
export function computeCacheKey(promptType: string, inputPayload: any): string {
  const normalized = JSON.stringify(inputPayload, Object.keys(inputPayload).sort());
  return crypto.createHash('sha256').update(`${promptType}::${normalized}`).digest('hex');
}

/**
 * Intelligent AI Execution Wrapper with Token-Saving Cache
 */
export async function executeAiWithCache<T = any>(
  promptType: string,
  inputPayload: any,
  inputSummary: string,
  generator: (activeConfig: DbAiConfig | null) => Promise<T>
): Promise<{ data: T; cached: boolean; provider: string; model: string; hitCount?: number }> {
  const cacheKey = computeCacheKey(promptType, inputPayload);

  // 1. Try reading from cache
  try {
    const cached = await db.getCachedAiResponse(cacheKey);
    if (cached) {
      console.log(
        `[AI Cache] HIT (${promptType}) key=${cacheKey.slice(0, 8)} hits=${cached.hit_count} (saved ~${cached.saved_tokens_estimate} tokens)`
      );
      return {
        data: cached.response_json,
        cached: true,
        provider: cached.provider,
        model: cached.model,
        hitCount: cached.hit_count,
      };
    }
  } catch (cacheErr) {
    console.warn('[AI Cache] Read error, bypassing cache:', cacheErr);
  }

  // 2. Fetch active provider configuration
  let activeConfig: DbAiConfig | null = null;
  try {
    activeConfig = await db.getActiveAiConfig();
  } catch (err) {
    console.warn('[AI Config] Could not fetch active config, using env defaults:', err);
  }

  const provider = activeConfig?.provider || 'gemini';
  const model = activeConfig?.model || 'gemini-3.1-flash-lite';

  console.log(`[AI Dispatcher] MISS (${promptType}) invoking provider=${provider} model=${model}...`);

  // 3. Invoke actual AI generator
  const data = await generator(activeConfig);

  // 4. Save to cache asynchronously (fire-and-forget / non-blocking)
  const tokensEstimate = Math.round(JSON.stringify(data).length / 3.5);
  db.saveCachedAiResponse({
    cacheKey,
    promptType,
    provider,
    model,
    inputSummary: inputSummary.slice(0, 250),
    responseJson: data,
    savedTokensEstimate: tokensEstimate,
  }).catch((err) => console.warn('[AI Cache] Failed to save cache entry:', err));

  return {
    data,
    cached: false,
    provider,
    model,
    hitCount: 1,
  };
}

/**
 * Call external AI providers with unified schema
 */
export async function callProvider(
  prompt: string,
  systemPrompt = 'Ты — преподаватель математики MathRoots. Отвечай строго валидным JSON.',
  activeConfig: DbAiConfig | null = null
): Promise<any> {
  const provider = activeConfig?.provider || 'gemini';
  const model =
    activeConfig?.model ||
    (provider === 'deepseek'
      ? 'deepseek-chat'
      : provider === 'openrouter'
      ? 'deepseek/deepseek-r1'
      : provider === 'datakey'
      ? 'claude-sonnet-4-6'
      : 'gemini-3.1-flash-lite');
  const apiKey = activeConfig?.api_key || process.env.GEMINI_API_KEY || '';

  if (provider === 'datakey') {
    return await callDataKey(prompt, systemPrompt, model, apiKey, activeConfig?.base_url);
  }

  if (provider === 'openrouter') {
    return await callOpenRouter(prompt, systemPrompt, model, apiKey, activeConfig?.base_url);
  }

  if (provider === 'deepseek') {
    return await callDeepSeek(prompt, systemPrompt, model, apiKey, activeConfig?.base_url);
  }

  if (provider === 'yandex') {
    return await callYandexGpt(prompt, systemPrompt, model, apiKey, activeConfig?.folder_id);
  }

  if (provider === 'openai') {
    return await callOpenAiCompatible(prompt, systemPrompt, model, apiKey, activeConfig?.base_url);
  }

  // Default: Gemini
  return await callGemini(prompt, systemPrompt, model, apiKey);
}

/**
 * DataKey Provider (OpenAI SDK drop-in API proxy for Claude & GPT models)
 * Base URL: https://ai.datakey.one/v1
 */
async function callDataKey(
  prompt: string,
  systemPrompt: string,
  model: string,
  apiKey: string,
  baseUrl?: string | null
): Promise<any> {
  if (!apiKey) {
    throw new Error('API ключ для DataKey не указан. Настройте его в панели управления администратора.');
  }

  const cleanBase = (baseUrl || 'https://ai.datakey.one/v1').replace(/\/+$/, '');
  const url = cleanBase.endsWith('/v1') ? `${cleanBase}/chat/completions` : `${cleanBase}/v1/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'claude-sonnet-4-6',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`DataKey HTTP ${response.status}: ${errorBody.slice(0, 200)}`);
  }

  const json = await response.json();
  const rawText = json?.choices?.[0]?.message?.content || '{}';
  return extractJsonFromText(rawText);
}

/**
 * OpenRouter Provider
 */
async function callOpenRouter(prompt: string, systemPrompt: string, model: string, apiKey: string, baseUrl?: string | null): Promise<any> {
  if (!apiKey) {
    throw new Error('API ключ для OpenRouter не указан. Настройте его в панели управления администратора.');
  }

  const url = baseUrl || 'https://openrouter.ai/api/v1/chat/completions';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://mathroots.app',
      'X-Title': 'MathRoots',
    },
    body: JSON.stringify({
      model: model || 'deepseek/deepseek-r1',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter HTTP ${response.status}: ${errorBody.slice(0, 200)}`);
  }

  const json = await response.json();
  const rawText = json?.choices?.[0]?.message?.content || '{}';
  return extractJsonFromText(rawText);
}

/**
 * DeepSeek Direct Provider
 */
async function callDeepSeek(prompt: string, systemPrompt: string, model: string, apiKey: string, baseUrl?: string | null): Promise<any> {
  if (!apiKey) {
    throw new Error('API ключ для DeepSeek не указан. Настройте его в панели управления администратора.');
  }

  const url = `${baseUrl || 'https://api.deepseek.com'}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`DeepSeek HTTP ${response.status}: ${errorBody.slice(0, 200)}`);
  }

  const json = await response.json();
  const rawText = json?.choices?.[0]?.message?.content || '{}';
  return extractJsonFromText(rawText);
}

/**
 * Yandex AI (YandexGPT) Provider
 */
async function callYandexGpt(prompt: string, systemPrompt: string, model: string, apiKey: string, folderId?: string | null): Promise<any> {
  if (!apiKey) {
    throw new Error('API ключ для Yandex AI не указан.');
  }
  if (!folderId) {
    throw new Error('Folder ID каталога Yandex Cloud обязателен для Yandex AI.');
  }

  const modelUri = `gpt://${folderId}/${model || 'yandexgpt/latest'}`;
  const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Api-Key ${apiKey}`,
      'x-folder-id': folderId,
    },
    body: JSON.stringify({
      modelUri,
      completionOptions: {
        stream: false,
        temperature: 0.6,
        maxTokens: '3500',
      },
      messages: [
        { role: 'system', text: systemPrompt },
        { role: 'user', text: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Yandex AI HTTP ${response.status}: ${errorBody.slice(0, 200)}`);
  }

  const json = await response.json();
  const rawText = json?.result?.alternatives?.[0]?.message?.text || '{}';
  return extractJsonFromText(rawText);
}

/**
 * Custom OpenAI-compatible Provider (Groq, Ollama, LocalAI, vLLM, etc.)
 */
async function callOpenAiCompatible(prompt: string, systemPrompt: string, model: string, apiKey: string, baseUrl?: string | null): Promise<any> {
  const url = `${baseUrl || 'https://api.openai.com/v1'}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey || 'no-key'}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI-compatible HTTP ${response.status}: ${errorBody.slice(0, 200)}`);
  }

  const json = await response.json();
  const rawText = json?.choices?.[0]?.message?.content || '{}';
  return extractJsonFromText(rawText);
}

/**
 * Google Gemini Provider (with model cascade)
 */
async function callGemini(prompt: string, _systemPrompt: string, model: string, apiKey: string): Promise<any> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY не установлен.');
  }

  const ai = new GoogleGenAI({
    apiKey: key,
    httpOptions: { headers: { 'User-Agent': 'mathroots-production' } },
  });

  const models = [model || 'gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const m of models) {
    try {
      const response = await ai.models.generateContent({
        model: m,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      const text = response.text || '{}';
      return extractJsonFromText(text);
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini] Model ${m} failed, trying next cascade...`);
    }
  }

  throw lastError || new Error('Все модели Gemini в каскаде завершились ошибкой.');
}

/**
 * Test Connection helper for Admin Panel
 */
export async function testAiProviderConnection(config: DbAiConfig): Promise<{
  ok: boolean;
  latencyMs: number;
  message: string;
  testResponse?: any;
}> {
  const startTime = Date.now();
  const testPrompt = `Проверочный пинг от администратора системы MathRoots. Ответь ровно в JSON: {"status": "ok", "provider": "${config.provider}", "math": "2+2=4"}`;

  try {
    const res = await callProvider(
      testPrompt,
      'Ты тестовый ИИ-агент. Отвечай только валидным JSON.',
      config
    );
    const latencyMs = Date.now() - startTime;
    return {
      ok: true,
      latencyMs,
      message: `Успешное подключение к ${config.provider} (${config.model}) за ${latencyMs} мс!`,
      testResponse: res,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      ok: false,
      latencyMs,
      message: `Ошибка подключения: ${err.message || String(err)}`,
    };
  }
}
