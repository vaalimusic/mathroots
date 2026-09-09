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
  User,
  Crown,
  Lock,
  Ban
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

export interface ProxyPreset {
  name: string;
  url: string;
  provider: ProviderType;
  description: string;
  defaultModel?: string;
  badge?: string;
  homepage?: string;
}

export const PROXY_PRESETS: ProxyPreset[] = [
  {
    name: 'ProxyAPI (РФ / Без VPN)',
    url: 'https://api.proxyapi.ru/openai/v1',
    provider: 'openai',
    description: 'Прямой доступ к GPT-4o, Claude 3.5, DeepSeek из РФ без VPN. Оплата картами РФ и СБП.',
    defaultModel: 'gpt-4o-mini',
    badge: 'Для РФ / Без VPN',
    homepage: 'https://proxyapi.ru',
  },
  {
    name: 'VseGPT (РФ агрегатор)',
    url: 'https://api.vsegpt.ru/v1',
    provider: 'openai',
    description: 'Единый российский шлюз к 100+ мировым моделям с оплатой в рублях.',
    defaultModel: 'openai/gpt-4o-mini',
    badge: 'Рубли / СБП',
    homepage: 'https://vsegpt.ru',
  },
  {
    name: 'Groq Cloud (Быстрый LPU)',
    url: 'https://api.groq.com/openai/v1',
    provider: 'openai',
    description: 'Сверхбыстрый инференс LLaMA 3.3 и DeepSeek на процессорах LPU от Groq.',
    defaultModel: 'llama-3.3-70b-versatile',
    badge: 'Сверхбыстрый',
    homepage: 'https://console.groq.com',
  },
  {
    name: 'OpenRouter Gateway',
    url: 'https://openrouter.ai/api/v1',
    provider: 'openrouter',
    description: 'Мульти-провайдер с доступом к DeepSeek R1, Claude, GPT, Gemini через один счет.',
    defaultModel: 'deepseek/deepseek-r1',
    badge: 'Мульти-модели',
    homepage: 'https://openrouter.ai',
  },
  {
    name: 'Официальный OpenAI',
    url: 'https://api.openai.com/v1',
    provider: 'openai',
    description: 'Прямое подключение к OpenAI API (требует зарубежную карту и IP без блокировок).',
    defaultModel: 'gpt-4o-mini',
    homepage: 'https://platform.openai.com',
  },
  {
    name: 'DeepSeek Официальный',
    url: 'https://api.deepseek.com',
    provider: 'deepseek',
    description: 'Прямой доступ к официальному API DeepSeek (deepseek-chat и deepseek-reasoner).',
    defaultModel: 'deepseek-chat',
    homepage: 'https://platform.deepseek.com',
  },
  {
    name: 'Ollama (Локальный ПК)',
    url: 'http://localhost:11434/v1',
    provider: 'openai',
    description: 'Запуск открытых нейросетей локально на вашем компьютере без интернета.',
    defaultModel: 'llama3:latest',
    badge: 'Без интернета',
    homepage: 'https://ollama.com',
  },
  {
    name: 'LM Studio (Локально)',
    url: 'http://localhost:1234/v1',
    provider: 'openai',
    description: 'Локальный шлюз нейросетей через приложение LM Studio с OpenAI API форматом.',
    defaultModel: 'local-model',
    badge: 'Локально',
    homepage: 'https://lmstudio.ai',
  },
];

