'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getPendingAttendances, removePendingAttendance } from '@/lib/offline-db';
import { syncOfflineAbsencesAction } from '@/app/(modules)/absences/actions';

export default function OfflineSyncManager() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const checkPending = useCallback(async () => {
    try {
      const items = await getPendingAttendances();
      setPendingCount(items.length);
    } catch {
      // ignore
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    try {
      const pendingBatches = await getPendingAttendances();
      if (pendingBatches.length === 0) return;

      setIsSyncing(true);
      const res = await syncOfflineAbsencesAction(pendingBatches);

      if (res.success && res.processedBatchIds) {
        for (const id of res.processedBatchIds) {
          await removePendingAttendance(id);
        }
        await checkPending();
        setSyncSuccessMsg(res.message);
        setTimeout(() => setSyncSuccessMsg(null), 5000);
      }
    } catch (err) {
      console.warn('[Sync] Sync failed, will retry later:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, checkPending]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    checkPending();

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      checkPending();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodically check if there's pending batches
    const interval = setInterval(() => {
      checkPending();
      if (navigator.onLine && pendingCount > 0) {
        triggerSync();
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkPending, triggerSync, pendingCount]);

  if (isOnline && pendingCount === 0 && !syncSuccessMsg && !isSyncing) {
    return null;
  }

  return (
    <div className="fixed bottom-16 md:bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 max-w-sm transition-all duration-300">
      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white px-4 py-3 rounded-2xl shadow-lg shadow-amber-600/20 flex items-center justify-between text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
            <div>
              <p className="font-semibold">Mode hors ligne actif</p>
              <p className="text-[11px] text-amber-100">
                {pendingCount > 0
                  ? `${pendingCount} feuille(s) en attente dans IndexedDB`
                  : 'Saisie locale opérationnelle'}
              </p>
            </div>
          </div>
          <span className="bg-amber-700/60 px-2 py-1 rounded-md text-[10px] font-mono uppercase">Offline</span>
        </div>
      )}

      {/* Syncing banner */}
      {isSyncing && (
        <div className="bg-[#03c9d7] text-white px-4 py-3 rounded-2xl shadow-lg shadow-cyan-500/20 flex items-center gap-3 text-xs sm:text-sm font-medium">
          <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
          <span>Synchronisation des présences hors ligne...</span>
        </div>
      )}

      {/* Sync success banner */}
      {syncSuccessMsg && !isSyncing && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-between text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
            <span>{syncSuccessMsg}</span>
          </div>
          <button onClick={() => setSyncSuccessMsg(null)} className="text-emerald-200 hover:text-white text-xs ml-2">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
