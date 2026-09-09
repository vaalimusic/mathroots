import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getStoredLicenseKey, setStoredLicenseKey, clearStoredLicenseKey } from '../utils/apiClient';

export type LicensePlan = 'free' | 'pro_month' | 'pro_year' | 'pro_lifetime' | 'tutor_school';

export interface LicenseState {
  isPro: boolean;
  plan: LicensePlan;
  licenseKey: string | null;
  expiresAt: string | null;
  status: string;
  maxActivations?: number;
  activationsCount?: number;
  isLoading: boolean;
  isUpgradeModalOpen: boolean;
  openUpgradeModal: (featureName?: string) => void;
  closeUpgradeModal: () => void;
  targetFeature: string | null;
  activateKey: (key: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  removeLicense: () => void;
  refreshLicense: () => Promise<void>;
}

const LicenseContext = createContext<LicenseState | null>(null);

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPro, setIsPro] = useState<boolean>(false);
  const [plan, setPlan] = useState<LicensePlan>('free');
  const [licenseKey, setLicenseKey] = useState<string | null>(getStoredLicenseKey());
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('unlicensed');
  const [maxActivations, setMaxActivations] = useState<number | undefined>();
  const [activationsCount, setActivationsCount] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [targetFeature, setTargetFeature] = useState<string | null>(null);

  const refreshLicense = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedKey = getStoredLicenseKey();
      if (!storedKey) {
        setIsPro(false);
        setPlan('free');
        setStatus('unlicensed');
        setExpiresAt(null);
        setIsLoading(false);
        return;
      }

      const res = await api.getLicenseStatus();
      if (res && res.isPro) {
        setIsPro(true);
        setPlan((res.plan as LicensePlan) || 'pro_year');
        setLicenseKey(res.keyCode || storedKey);
        setExpiresAt(res.expiresAt || null);
        setStatus(res.status || 'active');
        setMaxActivations(res.maxActivations);
        setActivationsCount(res.activationsCount);
      } else {
        setIsPro(false);
        setPlan('free');
        setStatus(res?.status || 'invalid');
      }
    } catch {
      // Offline fallback: if previously had a stored key, retain soft pro mode
      const storedKey = getStoredLicenseKey();
      if (storedKey && storedKey.startsWith('MR-')) {
        setIsPro(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLicense();
  }, [refreshLicense]);

  const openUpgradeModal = useCallback((featureName?: string) => {
    setTargetFeature(featureName || null);
    setIsUpgradeModalOpen(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setIsUpgradeModalOpen(false);
    setTargetFeature(null);
  }, []);

  const activateKey = useCallback(async (key: string) => {
    try {
      const trimmed = key.trim().toUpperCase();
      if (!trimmed) {
        return { success: false, error: 'Введите лицензионный ключ' };
      }

      const res = await api.activateLicense(trimmed);
      if (res && res.success) {
        setStoredLicenseKey(trimmed);
        setLicenseKey(trimmed);
        setIsPro(true);
        setPlan((res.plan as LicensePlan) || 'pro_year');
        setExpiresAt(res.expiresAt || null);
        setStatus('active');
        setMaxActivations(res.maxActivations);
        setActivationsCount(res.activationsCount);
        return {
          success: true,
          message: `Лицензия «${res.plan}» успешно активирована!`,
        };
      } else {
        return {
          success: false,
          error: res?.error || 'Не удалось активировать лицензию',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Сетевая ошибка при активации ключа',
      };
    }
  }, []);

  const removeLicense = useCallback(() => {
    clearStoredLicenseKey();
    setLicenseKey(null);
    setIsPro(false);
    setPlan('free');
    setExpiresAt(null);
    setStatus('unlicensed');
  }, []);

  return (
    <LicenseContext.Provider
      value={{
        isPro,
        plan,
        licenseKey,
        expiresAt,
        status,
        maxActivations,
        activationsCount,
        isLoading,
        isUpgradeModalOpen,
        openUpgradeModal,
        closeUpgradeModal,
        targetFeature,
        activateKey,
        removeLicense,
        refreshLicense,
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = (): LicenseState => {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
};
