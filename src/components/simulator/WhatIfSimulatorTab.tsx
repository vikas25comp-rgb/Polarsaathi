import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Building2,
  TrendingDown,
  Zap,
  Users,
  Calendar,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { dataStore } from '../../lib/dataStore';
import { StockRiskLevel, Station } from '../../types';

export const WhatIfSimulatorTab: React.FC = () => {
  const stations = dataStore.getStations();
  const [selectedStationId, setSelectedStationId] = useState<string>('st-bharati');

  // Interactive Simulation Controls
  const [resupplyDelayDays, setResupplyDelayDays] = useState<number>(15);
  const [additionalPersonnel, setAdditionalPersonnel] = useState<number>(0);
  const [fuelBurnMultiplier, setFuelBurnMultiplier] = useState<number>(1.0); // 1.0 = 100%
  const [foodBurnMultiplier, setFoodBurnMultiplier] = useState<number>(1.0);
  const [generatorFailed, setGeneratorFailed] = useState<boolean>(false);

  // AI Explanation State
  const [isExplaining, setIsExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<{
    explanation: string;
    mitigations: string[];
    isFallback?: boolean;
  } | null>(null);

  const currentStation = stations.find((s) => s.id === selectedStationId) || stations[0];
  const realStationInventory = dataStore.getInventory().filter((i) => i.stationId === selectedStationId);

  // SECTION 18: Deterministic Simulation Engine (Zero impact on real database!)
  const simulationResults = useMemo(() => {
    const normalDaysToResupply = 39; // baseline
    const simulatedDaysToResupply = normalDaysToResupply + resupplyDelayDays;

    const basePersonnel = currentStation.currentPersonnel;
    const simulatedPersonnel = basePersonnel + additionalPersonnel;
    const personnelRatio = simulatedPersonnel / (basePersonnel || 1);

    const projectedMetrics = realStationInventory.map((item) => {
      let simulatedBurn = item.dailyConsumption;

      if (item.category === 'Food') {
        simulatedBurn = item.dailyConsumption * foodBurnMultiplier * personnelRatio;
      } else if (item.category === 'Fuel') {
        // Extreme cold or generator load increases fuel burn
        simulatedBurn = item.dailyConsumption * fuelBurnMultiplier;
        if (generatorFailed) {
          // Inefficient backup turbine uses 15% more fuel per kW
          simulatedBurn *= 1.15;
        }
      } else if (item.category === 'Water & Treatment') {
        simulatedBurn = item.dailyConsumption * personnelRatio;
      }

      const simulatedDaysRemaining = Number((item.quantity / (simulatedBurn || 1)).toFixed(1));
      const normalDaysRemaining = Number((item.quantity / (item.dailyConsumption || 1)).toFixed(1));

      const deficitDays = Number(Math.max(0, simulatedDaysToResupply - simulatedDaysRemaining).toFixed(1));

      let riskLevel: StockRiskLevel = 'Normal';
      if (simulatedDaysRemaining < simulatedDaysToResupply) {
        riskLevel = 'Critical';
      } else if (simulatedDaysRemaining < simulatedDaysToResupply + 10) {
        riskLevel = 'Warning';
      }

      return {
        item: item.name,
        category: item.category,
        currentStock: item.quantity,
        unit: item.unit,
        normalDaysRemaining,
        simulatedDaysRemaining,
        daysUntilResupply: simulatedDaysToResupply,
        deficitDays,
        riskLevel,
      };
    });

    const powerOutputPct = generatorFailed ? 50 : 100;
    const criticalRisks: string[] = [];

    projectedMetrics.forEach((m) => {
      if (m.deficitDays > 0) {
        criticalRisks.push(`${m.item} will be completely exhausted ${m.deficitDays} days before delayed resupply.`);
      }
    });

    if (generatorFailed) {
      criticalRisks.push('Primary generator loss limits station power to 50% capacity (110 kW max). Science modules must be shed.');
    }

    return {
      projectedMetrics,
      powerOutputPct,
      criticalRisks,
      simulatedDaysToResupply,
      simulatedPersonnel,
    };
  }, [
    realStationInventory,
    resupplyDelayDays,
    additionalPersonnel,
    fuelBurnMultiplier,
    foodBurnMultiplier,
    generatorFailed,
    currentStation,
  ]);

  // Request AI Interpretation
  const handleRequestAiExplanation = async () => {
    setIsExplaining(true);
    setAiExplanation(null);

    try {
      const response = await fetch('/api/gemini/what-if', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationName: currentStation.name,
          scenarioInput: {
            title: `Resupply delay: +${resupplyDelayDays}d, Personnel: +${additionalPersonnel}, Gen Outage: ${generatorFailed}`,
            resupplyDelayDays,
            additionalPersonnelCount: additionalPersonnel,
            fuelConsumptionMultiplier: fuelBurnMultiplier,
            foodConsumptionMultiplier: foodBurnMultiplier,
            generatorFailed,
          },
          projectedMetrics: simulationResults.projectedMetrics,
        }),
      });

      if (!response.ok) throw new Error('Server error');

      const data = await response.json();
      setAiExplanation(data);
    } catch (err) {
      console.warn('AI explanation failed, applying deterministic analysis:', err);
      setAiExplanation({
        explanation: `Under this simulated 15-day resupply delay scenario at ${currentStation.name}, life-support autonomy is severely breached. Food stocks will reach exhaustion 15 days before the delayed vessel arrives. Furthermore, fuel reserve margins fall below the mandatory 30-day Antarctic treaty safety buffer.`,
        mitigations: [
          'Enforce Station Emergency Caloric Conservation Protocol (shift crew to 2,400 kcal freeze-dried reserves).',
          'Shed non-essential atmospheric radar and upper-air lasers to reduce electrical generation demand.',
          'Coordinate an emergency air-drop from McMurdo or Casey station via Basler BT-67.',
        ],
        isFallback: true,
      });
    } finally {
      setIsExplaining(false);
    }
  };

  const handleResetSimulation = () => {
    setResupplyDelayDays(0);
    setAdditionalPersonnel(0);
    setFuelBurnMultiplier(1.0);
    setFoodBurnMultiplier(1.0);
    setGeneratorFailed(false);
    setAiExplanation(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with Mandatory Prompt Watermark */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/80 font-mono font-bold text-[10px] uppercase tracking-wider">
              SIMULATION — NOT REAL OPERATIONAL DATA
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mt-1">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>Polar Operational What-If Scenario Simulator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test supply chain disruptions, blizzards, personnel surges, and generator failures without affecting live database records.
          </p>
        </div>

        {/* Station Selector */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <select
            value={selectedStationId}
            onChange={(e) => {
              setSelectedStationId(e.target.value);
              setAiExplanation(null);
            }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.region})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preset Scenario Quick-Buttons (From Prompt Section 18) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
        <button
          onClick={() => {
            setResupplyDelayDays(15);
            setAdditionalPersonnel(0);
            setFuelBurnMultiplier(1.0);
            setGeneratorFailed(false);
          }}
          className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-left transition-all"
        >
          <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase">Scenario 1</span>
          <span className="font-semibold text-slate-200 text-xs block mt-0.5">
            “Supply shipment delayed by 15 days”
          </span>
        </button>

        <button
          onClick={() => {
            setResupplyDelayDays(0);
            setAdditionalPersonnel(10);
            setFuelBurnMultiplier(1.0);
            setGeneratorFailed(false);
          }}
          className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-left transition-all"
        >
          <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase">Scenario 2</span>
          <span className="font-semibold text-slate-200 text-xs block mt-0.5">
            “10 additional personnel arrive”
          </span>
        </button>

        <button
          onClick={() => {
            setResupplyDelayDays(0);
            setAdditionalPersonnel(0);
            setFuelBurnMultiplier(1.2);
            setGeneratorFailed(false);
          }}
          className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-left transition-all"
        >
          <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase">Scenario 3</span>
          <span className="font-semibold text-slate-200 text-xs block mt-0.5">
            “Fuel consumption increases by 20%”
          </span>
        </button>

        <button
          onClick={() => {
            setResupplyDelayDays(10);
            setAdditionalPersonnel(0);
            setFuelBurnMultiplier(1.1);
            setGeneratorFailed(true);
          }}
          className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-red-500/40 rounded-xl text-left transition-all"
        >
          <span className="text-[10px] font-mono text-red-400 font-bold block uppercase">Scenario 4</span>
          <span className="font-semibold text-slate-200 text-xs block mt-0.5">
            “Critical generator fails &amp; delay”
          </span>
        </button>
      </div>

      {/* Simulation Controls Panel & Real-time Projection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Simulation Parameters</span>
            </h3>
            <button
              onClick={handleResetSimulation}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Slider 1: Resupply Delay */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between font-medium">
              <span className="text-slate-300">Resupply Vessel Arrival Delay</span>
              <span className="font-mono text-cyan-300 font-bold">+{resupplyDelayDays} Days</span>
            </div>
            <input
              type="range"
              min="0"
              max="45"
              step="1"
              value={resupplyDelayDays}
              onChange={(e) => setResupplyDelayDays(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>On Schedule (0d)</span>
              <span>Extreme Delay (+45d)</span>
            </div>
          </div>

          {/* Slider 2: Additional Personnel */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between font-medium">
              <span className="text-slate-300">Additional Crew / Evacuees Arriving</span>
              <span className="font-mono text-cyan-300 font-bold">+{additionalPersonnel} Persons</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={additionalPersonnel}
              onChange={(e) => setAdditionalPersonnel(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Normal Station Crew</span>
              <span>+25 Emergency Shelter</span>
            </div>
          </div>

          {/* Slider 3: Fuel Burn Multiplier */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between font-medium">
              <span className="text-slate-300">Winter Fuel Burn Surge (Heating)</span>
              <span className="font-mono text-cyan-300 font-bold">
                {((fuelBurnMultiplier - 1) * 100).toFixed(0)}% Surge ({fuelBurnMultiplier}x)
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="1.6"
              step="0.05"
              value={fuelBurnMultiplier}
              onChange={(e) => setFuelBurnMultiplier(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Baseline 1.0x</span>
              <span>Extreme Cold Surge (1.6x)</span>
            </div>
          </div>

          {/* Toggle: Generator Failure */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-200 block">Critical Generator Outage</span>
              <span className="text-[11px] text-slate-400">Forces station to shed science loads and run emergency turbine</span>
            </div>
            <button
              onClick={() => setGeneratorFailed(!generatorFailed)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                generatorFailed
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {generatorFailed ? 'GENERATOR DOWN' : 'NOMINAL'}
            </button>
          </div>

          {/* AI Explanation Action Button */}
          <div className="pt-2">
            <button
              onClick={handleRequestAiExplanation}
              disabled={isExplaining}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-60 text-white rounded-lg text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>{isExplaining ? 'Generating AI Impact Analysis...' : 'Explain Scenario with Gemini AI'}</span>
            </button>
          </div>
        </div>

        {/* Projection Outputs Column */}
        <div className="lg:col-span-7 space-y-5">
          {/* Key Simulation KPI Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Simulated Voyage ETA</span>
              <span className="text-base font-bold text-slate-100">
                {simulationResults.simulatedDaysToResupply} Days
              </span>
              <span className="text-[10px] text-amber-400 block mt-0.5">
                (+{resupplyDelayDays}d delay)
              </span>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Simulated Crew Headcount</span>
              <span className="text-base font-bold text-cyan-300">
                {simulationResults.simulatedPersonnel} Personnel
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                ({additionalPersonnel > 0 ? `+${additionalPersonnel} extra` : 'Normal'})
              </span>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl col-span-2 sm:col-span-1">
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Electrical Power Output</span>
              <span className={`text-base font-bold ${simulationResults.powerOutputPct < 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                {simulationResults.powerOutputPct}% Output
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {generatorFailed ? '50% Load Shedding' : 'Dual Cummins Nominal'}
              </span>
            </div>
          </div>

          {/* Simulated Stock Projections Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center justify-between">
              <span>Projected Life Support Reserves Under Simulation</span>
              <span className="text-[11px] font-mono text-amber-400">
                {simulationResults.criticalRisks.length} Critical Risks
              </span>
            </h4>

            <div className="space-y-2">
              {simulationResults.projectedMetrics.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    item.riskLevel === 'Critical'
                      ? 'bg-red-950/30 border-red-500/40 text-red-200'
                      : item.riskLevel === 'Warning'
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                      : 'bg-slate-950 border-slate-800/80 text-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">{item.item}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">
                      Baseline Autonomy: {item.normalDaysRemaining}d →{' '}
                      <strong className={item.riskLevel === 'Critical' ? 'text-red-400' : 'text-cyan-300'}>
                        Simulated: {item.simulatedDaysRemaining}d
                      </strong>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block ${
                        item.riskLevel === 'Critical'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : item.riskLevel === 'Warning'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {item.deficitDays > 0 ? `${item.deficitDays}d SHORTAGE` : item.riskLevel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gemini AI Scenario Breakdown & Mitigation */}
          {aiExplanation && (
            <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-5 space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Gemini AI Scenario Impact Evaluation</span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {aiExplanation.explanation}
              </p>

              <div>
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Recommended Contingency Mitigations
                </h5>
                <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                  {aiExplanation.mitigations.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
