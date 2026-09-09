import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserAiMode = 'default' | 'custom';
export type UserAiProviderType = 'openrouter' | 'deepseek' | 'gemini' | 'openai' | 'yandex';

export interface UserAiConfig {
  mode: UserAiMode;
  provider: UserAiProviderType;
  apiKey: string;
  model: string;
  baseUrl: string;
  folderId: string;
}

export interface UserProviderPreset {
  provider: UserAiProviderType;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  defaultModel: string;
  models: string[];
  defaultBaseUrl?: string;
  requiresFolderId?: boolean;
  helpLink?: string;
}

export const USER_PROVIDER_PRESETS: UserProviderPreset[] = [
  {
    provider: 'openrouter',
    title: 'OpenRouter',
    badge: 'Единый шлюз',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    description: 'Единый API ко всем мировым моделям: DeepSeek R1, Claude 3.5 Sonnet, GPT-4o, Llama 3.3',
    defaultModel: 'deepseek/deepseek-r1',
    models: [
      'deepseek/deepseek-r1',
      'anthropic/claude-3.5-sonnet',
      'meta-llama/llama-3.3-70b-instruct',
      'google/gemini-2.0-flash-001',
      'qwen/qwen-2.5-72b-instruct',
    ],
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    helpLink: 'https://openrouter.ai/keys',
  },
  {
    provider: 'deepseek',
    title: 'DeepSeek AI',
    badge: 'Математик',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    description: 'Официальный API DeepSeek с мощным математическим рассуждением (Reasoner / Chat)',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultBaseUrl: 'https://api.deepseek.com',
    helpLink: 'https://platform.deepseek.com',
  },
  {
    provider: 'gemini',
    title: 'Google Gemini',
    badge: 'Скорость',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Официальный API Google Gemini с высоким контекстом и быстрой отдачей ответов',
    defaultModel: 'gemini-3.1-flash-lite',
    models: ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest'],
    helpLink: 'https://aistudio.google.com',
  },
  {
    provider: 'openai',
    title: 'OpenAI / Custom Gateway',
    badge: 'Любой Proxy',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Любой OpenAI-совместимый эндпоинт (Groq, vLLM, Ollama, корпоративные прокси и зеркала)',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'llama-3.3-70b-versatile', 'mistral-large-latest'],
    defaultBaseUrl: 'https://api.openai.com/v1',
    helpLink: 'https://platform.openai.com/api-keys',
  },
  {
    provider: 'yandex',
    title: 'Яндекс AI (YandexGPT)',
    badge: 'Россия',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    description: 'Российская языковая модель от Яндекс для образования и школьной программы',
    defaultModel: 'yandexgpt/latest',
    models: ['yandexgpt/latest', 'yandexgpt-lite/latest'],
    requiresFolderId: true,
    helpLink: 'https://cloud.yandex.ru',
  },
];

const STORAGE_KEY = 'mathroots_user_ai_v1';

export const DEFAULT_USER_AI_CONFIG: UserAiConfig = {
  mode: 'default',
  provider: 'openrouter',
  apiKey: '',
  model: 'deepseek/deepseek-r1',
  baseUrl: 'https://openrouter.ai/api/v1',
  folderId: '',
};

export function getStoredUserAiConfig(): UserAiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_USER_AI_CONFIG, ...parsed };
    }
  } catch {}
  return DEFAULT_USER_AI_CONFIG;
}

export function getAiHeaders(): Record<string, string> {
  const config = getStoredUserAiConfig();
  if (config.mode === 'custom' && config.apiKey && config.provider) {
    return {
      'X-Custom-Ai-Provider': config.provider,
      'X-Custom-Ai-Key': config.apiKey,
      'X-Custom-Ai-Model': config.model || '',
      'X-Custom-Ai-Base-Url': config.baseUrl || '',
      'X-Custom-Ai-Folder-Id': config.folderId || '',
    };
  }
  return {};
}

export async function fetchAi(url: string, options: RequestInit = {}): Promise<Response> {
  const aiHeaders = getAiHeaders();
  const headers = {
    'Content-Type': 'application/json',
    ...aiHeaders,
    ...(options.headers || {}),
  };
  return fetch(url, { ...options, headers });
}

interface UserAiContextType {
  config: UserAiConfig;
  updateConfig: (patch: Partial<UserAiConfig>) => void;
  resetToDefault: () => void;
  isCustomActive: boolean;
  activeBadge: string;
}

const UserAiContext = createContext<UserAiContextType>({
  config: DEFAULT_USER_AI_CONFIG,
  updateConfig: () => {},
  resetToDefault: () => {},
  isCustomActive: false,
  activeBadge: 'Серверный AI',
});

export const UserAiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<UserAiConfig>(getStoredUserAiConfig);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (err) {
      console.warn('Failed to persist user AI config:', err);
    }
  }, [config]);

  const updateConfig = (patch: Partial<UserAiConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const resetToDefault = () => {
    setConfig((prev) => ({
      ...prev,
      mode: 'default',
    }));
  };

  const isCustomActive = config.mode === 'custom' && Boolean(config.apiKey.trim());

  let activeBadge = 'Серверный AI';
  if (isCustomActive) {
    const preset = USER_PROVIDER_PRESETS.find((p) => p.provider === config.provider);
    activeBadge = preset ? preset.title : config.provider;
  }

  return (
    <UserAiContext.Provider
      value={{
        config,
        updateConfig,
        resetToDefault,
        isCustomActive,
        activeBadge,
      }}
    >
      {children}
    </UserAiContext.Provider>
  );
};

export const useUserAi = () => useContext(UserAiContext);