export type AdminTab = 'providers' | 'chat_test' | 'cache' | 'system' | 'licenses';

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
  const [setupConfirmPass, setSetupConfirmPass] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen && currentUser?.role !== 'admin') {
      fetch('/api/admin/setup-status')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && typeof data.needsSetup === 'boolean') {
            setNeedsSetup(data.needsSetup);
          }
        })
        .catch(() => setNeedsSetup(false));
    }
  }, [isOpen, currentUser]);

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

  // License & Monetization State
  const [licenses, setLicenses] = useState<any[]>([]);
  const [licenseStats, setLicenseStats] = useState<any>(null);
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [genPlan, setGenPlan] = useState<'pro_month' | 'pro_year' | 'pro_lifetime' | 'tutor_school'>('pro_year');
  const [genMaxActivations, setGenMaxActivations] = useState(1);
  const [genNotes, setGenNotes] = useState('');
  const [generatedKey, setGeneratedKey] = useState<any>(null);
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null);
  const [copiedCustomerMsg, setCopiedCustomerMsg] = useState(false);
  const [licenseSearch, setLicenseSearch] = useState('');

  const loadLicenses = async () => {
    setLicenseLoading(true);
    try {
      const res = await api.getAdminLicenses();
      if (res?.success) {
        setLicenses(res.keys || []);
        setLicenseStats(res.stats || null);
      }
    } catch (err) {
      console.error('Failed to load licenses:', err);
    } finally {
      setLicenseLoading(false);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.generateAdminLicense({
        plan: genPlan,
        maxActivations: Number(genMaxActivations) || 1,
        notes: genNotes,
      });
      if (res?.success) {
        setGeneratedKey(res.key);
        setGeneratedMessage(res.customerMessage);
        setGenNotes('');
        loadLicenses();
      }
    } catch (err: any) {
      alert('Ошибка генерации ключа: ' + (err.message || String(err)));
    }
  };

  const handleToggleKey = async (code: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'revoked' : 'active';
    try {
      await api.toggleAdminLicense(code, newStatus);
      loadLicenses();
    } catch (err: any) {
      alert('Ошибка изменения статуса: ' + (err.message || String(err)));
    }
  };

  const handleDeleteKey = async (code: string) => {
    if (!confirm(`Вы действительно хотите удалить лицензионный ключ ${code}?`)) return;
    try {
      await api.deleteAdminLicense(code);
      loadLicenses();
    } catch (err: any) {
      alert('Ошибка удаления: ' + (err.message || String(err)));
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      loadLicenses();
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

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPass !== setupConfirmPass) {
      setLoginError('Пароли не совпадают. Проверьте правильность повторного ввода.');
      return;
    }
    if (loginPass.length < 6) {
      setLoginError('Пароль должен содержать минимум 6 символов');
      return;
    }
    setIsSettingUp(true);
    setLoginError(null);
    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: loginUser.trim() || 'admin',
          password: loginPass,
        }),
      });
      const res = await response.json();
      if (res?.token && res?.user) {
        localStorage.setItem('mathroots_token', res.token);
        if (onLoginSuccess) onLoginSuccess(res.user);
        setNeedsSetup(false);
        loadData();
      } else {
        setLoginError(res?.error || 'Не удалось завершить настройку администратора');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Ошибка связи с сервером при настройке');
    } finally {
      setIsSettingUp(false);
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

  // If user is not admin, show setup or login form
  if (currentUser?.role !== 'admin') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
        <div className="bg-[#0b0e18] border border-white/[0.12] rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-7 relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {needsSetup ? (
            /* First-Time Master Setup Form */
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Первоначальная настройка</h2>
                  <p className="text-xs text-slate-400">Создайте пароль администратора платформы</p>
                </div>
              </div>

              <div className="mb-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-slate-300 text-xs leading-relaxed">
                Вы вошли в систему впервые. Задайте логин и надёжный мастер-пароль для доступа к управлению AI-моделями и кэшем.
              </div>

              <form onSubmit={handleAdminSetup} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Логин администратора:</label>
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
                  <label className="text-xs font-semibold text-slate-300">Новый мастер-пароль (минимум 6 символов):</label>
                  <input
                    type="password"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2.5 bg-[#070911] border border-white/[0.1] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Повторите мастер-пароль:</label>
                  <input
                    type="password"
                    value={setupConfirmPass}
                    onChange={(e) => setSetupConfirmPass(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
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
                  disabled={isSettingUp}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Shield className="w-4 h-4" />
                  <span>{isSettingUp ? 'Создание учетной записи...' : 'Создать администратора и войти'}</span>
                </button>
              </form>
            </div>
          ) : (
            /* Standard Admin Login Form */
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Вход в панель администратора</h2>
                  <p className="text-xs text-slate-400">Управление провайдерами ИИ и платформой</p>
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
                    placeholder="••••••••"
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
          )}
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

              <button
                onClick={() => setActiveTab('licenses')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'licenses'
                    ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md'
                    : 'text-amber-400 hover:text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>Лицензии PRO</span>
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

                {/* Base URL, Proxies & Mirrors Hub */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Base URL (API Endpoint / Прокси / Зеркало):</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {baseUrl && (
                        <button
                          type="button"
                          onClick={() => setBaseUrl('')}
                          className="text-[10px] text-slate-400 hover:text-rose-300 underline transition-colors"
                        >
                          Сбросить к умолчанию
                        </button>
                      )}
                      <span className="text-[11px] text-slate-500 font-mono">
                        По умолчанию: {currentPreset.defaultBaseUrl || 'https://api.openai.com/v1'}
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder={currentPreset.defaultBaseUrl || 'https://api.openai.com/v1'}
                      className="w-full px-3.5 py-2.5 bg-[#0e1222] border border-white/[0.1] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  {/* Preset Proxy Chips */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-amber-400" />
                        Быстрые пресеты прокси и API-шлюзов:
                      </span>
                      <span className="text-[10px] text-slate-500">Кликните для авто-заполнения</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {PROXY_PRESETS.map((preset) => {
                        const isSelected = baseUrl.trim().replace(/\/+$/, '') === preset.url.replace(/\/+$/, '');
                        return (
                          <div
                            key={preset.name}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'bg-indigo-600/20 border-indigo-500/50 shadow-sm shadow-indigo-500/20'
                                : 'bg-black/30 hover:bg-white/[0.04] border-white/[0.06]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProvider(preset.provider);
                                  setBaseUrl(preset.url);
                                  if (preset.defaultModel) {
                                    setModel(preset.defaultModel);
                                  }
                                }}
                                className="font-semibold text-xs text-white hover:text-indigo-300 transition-colors text-left flex items-center gap-1.5 flex-1"
                              >
                                <span>{preset.name}</span>
                                {preset.badge && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    {preset.badge}
                                  </span>
                                )}
                              </button>

                              {preset.homepage && (
                                <a
                                  href={preset.homepage}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-400 hover:text-emerald-400 p-0.5"
                                  title={`Перейти на сайт ${preset.name}`}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProvider(preset.provider);
                                setBaseUrl(preset.url);
                                if (preset.defaultModel) {
                                  setModel(preset.defaultModel);
                                }
                              }}
                              className="w-full text-left"
                            >
                              <div className="text-[10px] text-slate-400 line-clamp-1 mb-1 font-sans">
                                {preset.description}
                              </div>
                              <div className="text-[10px] text-emerald-400/90 font-mono truncate">
                                {preset.url}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Friendly Helper Guide */}
                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs space-y-1.5 text-slate-300">
                    <div className="font-bold text-white text-[11px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Что делать, если официальный OpenAI не работает (403 Forbidden / Блокировка)?</span>
                    </div>
                    <ol className="list-decimal list-inside text-[11px] space-y-1 text-slate-300">
                      <li>
                        Выберите провайдера <strong>OpenAI / Custom Compatible</strong>.
                      </li>
                      <li>
                        Кликните по пресету <strong>ProxyAPI (РФ / Без VPN)</strong> или <strong>VseGPT</strong> (или вставьте адрес вашего личного прокси / Cloudflare Worker).
                      </li>
                      <li>
                        Вставьте API-ключ, выданный вашим прокси-сервисом, в поле ключа выше.
                      </li>
                      <li>
                        Нажмите кнопку <strong>«Чат-тест модели»</strong> ниже — система мгновенно проверит ответ через прокси!
                      </li>
                    </ol>
                  </div>
                </div>

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
                    <span className="text-slate-400">Статус пароля:</span>
                    <div className="font-bold text-emerald-400 font-mono text-sm mt-0.5">Установлен администратором</div>
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

          {/* TAB 4: LICENSES & MONETIZATION */}
          {activeTab === 'licenses' && (
            <div className="space-y-6">
              {/* Revenue & Key Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-[#070911] border border-white/[0.08]">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Всего ключей</span>
                  </div>
                  <div className="text-xl font-black text-white mt-1">
                    {licenseStats?.totalKeys || licenses.length}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#070911] border border-white/[0.08]">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Активных лицензий</span>
                  </div>
                  <div className="text-xl font-black text-emerald-400 mt-1">
                    {licenseStats?.activeKeys || licenses.filter((k) => k.status === 'active').length}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#070911] border border-white/[0.08]">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    <span>Всего активаций</span>
                  </div>
                  <div className="text-xl font-black text-amber-400 mt-1">
                    {licenseStats?.totalActivations || licenses.reduce((sum, k) => sum + (k.activations_count || 0), 0)}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500/10 to-indigo-600/10 border border-amber-500/30">
                  <div className="text-[11px] text-amber-300 flex items-center gap-1.5 font-semibold">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Оценочный доход</span>
                  </div>
                  <div className="text-xl font-black text-white mt-1">
                    {(
                      (licenseStats?.byPlan?.pro_month || 0) * 490 +
                      (licenseStats?.byPlan?.pro_year || 0) * 2490 +
                      (licenseStats?.byPlan?.pro_lifetime || 0) * 4990 +
                      (licenseStats?.byPlan?.tutor_school || 0) * 7990
                    ).toLocaleString('ru-RU')}{' '}
                    ₽
                  </div>
                </div>
              </div>

              {/* Generator Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#070911] border border-indigo-500/30 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                      <Crown className="w-4 h-4 text-amber-200" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Генератор лицензионных ключей PRO</h3>
                      <p className="text-xs text-slate-400">
                        Создайте ключ для покупателя и отправьте ему в 1 клик
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleGenerateKey} className="space-y-4">
                  {/* Plan Selection Buttons */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Выберите тарифный план:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'pro_month', name: 'PRO Месяц (490 ₽)', desc: '30 дней' },
                        { id: 'pro_year', name: 'PRO Год (2 490 ₽)', desc: '365 дней • ХИТ', highlight: true },
                        { id: 'pro_lifetime', name: 'PRO Навсегда (4 990 ₽)', desc: 'Бессрочно' },
                        { id: 'tutor_school', name: 'Школа / Репетитор (7 990 ₽)', desc: '25 мест' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setGenPlan(p.id as any);
                            if (p.id === 'tutor_school') setGenMaxActivations(25);
                            else setGenMaxActivations(1);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all relative ${
                            genPlan === p.id
                              ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-lg shadow-indigo-950/50'
                              : 'bg-[#0c1020] border-white/[0.08] text-slate-300 hover:border-white/[0.2]'
                          }`}
                        >
                          <div className="text-xs font-bold">{p.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">Лимит активаций:</label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={genMaxActivations}
                        onChange={(e) => setGenMaxActivations(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 bg-[#0c1020] border border-white/[0.1] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Кому выдан / Примечание:
                      </label>
                      <input
                        type="text"
                        placeholder="Например: СБП перевод от Иванова И., @telegram_user"
                        value={genNotes}
                        onChange={(e) => setGenNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0c1020] border border-white/[0.1] rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Сгенерировать лицензионный ключ</span>
                  </button>
                </form>

                {/* Generated Key Presentation Box */}
                {generatedKey && (
                  <div className="p-4 rounded-xl bg-[#0c1020] border-2 border-emerald-500/50 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Ключ успешно создан!
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {generatedKey.expires_at ? `До: ${new Date(generatedKey.expires_at).toLocaleDateString('ru-RU')}` : 'Бессрочно'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 bg-black/60 rounded-xl border border-emerald-500/30 text-white font-mono text-sm tracking-wider font-bold">
                        {generatedKey.key_code}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedKey.key_code);
                          setCopiedKey(generatedKey.key_code);
                          setTimeout(() => setCopiedKey(null), 2000);
                        }}
                        className="px-3.5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                      >
                        {copiedKey === generatedKey.key_code ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedKey === generatedKey.key_code ? 'Скопирован!' : 'Копировать'}</span>
                      </button>
                    </div>

                    {generatedMessage && (
                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-400">Готовое приветственное сообщение для покупателя:</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedMessage);
                            setCopiedCustomerMsg(true);
                            setTimeout(() => setCopiedCustomerMsg(false), 2500);
                          }}
                          className="text-xs text-amber-300 hover:text-amber-200 hover:underline flex items-center gap-1 font-semibold"
                        >
                          {copiedCustomerMsg ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCustomerMsg ? 'Сообщение скопировано!' : 'Скопировать текст клиенту'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* License Registry & Table */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#070911] border border-white/[0.08] space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Key className="w-4 h-4 text-indigo-400" />
                      <span>Реестр лицензий ({licenses.length})</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Управление активными, истекшими и заблокированными ключами
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Поиск по ключу или заметке..."
                        value={licenseFilter}
                        onChange={(e) => setLicenseFilter(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-[#0c1020] border border-white/[0.1] rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={loadLicenses}
                      disabled={licenseLoading}
                      className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors shrink-0"
                      title="Обновить список"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${licenseLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-slate-400 font-semibold">
                        <th className="py-2.5 px-3">Код ключа</th>
                        <th className="py-2.5 px-3">Тариф</th>
                        <th className="py-2.5 px-3">Статус</th>
                        <th className="py-2.5 px-3">Активаций</th>
                        <th className="py-2.5 px-3">Истекает</th>
                        <th className="py-2.5 px-3">Примечание</th>
                        <th className="py-2.5 px-3 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {licenses
                        .filter(
                          (k) =>
                            !licenseFilter ||
                            k.key_code.toLowerCase().includes(licenseFilter.toLowerCase()) ||
                            (k.notes && k.notes.toLowerCase().includes(licenseFilter.toLowerCase()))
                        )
                        .map((k) => (
                          <tr key={k.id || k.key_code} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-white">
                              {k.key_code}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  k.plan === 'pro_lifetime'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : k.plan === 'pro_year'
                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                    : k.plan === 'tutor_school'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                                }`}
                              >
                                {k.plan}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  k.status === 'active'
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : k.status === 'revoked'
                                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                    : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                                }`}
                              >
                                {k.status === 'active' ? 'Активен' : k.status === 'revoked' ? 'Заблокирован' : 'Истек'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-300">
                              {k.activations_count || 0} / {k.max_activations || 1}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                              {k.expires_at ? new Date(k.expires_at).toLocaleDateString('ru-RU') : 'Бессрочно'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate" title={k.notes || ''}>
                              {k.notes || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(k.key_code);
                                    setCopiedKey(k.key_code);
                                    setTimeout(() => setCopiedKey(null), 2000);
                                  }}
                                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors"
                                  title="Копировать ключ"
                                >
                                  {copiedKey === k.key_code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleKey(k.key_code, k.status)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    k.status === 'active'
                                      ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                                  }`}
                                  title={k.status === 'active' ? 'Заблокировать ключ' : 'Разблокировать ключ'}
                                >
                                  {k.status === 'active' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteKey(k.key_code)}
                                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                                  title="Удалить ключ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                      {licenses.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500">
                            Ключи еще не созданы. Используйте генератор выше, чтобы выпустить первый ключ.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
