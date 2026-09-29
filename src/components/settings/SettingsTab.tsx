import React, { useState } from 'react';
import {
  Settings,
  Database,
  Copy,
  Check,
  Trash2,
  RotateCcw,
  Shield,
  Key,
  Clock,
  Layers,
  FileCode,
  AlertTriangle,
} from 'lucide-react';
import { dataStore } from '../../lib/dataStore';
import { getSupabaseConfig } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const SettingsTab: React.FC = () => {
  const { user, switchRole, availableRoles } = useAuth();
  const [copiedSql, setCopiedSql] = useState(false);
  const [auditLogs, setAuditLogs] = useState(dataStore.getAuditLogs());
  const [seedClearedNotice, setSeedClearedNotice] = useState(false);

  const supabaseCfg = getSupabaseConfig();

  const handleCopySql = () => {
    // Quick SQL snippet pointer
    const sqlText = `-- POLAR-SATHI: Run supabase/schema.sql in your Supabase SQL Editor
-- Found at /supabase/schema.sql in this project.
-- Contains tables for: stations, expeditions, containers, cargo, inventory, personnel, assets, emergencies, audit_logs.`;
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleClearDemoSeed = () => {
    if (confirm('Are you sure you want to remove demonstration seed data? Real user-created records will be preserved.')) {
      dataStore.clearDemoSeedData();
      setAuditLogs(dataStore.getAuditLogs());
      setSeedClearedNotice(true);
      setTimeout(() => setSeedClearedNotice(false), 3000);
    }
  };

  const handleResetToSeed = () => {
    if (confirm('Reset entire application database to initial factory demonstration state?')) {
      dataStore.resetAllToSeedData();
      setAuditLogs(dataStore.getAuditLogs());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <span>System Settings &amp; Supabase Database Configuration</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          PostgreSQL database persistence, security controls, audit logs, and demonstration data lifecycle.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supabase PostgreSQL Configuration Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Supabase PostgreSQL Integration</span>
            </h3>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                supabaseCfg.isConfigured
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {supabaseCfg.isConfigured ? 'CONNECTED' : 'LOCAL CACHE / FALLBACK'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Project Endpoint</span>
              <span className="text-slate-200 truncate block mt-0.5">
                {supabaseCfg.url || 'Not configured in .env (Using client-side offline storage)'}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Anonymous API Key</span>
              <span className="text-slate-200 truncate block mt-0.5">
                {supabaseCfg.anonKey || 'Not configured'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <FileCode className="w-4 h-4" />
              <span>Database Migration SQL</span>
            </div>
            <p className="text-[11px] text-slate-400">
              The project includes full SQL DDL, indexes, and Row-Level Security policies in{' '}
              <strong className="text-slate-200 font-mono">supabase/schema.sql</strong>.
            </p>
            <button
              onClick={handleCopySql}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied schema reference!' : 'Copy Schema Script Info'}</span>
            </button>
          </div>
        </div>

        {/* Demo Seed Data & Factory Reset (Section 36) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Demonstration Records Management</span>
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Per SIH26062 specifications, demonstration seed records are clearly separated from user-created entries. You can purge all demo records to verify that the application works exclusively with real operational data.
          </p>

          {seedClearedNotice && (
            <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs">
              Demonstration seed records cleared! All user-created cargo, inventory, and personnel are retained.
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleClearDemoSeed}
              className="flex-1 p-2.5 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-600/40 text-amber-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Clear Demonstration Seed Records</span>
            </button>

            <button
              onClick={handleResetToSeed}
              className="flex-1 p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Restore Factory Seed State</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 29: Complete Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
              System Audit &amp; Traceability Trail (Section 29)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {auditLogs.length} Logged Actions
          </span>
        </div>

        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] tracking-wider sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Officer / User</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">Details / Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-200 whitespace-nowrap">
                    {log.userName}
                  </td>
                  <td className="py-2 px-3 text-cyan-300 font-medium">
                    {log.action}
                  </td>
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                    {log.entity}
                  </td>
                  <td className="py-2 px-3 text-slate-300 truncate max-w-xs">
                    {log.newValue || log.previousValue || log.entityId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
