import React, { useState, useEffect } from 'react';
import { api } from '../utils/apiClient';
import {
  Shield,
  X,
  Cpu,
  Database,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Server,
  Activity,
  Layers,
  Flame,
  Check,
  Globe,
  CreditCard,
  Coins,
  Copy,
  ExternalLink,
  Clock,
  Search,
  Key,
  MessageSquare,
  Send,
  Bot,
  User
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  onLoginSuccess?: (user: any) => void;
}

type ProviderType = 'openrouter' | 'deepseek' | 'yandex' | 'gemini' | 'openai';

interface ProviderPreset {
  provider: ProviderType;
  title: string;
  description: string;
  defaultModel: string;
  models: string[];
  requiresFolderId?: boolean;
  defaultBaseUrl?: string;
}

const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    provider: 'openrouter',
    title: 'OpenRouter',
    description: 'Единый шлюз к DeepSeek R1, Claude 3.5, LLaMA 3.3, Qwen',
    defaultModel: 'deepseek/deepseek-r1',
    models: [
      'deepseek/deepseek-r1',
      'anthropic/claude-3.5-sonnet',
      'meta-llama/llama-3.3-70b-instruct',
      'google/gemini-2.0-flash-001',
      'qwen/qwen-2.5-72b-instruct',
    ],
    defaultBaseUrl: 'https://openrouter.ai/api/v1/chat/completions',
  },
  {
    provider: 'deepseek',
    title: 'DeepSeek AI',
    description: 'Официальный API DeepSeek с математическими рассуждениями (Reasoner / V3)',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultBaseUrl: 'https://api.deepseek.com',
  },
  {
    provider: 'yandex',
    title: 'Яндекс AI (YandexGPT)',
    description: 'Российская языковая модель от Яндекс для образования и школьной программы',
    defaultModel: 'yandexgpt/latest',
    models: ['yandexgpt/latest', 'yandexgpt-lite/latest'],
    requiresFolderId: true,
  },
  {
    provider: 'gemini',
    title: 'Google Gemini',
    description: 'Высокоскоростной каскад моделей Google Gemini с поддержкой математики',
    defaultModel: 'gemini-3.1-flash-lite',
    models: ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest'],
  },
  {
    provider: 'openai',
    title: 'OpenAI / Custom Compatible',
    description: 'Любой совместимый OpenAI endpoint (Groq, vLLM, Ollama, Mistral)',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'llama3-70b-8192', 'mistral-large-latest'],
  },
];

