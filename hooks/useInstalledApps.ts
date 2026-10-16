import { useCallback, useEffect, useState } from 'react';

import { useAppLockStore } from '../store/useAppLockStore';

import { AppLockBridge } from '../services/AppLockBridge';

import type { InstalledApp } from '../types';



let cachedApps: InstalledApp[] | null = null;

let loadPromise: Promise<InstalledApp[]> | null = null;



async function fetchApps(): Promise<InstalledApp[]> {

  if (cachedApps) return cachedApps;

  if (loadPromise) return loadPromise;

  loadPromise = AppLockBridge.getInstalledApps().then((apps) => {

    cachedApps = apps;

    loadPromise = null;

    return apps;

  });

  return loadPromise;

}



/** Background preload — call once at startup */

export function preloadInstalledApps(): Promise<InstalledApp[]> {

  return fetchApps();

}



export function useInstalledApps() {

  const lockApp = useAppLockStore((s) => s.lockApp);



  const [apps, setApps] = useState<InstalledApp[]>(cachedApps ?? []);

  const [isLoading, setIsLoading] = useState(!cachedApps);

  const [error, setError] = useState<string | null>(null);



  useEffect(() => {

    if (cachedApps) return;

    let cancelled = false;

    fetchApps()

      .then((data) => { if (!cancelled) setApps(data); })

      .catch((e) => { if (!cancelled) setError(e?.message ?? 'Failed'); })

      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };

  }, []);



  const refetch = useCallback(async () => {
    cachedApps = null;
    loadPromise = null;

    setIsLoading(true);

    setError(null);

    try {

      const data = await fetchApps();

      setApps(data);

    } catch (e) {

      setError(e instanceof Error ? e.message : 'Failed');

    } finally {

      setIsLoading(false);

    }

  }, []);



  const toggleLock = useCallback(

    async (packageName: string) => {

      const app = apps.find((a) => a.packageName === packageName);

      if (!app) return;

      const { lockedApps, removeFromLocked } = useAppLockStore.getState();

      if (lockedApps[packageName]) {

        removeFromLocked(packageName);

      } else {

        await lockApp(app);

      }

    },

    [apps, lockApp]

  );



  return { apps, isLoading, error, refetch, toggleLock };

}

