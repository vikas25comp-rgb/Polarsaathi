import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, Database } from 'lucide-react';
import { dataStore } from '../../lib/dataStore';
import { isSupabaseConfigured, getSupabaseConfig } from '../../lib/supabase';

export const ConnectionBadge: React.FC = () => {
  const [isConnected, setIsConnected] = useState(dataStore.isConnected());
  const [isForcedOffline, setIsForcedOffline] = useState(dataStore.isForcedOffline());
  const [pendingCount, setPendingCount] = useState(dataStore.getPendingSyncCount());
  const [isSyncing, setIsSyncing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; syncedCount: number; errors: string[] } | null>(null);

  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setIsConnected(dataStore.isConnected());
      setIsForcedOffline(dataStore.isForcedOffline());
      setPendingCount(dataStore.getPendingSyncCount());
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await dataStore.processSyncQueue();
      setSyncResult(res);
    } catch (e: any) {
      setSyncResult({ success: false, syncedCount: 0, errors: [e.message || 'Sync failed'] });
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleForcedOffline = () => {
    const next = !isForcedOffline;
    dataStore.setForcedOffline(next);
  };

  const queue = dataStore.getSyncQueue();
  const supabaseCfg = getSupabaseConfig();

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium transition-all border ${
          isConnected
            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
            : 'bg-amber-950/70 text-amber-300 border-amber-500/50 hover:bg-amber-900/70 animate-pulse'
        }`}
        title="Click to view connection & sync details"
      >
        {isConnected ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span className="flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Online</span>
            </span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            <span className="flex items-center gap-1">
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Offline ({pendingCount} queued)</span>
            </span>
          </>
        )}
      </button>

      {/* Sync Management Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-semibold text-slate-100">Polar Connection & Offline Sync Manager</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* Connection Status Box */}
              <div className={`p-3.5 rounded-lg border flex items-center justify-between ${
                isConnected
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                  : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
              }`}>
                <div className="flex items-center gap-3">
                  {isConnected ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-semibold text-sm">
                      {isConnected ? '🟢 System is Online' : '🟠 Offline Mode Active'}
                    </h4>
                    <p className="text-slate-300 mt-0.5">
                      {isConnected
                        ? 'Operational records synchronize with Supabase cloud database.'
                        : 'Operating in local polar cached mode. All actions enter the offline queue.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Simulation Toggle for Acceptance Test 8 */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200">Simulate Polar Loss of Signal (Offline)</span>
                  <p className="text-[11px] text-slate-400">
                    Use this switch to test Acceptance Test 8 offline queuing without disconnecting your internet.
                  </p>
                </div>
                <button
                  onClick={toggleForcedOffline}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                    isForcedOffline
                      ? 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isForcedOffline ? 'Restore Connection' : 'Disconnect'}
                </button>
              </div>

              {/* Supabase Status */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Database Engine:</span>
                  <span className="text-cyan-400 font-semibold">Supabase PostgreSQL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Supabase Connection:</span>
                  <span className={supabaseCfg.isConfigured ? 'text-emerald-400' : 'text-amber-400'}>
                    {supabaseCfg.isConfigured ? 'Configured & Active' : 'Fallback / Local Cache (No keys in env)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pending Sync Queue:</span>
                  <span className="text-amber-400 font-bold">{pendingCount} operation(s) pending</span>
                </div>
              </div>

              {/* Sync Actions & Log */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Pending Synchronization Queue ({queue.length})</span>
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing || !isConnected || pendingCount === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:pointer-events-none text-white rounded font-medium text-xs shadow"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Replaying Changes...' : 'Sync Now'}</span>
                  </button>
                </div>

                {syncResult && (
                  <div className={`p-2.5 rounded text-xs border ${
                    syncResult.success ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' : 'bg-red-950/40 border-red-500/30 text-red-200'
                  }`}>
                    {syncResult.success
                      ? `Successfully synchronized ${syncResult.syncedCount} queued change(s) with Supabase.`
                      : `Sync notice: ${syncResult.errors.join('; ')}`}
                  </div>
                )}

                <div className="max-h-36 overflow-y-auto bg-slate-950 p-2 rounded border border-slate-800 space-y-1 font-mono text-[10px]">
                  {queue.length > 0 ? (
                    queue.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-slate-300 py-0.5 border-b border-slate-900/60 last:border-0">
                        <span>
                          <span className={`px-1 py-0.2 rounded text-[9px] mr-1.5 font-bold ${
                            item.action === 'INSERT' ? 'bg-emerald-950 text-emerald-400' :
                            item.action === 'UPDATE' ? 'bg-cyan-950 text-cyan-400' : 'bg-red-950 text-red-400'
                          }`}>
                            {item.action}
                          </span>
                          {item.table} ({item.recordId})
                        </span>
                        <span className={`font-semibold capitalize ${
                          item.status === 'pending' ? 'text-amber-400' :
                          item.status === 'syncing' ? 'text-cyan-400' : 'text-emerald-400'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-500 py-3">Offline queue is empty. All local records are synchronized.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
