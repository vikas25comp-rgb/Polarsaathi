import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Download,
  Printer,
  Sparkles,
  Building2,
  Calendar,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { dataStore } from '../../lib/dataStore';
import { ReportRecord } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const ReportsTab: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportRecord[]>(dataStore.getReports());
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(reports[0] || null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form State for Report Generation
  const [reportCategory, setReportCategory] = useState<ReportRecord['category']>('Expedition Summary');
  const [reportStationId, setReportStationId] = useState<string>('st-bharati');

  const stations = dataStore.getStations();

  const handleGenerateReport = async () => {
    setIsGenerating(true);

    const targetStation = stations.find((s) => s.id === reportStationId);
    const stationInventory = dataStore.getInventory().filter((i) => i.stationId === reportStationId);
    const stationCargo = dataStore.getCargo().filter((c) => c.destinationStationId === reportStationId);
    const stationPersonnel = dataStore.getPersonnel().filter((p) => p.stationId === reportStationId);
    const stationAssets = dataStore.getAssets().filter((a) => a.stationId === reportStationId);
    const stationEmergencies = dataStore.getEmergencies().filter((e) => e.stationId === reportStationId);

    const operationalData = {
      station: targetStation,
      inventoryCount: stationInventory.length,
      criticalInventory: stationInventory.filter((i) => dataStore.calculateInventoryMetrics(i).riskLevel === 'Critical'),
      personnelDeployed: stationPersonnel.length,
      cargoInTransit: stationCargo.filter((c) => c.status === 'In Transit').length,
      assetsNeedingMaint: stationAssets.filter((a) => a.operationalStatus !== 'Operational').length,
      activeEmergencies: stationEmergencies.filter((e) => e.status === 'Active').length,
    };

    try {
      const response = await fetch('/api/gemini/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportCategory,
          stationName: targetStation?.name,
          operationalData,
        }),
      });

      if (!response.ok) throw new Error('Report server failed');

      const data = await response.json();

      const created = dataStore.saveReport({
        title: `${targetStation?.name || 'All Stations'}: ${reportCategory} Brief`,
        category: reportCategory,
        generatedBy: `${user?.fullName || 'Station Officer'} (AI-Assisted)`,
        stationId: reportStationId,
        contentMarkdown: data.contentMarkdown,
        aiGeneratedSummary: true,
        summaryHighlights: data.summaryHighlights || [
          'Full operational review compiled from database records.',
          'Life-support parameters within acceptable margins.',
        ],
      });

      const list = dataStore.getReports();
      setReports(list);
      setSelectedReport(created);
    } catch (err) {
      console.warn('AI report generation fallback:', err);
      const fallbackReport = dataStore.saveReport({
        title: `${targetStation?.name || 'Polar Base'}: ${reportCategory} Brief`,
        category: reportCategory,
        generatedBy: `${user?.fullName || 'Station Officer'}`,
        stationId: reportStationId,
        contentMarkdown: `## Operational Status Brief: ${reportCategory}\n\n**Station Focus:** ${targetStation?.name}\n**Generated:** ${new Date().toUTCString()}\n\n### Executive Summary\nPolar mission parameters continue under active surveillance. Life-support power generation is nominal, with wintering food rations requiring prioritized manifestation in the next voyage.\n\n### Tactical Resource Overview\n- **Active Crew:** ${stationPersonnel.length} personnel\n- **Incoming Consignments:** ${stationCargo.length} shipments\n- **Critical Alerts:** ${operationalData.criticalInventory.length} supply gaps`,
        aiGeneratedSummary: false,
        summaryHighlights: [
          'Station life support active.',
          'Food replenishment priority required.',
          'All deployed crew accounted for.',
        ],
      });

      const list = dataStore.getReports();
      setReports(list);
      setSelectedReport(fallbackReport);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = () => {
    if (!selectedReport) return;
    const blob = new Blob([selectedReport.contentMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedReport.reportCode}_${selectedReport.category.replace(/\s+/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Mission Reports &amp; Operational Dossiers</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Official expedition summaries, cargo movements, after-action reviews, and AI-compiled situational briefs.
          </p>
        </div>

        {/* Generate Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <select
            value={reportCategory}
            onChange={(e) => setReportCategory(e.target.value as ReportRecord['category'])}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="Expedition Summary">Expedition Summary</option>
            <option value="Cargo Movement">Cargo Movement Report</option>
            <option value="Inventory & Depletion">Inventory &amp; Depletion</option>
            <option value="Personnel Deployment">Personnel Deployment</option>
            <option value="Asset Health">Asset Health &amp; Maintenance</option>
            <option value="Emergency After-Action">Emergency After-Action</option>
          </select>

          <select
            value={reportStationId}
            onChange={(e) => setReportStationId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-60 text-white rounded-lg text-xs font-bold shadow transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Compiling AI Report...' : 'Generate Report'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Reports List + Reader View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reports Archive */}
        <div className="lg:col-span-4 space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
          <div className="text-xs font-semibold text-slate-400 px-1 flex justify-between">
            <span>Archived Reports ({reports.length})</span>
            <span className="text-cyan-400 font-mono">Official Records</span>
          </div>

          {reports.map((rep) => {
            const isSelected = selectedReport?.id === rep.id;
            return (
              <div
                key={rep.id}
                onClick={() => setSelectedReport(rep)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-cyan-400">{rep.reportCode}</span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300">
                    {rep.category}
                  </span>
                  {rep.aiGeneratedSummary && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      AI Generated
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-semibold text-slate-100 mt-1">{rep.title}</h4>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                  <span>By: {rep.generatedBy.split(' ')[0]}</span>
                  <span>{new Date(rep.generatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Report Reader */}
        <div className="lg:col-span-8">
          {selectedReport ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800">
                      {selectedReport.reportCode}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(selectedReport.generatedAt).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mt-1.5">{selectedReport.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Compiled by: {selectedReport.generatedBy}</p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleDownloadReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download Markdown</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
                    title="Print Report"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Section 25: AI Highlights Banner */}
              {selectedReport.summaryHighlights && selectedReport.summaryHighlights.length > 0 && (
                <div className="p-4 bg-slate-950 rounded-xl border border-cyan-900/50 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Executive Takeaways (AI Synthesis)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedReport.summaryHighlights.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Report Body Markdown Preview */}
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {selectedReport.contentMarkdown}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
              Select or generate a report to read.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
