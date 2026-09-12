import { useState, useEffect, useCallback } from 'react';
import { nativeBridge } from '../native/NativeBridge';
import { filterEngine } from '../services/FilterEngineService';
import { useAppState } from '../context/AppContext';
import { getAllKeywords } from '../services/DatabaseService';

export function useAccessibilityService() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const enabled = await nativeBridge.isAccessibilityServiceEnabled();
      setIsEnabled(enabled);
    } catch {
      setIsEnabled(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const openSettings = useCallback(async () => {
    await nativeBridge.openAccessibilitySettings();
  }, []);

  return { isEnabled, isChecking, checkStatus, openSettings };
}

export function useFilterStats() {
  const { state } = useAppState();
  const [todayCount, setTodayCount] = useState(state.filteredToday);

  useEffect(() => {
    filterEngine.getFilteredCountToday().then(setTodayCount);

    const unsubscribe = filterEngine.onFiltered(() => {
      setTodayCount(prev => prev + 1);
    });

    return unsubscribe;
  }, []);

  return { todayCount };
}

export function useKeywords() {
  const [keywords, setKeywords] = useState<Array<{ id: string; keyword: string; isActive: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadKeywords();
  }, []);

  const loadKeywords = useCallback(async () => {
    try {
      const dbKeywords = await getAllKeywords();
      setKeywords(dbKeywords);
    } catch {
      setKeywords([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { keywords, isLoading, reload: loadKeywords };
}

export function useFilterStatus() {
  const [status, setStatus] = useState<'active' | 'inactive' | 'error'>('inactive');
  const { isEnabled } = useAccessibilityService();

  useEffect(() => {
    if (isEnabled && filterEngine.isActive()) {
      setStatus('active');
    } else if (isEnabled) {
      setStatus('inactive');
    } else {
      setStatus('inactive');
    }
  }, [isEnabled]);

  return status;
}