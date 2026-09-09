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
  // Free public access mode for math.everty.ru: all PRO features are 100% unlocked by default
  const [isPro, setIsPro] = useState<boolean>(true);
  const [plan, setPlan] = useState<LicensePlan>('pro_lifetime');
  const [licenseKey, setLicenseKey] = useState<string | null>(getStoredLicenseKey() || 'PUBLIC_FREE_ACCESS');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('active');
  const [maxActivations, setMaxActivations] = useState<number | undefined>(999999);
  const [activationsCount, setActivationsCount] = useState<number | undefined>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [targetFeature, setTargetFeature] = useState<string | null>(null);

  const refreshLicense = useCallback(async () => {
    // Keep isPro true for unrestricted public usage on math.everty.ru
    setIsPro(true);
    setPlan('pro_lifetime');
    setStatus('active');
    setIsLoading(false);
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
