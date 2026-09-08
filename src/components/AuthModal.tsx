import React, { useState, useEffect } from 'react';
import { X, User, LogIn, UserPlus, Shield, Award, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { api, getAuthToken, clearAuthToken } from '../utils/apiClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserChange?: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onUserChange }) => {
  const [mode, setMode] = useState<'profile' | 'login' | 'register'>('profile');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'self_learner'>('student');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      api.initSession().then((session) => {
        if (session?.user) {
          setCurrentUser(session.user);
          setDisplayName(session.user.display_name || '');
          if (session.user.is_anonymous) {
            setMode('register');
          } else {
            setMode('profile');
          }
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      if (res?.user) {
        setCurrentUser(res.user);
        onUserChange?.(res.user);
        setMode('profile');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.register(email, password, displayName || 'Ученик');
      if (res?.user) {
        setCurrentUser(res.user);
        onUserChange?.(res.user);
        setMode('profile');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    clearAuthToken();
    const guest = await api.initSession();
    if (guest?.user) {
      setCurrentUser(guest.user);
      onUserChange?.(guest.user);
      setMode('register');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0c0f1d] border border-white/[0.1] rounded-3xl shadow-2xl p-6 text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile View */}
        {mode === 'profile' && currentUser && !currentUser.is_anonymous && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{currentUser.display_name}</h3>
                <p className="text-xs text-slate-400">{currentUser.email}</p>
                <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">
                  <Shield className="w-3 h-3" />
                  {currentUser.role === 'teacher' ? 'Преподаватель' : currentUser.role === 'self_learner' ? 'Самообучение' : 'Ученик'}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span>Синхронизация прогресса</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> В облаке
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>База данных</span>
                <span className="text-slate-400">PostgreSQL (MathRoots)</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.1] hover:bg-white/[0.05] text-slate-300 font-semibold text-xs transition-colors"
              >
                Выйти из аккаунта
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-lg shadow-indigo-950"
              >
                Продолжить обучение
              </button>
            </div>
          </div>
        )}

        {/* Register or Guest Conversion View */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                {currentUser?.is_anonymous ? 'Сохраните свой прогресс в облаке' : 'Создание аккаунта'}
              </div>
              <h3 className="text-xl font-extrabold text-white">Регистрация в MathRoots</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Прогресс освоения и созданные деревья задач сохранятся на всех устройствах.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Имя или псевдоним</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Например: Александр"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#131728] border border-white/[0.1] text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#131728] border border-white/[0.1] text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Пароль</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#131728] border border-white/[0.1] text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Кто вы?</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'student', label: 'Ученик' },
                  { id: 'teacher', label: 'Учитель' },
                  { id: 'self_learner', label: 'IT / Вуз' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id as any)}
                    className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition-colors ${
                      role === item.id
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950'
                        : 'bg-white/[0.04] text-slate-400 border-white/[0.06] hover:bg-white/[0.08]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-950 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isLoading ? 'Сохранение...' : 'Создать профиль'}</span>
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Уже есть аккаунт? Войти
              </button>
            </div>
          </form>
        )}

        {/* Login View */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <h3 className="text-xl font-extrabold text-white">Вход в MathRoots</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Войдите для синхронизации вашей карты знаний.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#131728] border border-white/[0.1] text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Пароль</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#131728] border border-white/[0.1] text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-950 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Вход...' : 'Войти'}</span>
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Нет аккаунта? Зарегистрироваться
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
