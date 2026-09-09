import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Bot,
  Key,
  Globe,
  Cpu,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
  Zap,
  Send,
  Sliders,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  useUserAi,
  USER_PROVIDER_PRESETS,
  UserAiProviderType,
  UserAiMode,
} from '../context/UserAiContext';

interface UserAiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserAiSettingsModal: React.FC<UserAiSettingsModalProps> = ({ isOpen, onClose }) => {
  const { config, updateConfig, resetToDefault } = useUserAi();

  const [localMode, setLocalMode] = useState<UserAiMode>(config.mode);
  const [localProvider, setLocalProvider] = useState<UserAiProviderType>(config.provider);
  const [localApiKey, setLocalApiKey] = useState(config.apiKey);
  const [localModel, setLocalModel] = useState(config.model);
  const [localBaseUrl, setLocalBaseUrl] = useState(config.baseUrl);
  const [localFolderId, setLocalFolderId] = useState(config.folderId);

  const [showKey, setShowKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Connection Test state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    latencyMs?: number;
    message: string;
  } | null>(null);

  // Interactive Live Chat Test state
  const [chatPrompt, setChatPrompt] = useState('Объясни в одном предложении, почему 2(x + 3) = 2x + 6.');
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [isChatTesting, setIsChatTesting] = useState(false);
  const [chatLatency, setChatLatency] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentPreset = USER_PROVIDER_PRESETS.find((p) => p.provider === localProvider) || USER_PROVIDER_PRESETS[0];

  const handleSelectProvider = (prov: UserAiProviderType) => {
    setLocalProvider(prov);
    const preset = USER_PROVIDER_PRESETS.find((p) => p.provider === prov);
    if (preset) {
      setLocalModel(preset.defaultModel);
      if (preset.defaultBaseUrl) {
        setLocalBaseUrl(preset.defaultBaseUrl);
      }
    }
    setTestResult(null);
    setChatResponse(null);
  };