export type AdminTab = 'providers' | 'chat_test' | 'cache' | 'system';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  latencyMs?: number;
  provider?: string;
  model?: string;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('providers');

  // Admin login gate state
  const [loginUser, setLoginUser] = useState('admin');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Chat Test State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Привет! Я математический ИИ-ассистент MathRoots. Задайте мне вопрос по формулам, уравнениям или концепциям, чтобы протестировать текущую модель.',
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatUseFormConfig, setChatUseFormConfig] = useState(true);

  // Form state
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('openrouter');
  const [model, setModel] = useState('deepseek/deepseek-r1');
  const [apiKey, setApiKey] = useState('');
  const [folderId, setFolderId] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [temperature, setTemperature] = useState(0.6);
  const [showApiKey, setShowApiKey] = useState(false);

  // Status & lists
  const [activeConfig, setActiveConfig] = useState<any>(null);
  const [allConfigs, setAllConfigs] = useState<any[]>([]);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [recentCache, setRecentCache] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [aiData, cacheData] = await Promise.all([
        api.getAiConfigs().catch(() => ({ active: null, all: [] })),
        api.getAiCacheStats().catch(() => ({ stats: null, recent: [] })),
      ]);

      if (aiData) {
        setActiveConfig(aiData.active);
        setAllConfigs(aiData.all || []);
        if (aiData.active) {
          setSelectedProvider(aiData.active.provider);
          setModel(aiData.active.model);
          setApiKey(aiData.active.api_key || '');
          setFolderId(aiData.active.folder_id || '');
          setBaseUrl(aiData.active.base_url || '');
          setTemperature(aiData.active.temperature ?? 0.6);
        }
      }

      if (cacheData) {
        setCacheStats(cacheData.stats);
        setRecentCache(cacheData.recent || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (prov: ProviderType) => {
    setSelectedProvider(prov);
    const preset = PROVIDER_PRESETS.find((p) => p.provider === prov);
    if (preset) {
      setModel(preset.defaultModel);
      setBaseUrl(preset.defaultBaseUrl || '');
    }
    // If we have an existing config for this provider in allConfigs, prefill key
    const existing = allConfigs.find((c) => c.provider === prov);
    if (existing) {
      setApiKey(existing.api_key || '');
      setFolderId(existing.folder_id || '');
      if (existing.base_url) setBaseUrl(existing.base_url);
    }
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testAiConfig({
        provider: selectedProvider,
        model,
        api_key: apiKey,
        folder_id: folderId,
        base_url: baseUrl,
        temperature,
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || 'Ошибка сети' });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.saveAiConfig({
        provider: selectedProvider,
        model,
        api_key: apiKey,
        folder_id: folderId,
        base_url: baseUrl,
        temperature,
        is_active: true,
      });
      if (res?.config) {
        setActiveConfig(res.config);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        loadData();
      }
    } catch (err: any) {
      alert(`Ошибка сохранения: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('Вы уверены, что хотите очистить весь кэш ответов ИИ? Повторные запросы будут снова обращаться к внешнему API.')) {
      return;
    }
    setLoading(true);
    try {
      await api.clearAiCache();
      alert('Кэш успешно очищен!');
      loadData();
    } catch (err: any) {
      alert(`Ошибка очистки кэша: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Send message in model chat tester
  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = (presetText || chatInput).trim();
    if (!textToSend || chatLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!presetText) setChatInput('');
    setChatLoading(true);

    try {
      const targetConfig = chatUseFormConfig
        ? {
            provider: selectedProvider,
            model,
            api_key: apiKey,
            base_url: baseUrl,
            folder_id: folderId,
            temperature,
          }
        : undefined;

      const historyPayload = [...chatMessages, userMsg]
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.testAiChat(historyPayload, targetConfig);

      if (res?.success) {
        const assistantMsg: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: res.reply,
          timestamp: new Date(),
          latencyMs: res.latencyMs,
          provider: res.provider,
          model: res.model,
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: `❌ Ошибка вызова модели: ${res?.error || 'Неизвестная ошибка'}`,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `❌ Ошибка сети: ${err.message || String(err)}`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await api.login(loginUser, loginPass);
      if (res?.user?.role === 'admin') {
        if (onLoginSuccess) onLoginSuccess(res.user);
        loadData();
      } else {
        setLoginError('Учетная запись не имеет прав администратора (роль: ' + (res?.user?.role || 'user') + ')');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Неверный логин или пароль');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!isOpen) return null;

  // If user is not admin, show direct admin login form
  if (currentUser?.role !== 'admin') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-[#0b0e18] border border-white/[0.12] rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-7 relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Вход в панель администратора</h2>
              <p className="text-xs text-slate-400">Управление провайдерами ИИ и кэшем</p>
            </div>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Логин / Email:</label>
              <input
                type="text"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="admin"
                required
                className="w-full px-3.5 py-2.5 bg-[#070911] border border-white/[0.1] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Пароль администратора:</label>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="SETUP_ON_FIRST_LOGIN"
                required
                className="w-full px-3.5 py-2.5 bg-[#070911] border border-white/[0.1] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Shield className="w-4 h-4" />
              <span>{isLoggingIn ? 'Проверка прав...' : 'Войти в панель управления'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  const currentPreset = PROVIDER_PRESETS.find((p) => p.provider === selectedProvider) || PROVIDER_PRESETS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0e18] border border-white/[0.12] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.08] bg-[#0d101c] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 border border-indigo-400/30 flex items-center justify-center text-white shadow-lg shadow-indigo-600/25 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                  MathRoots Admin Core
                </span>
                {activeConfig && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Активен: {activeConfig.provider} ({activeConfig.model})
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-white">Панель управления администратора</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab buttons */}
            <div className="flex items-center bg-[#060810] p-1 rounded-xl border border-white/[0.08]">
              <button
                onClick={() => setActiveTab('providers')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'providers'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>ИИ Провайдеры</span>
              </button>

              <button
                onClick={() => setActiveTab('chat_test')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'chat_test'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                <span>Чат-тест моделей</span>
              </button>

              <button
                onClick={() => setActiveTab('cache')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'cache'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Кэш и Экономия</span>
              </button>

              <button
                onClick={() => setActiveTab('system')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'system'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>Система</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: AI PROVIDERS CONFIG */}
          {activeTab === 'providers' && (
            <div className="space-y-6">
              {/* Provider Selection Cards */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Выберите ИИ-провайдера для декомпозиции и ответов:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {PROVIDER_PRESETS.map((p) => {
                    const isSelected = selectedProvider === p.provider;
                    const isActiveInDb = activeConfig?.provider === p.provider;
                    return (
                      <button
                        key={p.provider}
                        type="button"
                        onClick={() => handleProviderChange(p.provider)}
                        className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-600/15 border-indigo-500 shadow-md shadow-indigo-600/15'
                            : 'bg-[#070911] border-white/[0.08] hover:border-white/[0.18]'
                        }`}
                      >
                        {isActiveInDb && (
                          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                        )}
                        <div>
                          <div className={`text-xs font-bold ${isSelected ? 'text-indigo-300' : 'text-white'}`}>
                            {p.title}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                            {p.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Settings */}
              <form onSubmit={handleSaveConfig} className="p-5 rounded-2xl bg-[#070911] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Настройка: {currentPreset.title}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {currentPreset.description}
                    </p>
                  </div>

                  {activeConfig?.provider === selectedProvider && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Текущий активный
                    </span>
                  )}
                </div>

                {/* Model selection & presets */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Идентификатор модели (Model):</span>
                    <span className="text-[11px] text-slate-500 font-normal">или введите собственную</span>
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    required
                    placeholder="Например: claude-sonnet-4-6, deepseek-chat или yandexgpt/latest"
                    className="w-full px-3.5 py-2.5 bg-[#0e1222] border border-white/[0.1] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  {/* Preset chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {currentPreset.models.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModel(m)}
                        className={`text-[11px] px-2 py-0.5 rounded-lg border font-mono transition-colors ${
                          model === m
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                            : 'bg-white/[0.04] text-slate-400 hover:text-white border-white/[0.06]'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* API Key Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>API-ключ ({selectedProvider === 'yandex' ? 'Api-Key Yandex' : 'Secret Key / sk-...' }):</span>
                    <span className="text-[11px] text-slate-500">Ключ хранится в зашифрованном виде</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={
                        selectedProvider === 'gemini'
                          ? 'AIzaSy... (или оставьте пустым для переменной окружения)'
                          : 'sk-or-v1-... / AQVN...'
                      }
                      className="w-full pl-3.5 pr-10 py-2.5 bg-[#0e1222] border border-white/[0.1] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Yandex Folder ID if required */}
                {currentPreset.requiresFolderId && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Folder ID (Каталог Yandex Cloud):
                    </label>
                    <input
                      type="text"
                      value={folderId}
                      onChange={(e) => setFolderId(e.target.value)}
                      placeholder="b1g8... (Идентификатор каталога из консоли Yandex Cloud)"
                      required={selectedProvider === 'yandex'}
                      className="w-full px-3.5 py-2.5 bg-[#0e1222] border border-white/[0.1] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                )}

                {/* Custom Base URL (optional) */}
                {(selectedProvider === 'openrouter' || selectedProvider === 'deepseek' || selectedProvider === 'openai') && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Base URL (Опционально):</span>
                      <span className="text-[11px] text-slate-500">По умолчанию: {currentPreset.defaultBaseUrl || 'https://api.openai.com/v1'}</span>
                    </label>
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder={currentPreset.defaultBaseUrl || 'https://api.openai.com/v1'}
                      className="w-full px-3.5 py-2.5 bg-[#0e1222] border border-white/[0.1] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                )}

                {/* Temperature */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>Температура креативности (Temperature):</span>
                    <span className="font-mono text-indigo-400">{temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0.0 (Максимально строго и математично)</span>
                    <span>0.6 (Оптимально)</span>
                    <span>1.0 (Креативно)</span>
                  </div>
                </div>

                {/* Test Result Message Box */}
                {testResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
                      testResult.ok
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {testResult.ok ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    )}
                    <div className="space-y-1">
                      <div className="font-bold">{testResult.message}</div>
                      {testResult.latencyMs && (
                        <div className="text-[11px] opacity-80">
                          Задержка ответа (Roundtrip Latency): {testResult.latencyMs} мс
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testing}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141828] hover:bg-[#1d233c] text-slate-200 hover:text-white border border-white/[0.1] text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <Activity className={`w-3.5 h-3.5 text-indigo-400 ${testing ? 'animate-spin' : ''}`} />
                      <span>{testing ? 'Проверяем связь...' : 'Проверить подключение'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('chat_test')}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Чат-тест модели</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {saveSuccess && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Сохранено!
                      </span>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Сохранить и сделать активным</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB: LIVE INTERACTIVE CHAT TEST */}
          {activeTab === 'chat_test' && (
            <div className="space-y-4 flex flex-col h-[560px]">
              {/* Chat Config Header Bar */}
              <div className="p-3.5 rounded-2xl bg-[#070911] border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>Интерактивный тест модели</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {chatUseFormConfig ? `${selectedProvider} • ${model}` : `${activeConfig?.provider || 'default'} • ${activeConfig?.model || 'gemini'}`}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Отправка реальных запросов к настроенной модели с замером времени ответа
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 text-xs">
                    <input
                      type="checkbox"
                      checked={chatUseFormConfig}
                      onChange={(e) => setChatUseFormConfig(e.target.checked)}
                      className="accent-indigo-500"
                    />
                    <span>Тестировать текущую форму ({selectedProvider})</span>
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setChatMessages([
                        {
                          id: 'welcome',
                          role: 'assistant',
                          content:
                            'Привет! Я математический ИИ-ассистент MathRoots. Задайте мне вопрос по формулам, уравнениям или концепциям, чтобы протестировать текущую модель.',
                          timestamp: new Date(),
                        },
                      ])
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 transition-colors text-[11px]"
                  >
                    Очистить переписку
                  </button>
                </div>
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                <span className="text-slate-500 shrink-0">Быстрые тесты:</span>
                {[
                  'Разложи задачу 2x + 5 = 15 на корни',
                  'Объясни теорему Пифагора простыми словами',
                  'Почему (-3)^2 = 9? Докажи через аксиомы',
                  'Тест связи: назови свою модель и ответь 2+2',
                  'Что такое геометрический смысл производной?',
                ].map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    disabled={chatLoading}
                    onClick={() => handleSendChatMessage(promptText)}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-indigo-500/20 hover:text-indigo-300 hover:border-indigo-500/40 border border-white/[0.06] text-slate-300 whitespace-nowrap transition-all text-[11px]"
                  >
                    {promptText}
                  </button>
                ))}
              </div>

              {/* Chat Message History Window */}
              <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-[#060810] border border-white/[0.08] space-y-3.5 font-sans">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-md shadow-sky-600/20">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-2xl p-3.5 space-y-2 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 rounded-tr-none'
                          : 'bg-[#0f1220] border border-white/[0.08] text-slate-200 rounded-tl-none shadow-lg'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 border-b border-white/[0.08] pb-1">
                        <span className="font-bold">
                          {msg.role === 'user' ? 'Вы (Администратор)' : 'ИИ-ассистент'}
                        </span>
                        <div className="flex items-center gap-2">
                          {msg.latencyMs !== undefined && (
                            <span className="font-mono text-amber-300 font-bold">
                              ⚡ {msg.latencyMs} мс
                            </span>
                          )}
                          {msg.provider && (
                            <span className="font-mono text-indigo-300">
                              [{msg.provider}: {msg.model}]
                            </span>
                          )}
                          {msg.role === 'assistant' && msg.id !== 'welcome' && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(msg.content, msg.id)}
                              className="text-slate-400 hover:text-white"
                              title="Скопировать ответ"
                            >
                              {copiedKey === msg.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="whitespace-pre-wrap font-sans text-xs">
                        {msg.content}
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mt-1">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex gap-3 justify-start animate-in fade-in">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="p-3.5 rounded-2xl rounded-tl-none bg-[#0f1220] border border-white/[0.08] text-xs text-slate-400 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                      <span>Модель генерирует ответ...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Задайте математический вопрос для проверки модели..."
                  disabled={chatLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#070911] border border-white/[0.1] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Отправить</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: AI CACHE & TOKEN SAVER */}
          {activeTab === 'cache' && (
            <div className="space-y-6">
              {/* Token Savings Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-[#070911] border border-white/[0.08]">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Сэкономлено токенов</span>
                  </div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {(cacheStats?.totalTokensSaved || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    ~${(((cacheStats?.totalTokensSaved || 0) / 1000000) * 2.5).toFixed(2)} сбережено
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#070911] border border-white/[0.08]">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase">
                    <Flame className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Хитов из кэша</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {cacheStats?.totalHits || 0}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    запросов отдано за 2 мс
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#070911] border border-white/[0.08]">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Записей в базе</span>
                  </div>
                  <div className="text-2xl font-black text-indigo-300 mt-1">
                    {cacheStats?.totalEntries || 0}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    уникальных задач
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#070911] border border-white/[0.08]">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Эффективность</span>
                  </div>
                  <div className="text-2xl font-black text-cyan-400 mt-1">
                    {cacheStats?.totalEntries > 0
                      ? Math.round(((cacheStats.totalHits - cacheStats.totalEntries) / Math.max(cacheStats.totalHits, 1)) * 100)
                      : 0}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Cache Hit Rate
                  </div>
                </div>
              </div>

              {/* Cache Controller Bar */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#070911] border border-white/[0.08]">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-white">Управление интеллектуальным кэшем</h4>
                  <p className="text-xs text-slate-400">
                    Кэш автоматически сопоставляет формулы и запросы пользователей по SHA-256 хэшу и отдаёт мгновенный ответ
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadData}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                    title="Обновить статистику"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleClearCache}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Очистить весь кэш</span>
                  </button>
                </div>
              </div>

              {/* Recent Cached Queries List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Последние закэшированные задачи и запросы:
                </h4>

                {recentCache.length > 0 ? (
                  <div className="space-y-2">
                    {recentCache.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-[#070911] border border-white/[0.06] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.prompt_type === 'decompose'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : item.prompt_type === 'explain_why'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {item.prompt_type}
                          </span>

                          <div>
                            <div className="font-semibold text-white font-mono">
                              {item.input_summary || item.cache_key.slice(0, 16)}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>Провайдер: {item.provider}</span>
                              <span>•</span>
                              <span>Модель: {item.model}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                            {item.hit_count} хитов
                          </span>
                          <span className="text-slate-400">
                            +~{item.saved_tokens_estimate * item.hit_count} tok
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-[#070911] border border-white/[0.06] text-center text-slate-500 text-xs">
                    В кэше пока нет сохраненных ответов. Как только пользователь решит задачу или запросит декомпозицию, она появится здесь!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM STATUS & ACCESS */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#070911] border border-white/[0.08] space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Учетная запись администратора</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#0c1020] border border-white/[0.06]">
                    <span className="text-slate-400">Логин администратора:</span>
                    <div className="font-bold text-white font-mono text-sm mt-0.5">admin</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0c1020] border border-white/[0.06]">
                    <span className="text-slate-400">Email:</span>
                    <div className="font-bold text-white font-mono text-sm mt-0.5">admin@mathroots.local</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0c1020] border border-white/[0.06]">
                    <span className="text-slate-400">Роль в системе:</span>
                    <div className="font-bold text-emerald-400 font-mono text-sm mt-0.5">admin</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0c1020] border border-white/[0.06]">
                    <span className="text-slate-400">Пароль по умолчанию:</span>
                    <div className="font-bold text-slate-300 font-mono text-sm mt-0.5">SETUP_ON_FIRST_LOGIN</div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#070911] border border-white/[0.08] space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Состояние базы данных и инфраструктуры</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#0c1020] border border-white/[0.06]">
                    <span className="text-slate-400">Режим хранилища:</span>
                    <div className="font-bold text-white mt-0.5">PostgreSQL / In-Memory Resilient</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0c1020] border border-white/[0.06]">
                    <span className="text-slate-400">Docker Контейнеризация:</span>
                    <div className="font-bold text-emerald-400 mt-0.5">Готово (compose v5)</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0c1020] border border-white/[0.06]">
                    <span className="text-slate-400">Защита API:</span>
                    <div className="font-bold text-indigo-400 mt-0.5">Rate Limit + JWT + bcrypt</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