  const handleSave = () => {
    updateConfig({
      mode: localMode,
      provider: localProvider,
      apiKey: localApiKey.trim(),
      model: localModel.trim() || currentPreset.defaultModel,
      baseUrl: localBaseUrl.trim(),
      folderId: localFolderId.trim(),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleReset = () => {
    resetToDefault();
    setLocalMode('default');
    setTestResult(null);
    setChatResponse(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!localApiKey.trim()) {
      setTestResult({ ok: false, message: 'Введите API-ключ перед проверкой подключения' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/user/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: localProvider,
          api_key: localApiKey.trim(),
          model: localModel.trim() || currentPreset.defaultModel,
          base_url: localBaseUrl.trim() || undefined,
          folder_id: localFolderId.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setTestResult({
          ok: true,
          latencyMs: data.latencyMs,
          message: data.message || `Подключение к ${localProvider} успешно (${data.latencyMs} мс)`,
        });
      } else {
        setTestResult({
          ok: false,
          message: data.message || data.error || 'Не удалось подключиться к провайдеру',
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.message || 'Ошибка сети при обращении к серверу',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendChatTest = async () => {
    if (!chatPrompt.trim()) return;

    setIsChatTesting(true);
    setChatResponse(null);
    setChatLatency(null);

    try {
      const res = await fetch('/api/user/ai/chat-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: chatPrompt.trim() }],
          config:
            localMode === 'custom' && localApiKey.trim()
              ? {
                  provider: localProvider,
                  api_key: localApiKey.trim(),
                  model: localModel.trim() || currentPreset.defaultModel,
                  base_url: localBaseUrl.trim() || undefined,
                  folder_id: localFolderId.trim() || undefined,
                }
              : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setChatResponse(data.reply);
        setChatLatency(data.latencyMs);
      } else {
        setChatResponse(`Ошибка: ${data.error || 'Сбой получения ответа'}`);
      }
    } catch (err: any) {
      setChatResponse(`Ошибка сети: ${err.message}`);
    } finally {
      setIsChatTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn select-none">
      <div className="relative w-full max-w-3xl bg-[#0a0d1a] border border-indigo-500/30 rounded-3xl shadow-2xl shadow-indigo-950/80 overflow-hidden my-6 text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-[#080b15]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Настройки искусственного интеллекта (AI)
                </h3>
                {localMode === 'default' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Серверный AI
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Свой ключ ({localProvider})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Используйте серверную модель по умолчанию или подключите собственный ключ (BYOK)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto text-xs sm:text-sm">
          {/* Mode Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Card 1: Default Server AI */}
            <div
              onClick={() => setLocalMode('default')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                localMode === 'default'
                  ? 'bg-emerald-950/25 border-emerald-500/50 shadow-lg shadow-emerald-950/40'
                  : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                {localMode === 'default' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Выбрано
                  </span>
                )}
              </div>
              <div className="mt-3 font-bold text-white text-sm">Серверный AI (По умолчанию)</div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Центральная модель платформы, настроенная администратором. Не требует ввода ключей, баланса и настроек. Полностью бесплатно и стабильно.
              </p>
            </div>

            {/* Card 2: Custom BYOK */}
            <div
              onClick={() => setLocalMode('custom')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                localMode === 'custom'
                  ? 'bg-purple-950/30 border-purple-500/50 shadow-lg shadow-purple-950/40'
                  : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Key className="w-4 h-4" />
                </div>
                {localMode === 'custom' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Выбрано
                  </span>
                )}
              </div>
              <div className="mt-3 font-bold text-white text-sm">Свой API-ключ (BYOK)</div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Подключите OpenRouter, DeepSeek, Google Gemini, OpenAI или собственный прокси. Ключ хранится только в вашем браузере.
              </p>
            </div>
          </div>

          {/* If Custom Mode Selected: Configuration Form */}
          {localMode === 'custom' && (
            <div className="space-y-5 p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <span>1. Выберите провайдера AI</span>
                </div>
                {currentPreset.helpLink && (
                  <a
                    href={currentPreset.helpLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
                  >
                    <span>Где взять ключ</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Provider Selection Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {USER_PROVIDER_PRESETS.map((preset) => {
                  const isSelected = localProvider === preset.provider;
                  return (
                    <button
                      key={preset.provider}
                      type="button"
                      onClick={() => handleSelectProvider(preset.provider)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all ${
                        isSelected
                          ? 'bg-purple-900/30 border-purple-500/60 shadow-sm'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white truncate">{preset.title}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border inline-block w-fit ${preset.badgeColor}`}>
                        {preset.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] text-slate-400 italic">
                {currentPreset.description}
              </div>

              {/* API Key Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>API-ключ ({currentPreset.title}) *</span>
                  <span className="text-[10px] text-slate-500 font-normal">Хранится локально в браузере</span>
                </label>
                <div className="relative flex items-center">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    placeholder={
                      localProvider === 'openrouter'
                        ? 'sk-or-v1-...'
                        : localProvider === 'deepseek'
                        ? 'sk-...'
                        : localProvider === 'gemini'
                        ? 'AIzaSy...'
                        : 'sk-...'
                    }
                    className="w-full pl-9 pr-10 py-2.5 bg-black/40 border border-white/[0.12] rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 p-1 text-slate-400 hover:text-white"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Model & Base URL Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Model Input & Quick Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Модель (Model ID)</label>
                  <input
                    type="text"
                    value={localModel}
                    onChange={(e) => setLocalModel(e.target.value)}
                    placeholder={currentPreset.defaultModel}
                    className="w-full px-3 py-2 bg-black/40 border border-white/[0.12] rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                  {/* Preset Model Chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {currentPreset.models.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setLocalModel(m)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-colors ${
                          localModel === m
                            ? 'bg-purple-600/40 text-purple-200 border-purple-500/50'
                            : 'bg-white/[0.04] text-slate-400 border-white/[0.06] hover:text-slate-200 hover:bg-white/[0.08]'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Base URL (Proxy / Gateway) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Base URL (Proxy / Шлюз)</span>
                    <span className="text-[10px] text-slate-500">Опционально</span>
                  </label>
                  <input
                    type="text"
                    value={localBaseUrl}
                    onChange={(e) => setLocalBaseUrl(e.target.value)}
                    placeholder={currentPreset.defaultBaseUrl || 'https://api.openai.com/v1'}
                    className="w-full px-3 py-2 bg-black/40 border border-white/[0.12] rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                  <div className="text-[10px] text-slate-500 mt-1">
                    Поддерживает сторонние прокси, корпоративные шлюзы, vLLM и Ollama.
                  </div>
                </div>
              </div>

              {/* If Yandex: Folder ID */}
              {currentPreset.requiresFolderId && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Yandex Cloud Folder ID *</label>
                  <input
                    type="text"
                    value={localFolderId}
                    onChange={(e) => setLocalFolderId(e.target.value)}
                    placeholder="b1g..."
                    className="w-full px-3 py-2 bg-black/40 border border-white/[0.12] rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              {/* Connection Test Button & Feedback */}
              <div className="pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !localApiKey.trim()}
                  className="px-4 py-2 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>{isTesting ? 'Проверка связи...' : 'Проверить подключение'}</span>
                </button>

                {testResult && (
                  <div
                    className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-2 animate-fadeIn ${
                      testResult.ok
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {testResult.ok ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interactive Chat Test Section */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-indigo-400" />
                <span>Быстрый тест ответов модели</span>
              </div>
              {chatLatency !== null && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                  Время ответа: {chatLatency} мс
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendChatTest();
                }}
                placeholder="Задайте математический вопрос..."
                className="flex-1 px-3 py-2 bg-black/40 border border-white/[0.12] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleSendChatTest}
                disabled={isChatTesting || !chatPrompt.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isChatTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Тест</span>
              </button>
            </div>

            {chatResponse && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-slate-200 leading-relaxed font-sans max-h-40 overflow-y-auto whitespace-pre-wrap animate-fadeIn">
                {chatResponse}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#070912] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить на серверный AI</span>
          </button>

          <div className="flex items-center gap-2.5">
            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn">
                <Check className="w-4 h-4" /> Настройки сохранены!
              </span>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 hover:from-emerald-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/50 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Сохранить настройки</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
