import { createClient } from '@supabase/supabase-js';
import { weatherService } from '../services/weather/weatherProvider';
import {
  SEED_STATIONS,
  SEED_EXPEDITIONS,
  SEED_CARGO,
  SEED_CARGO_MOVEMENTS,
  SEED_INVENTORY,
  SEED_PERSONNEL,
  SEED_PERSONNEL_MOVEMENTS,
  SEED_ASSETS,
  SEED_ASSET_MAINTENANCE,
  SEED_EMERGENCIES,
  SEED_EMERGENCY_ACTIONS,
  SEED_AUDIT_LOGS,
} from '../../src/lib/seedData';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const isSupabaseLive = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id')
);

const supabase = isSupabaseLive ? createClient(supabaseUrl, supabaseKey) : null;

// In-memory operational store matching live application state
let localStations = [...SEED_STATIONS];
let localCargo = [...SEED_CARGO];
let localInventory = [...SEED_INVENTORY];
let localPersonnel = [...SEED_PERSONNEL];
let localAssets = [...SEED_ASSETS];
let localEmergencies = [...SEED_EMERGENCIES];
let localAuditLogs = [...SEED_AUDIT_LOGS];

export const syncServerStore = (data: {
  inventory?: any[];
  cargo?: any[];
  assets?: any[];
  personnel?: any[];
  emergencies?: any[];
  auditLogs?: any[];
}) => {
  if (data.inventory) localInventory = data.inventory;
  if (data.cargo) localCargo = data.cargo;
  if (data.assets) localAssets = data.assets;
  if (data.personnel) localPersonnel = data.personnel;
  if (data.emergencies) localEmergencies = data.emergencies;
  if (data.auditLogs) localAuditLogs = data.auditLogs;
};

// 1. Stations
export async function get_stations() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('stations').select('*');
      if (!error && data && data.length > 0) return data;
    } catch {}
  }
  return localStations;
}

export async function get_station_status(params: { station_id: string }) {
  const stations = await get_stations();
  const idLower = params.station_id.toLowerCase();
  const st = stations.find((s: any) => s.id.toLowerCase().includes(idLower) || s.name.toLowerCase().includes(idLower) || s.code.toLowerCase().includes(idLower));
  if (!st) {
    return { error: `Station '${params.station_id}' not found in POLAR-SATHI registry.` };
  }
  return st;
}

// 2. Expeditions
export async function get_expeditions() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('expeditions').select('*');
      if (!error && data && data.length > 0) return data;
    } catch {}
  }
  return SEED_EXPEDITIONS;
}

export async function get_expedition_details(params: { expedition_id: string }) {
  const exps = await get_expeditions();
  const idLower = params.expedition_id.toLowerCase();
  const exp = exps.find((e: any) => e.id.toLowerCase().includes(idLower) || e.code.toLowerCase().includes(idLower) || e.name.toLowerCase().includes(idLower));
  if (!exp) return { error: `Expedition '${params.expedition_id}' not found.` };
  return exp;
}

// 3. Cargo & Consignments
export async function get_cargo(params?: { category?: string; priority?: string }) {
  let list = localCargo;
  if (supabase) {
    try {
      const { data, error } = await supabase.from('cargo').select('*');
      if (!error && data && data.length > 0) list = data;
    } catch {}
  }
  if (params?.category) list = list.filter((c: any) => c.category?.toLowerCase() === params.category?.toLowerCase());
  if (params?.priority) list = list.filter((c: any) => c.priority?.toLowerCase() === params.priority?.toLowerCase());
  return list;
}

export async function get_cargo_details(params: { cargo_id: string }) {
  const list = await get_cargo();
  const q = params.cargo_id.toLowerCase().trim();
  const c = list.find((item: any) =>
    item.id?.toLowerCase().includes(q) ||
    item.trackingNumber?.toLowerCase().includes(q) ||
    item.tracking_number?.toLowerCase().includes(q) ||
    item.name?.toLowerCase().includes(q)
  );
  if (!c) return { error: `Cargo with ID/tracking '${params.cargo_id}' not found.` };
  return c;
}

export async function get_cargo_in_transit() {
  const list = await get_cargo();
  return list.filter((c: any) => c.status === 'In Transit' || c.status === 'Dispatched');
}

export async function get_delayed_cargo() {
  const list = await get_cargo();
  return list.filter((c: any) => c.status === 'Delayed');
}

export async function get_cargo_eta(params: { cargo_id: string }) {
  const details: any = await get_cargo_details(params);
  if (details.error) return details;
  return {
    trackingNumber: details.trackingNumber || details.tracking_number,
    name: details.name,
    status: details.status,
    currentLocation: details.currentLocation || details.current_location,
    estimatedArrival: details.estimatedArrival || details.estimated_arrival,
    destinationStationId: details.destinationStationId || details.destination_station_id,
    specialInstructions: details.specialInstructions || details.special_instructions,
  };
}

// 4. Inventory & Consumption
export async function get_inventory(params?: { station_id?: string; category?: string }) {
  let list = localInventory;
  if (supabase) {
    try {
      const { data, error } = await supabase.from('inventory_items').select('*');
      if (!error && data && data.length > 0) list = data;
    } catch {}
  }
  if (params?.station_id) {
    const sId = params.station_id.toLowerCase();
    list = list.filter((i: any) => (i.stationId || i.station_id)?.toLowerCase().includes(sId));
  }
  if (params?.category) {
    list = list.filter((i: any) => i.category?.toLowerCase() === params.category?.toLowerCase());
  }
  return list;
}

export async function get_station_inventory(params: { station_id: string }) {
  return get_inventory({ station_id: params.station_id });
}

export async function get_critical_inventory(params?: { station_id?: string }) {
  const list = await get_inventory(params);
  return list.filter((item: any) => {
    const qty = Number(item.quantity);
    const crit = Number(item.criticalThreshold || item.critical_threshold || 1000);
    const daily = Number(item.dailyConsumption || item.daily_consumption || 1);
    const days = qty / daily;
    return qty <= crit || days < 30;
  });
}

export async function get_inventory_consumption_history(params: { station_id: string; item_type?: string }) {
  const inventory = await get_station_inventory(params);
  const matched = params.item_type
    ? inventory.filter((i: any) => i.name.toLowerCase().includes(params.item_type!.toLowerCase()) || i.category.toLowerCase().includes(params.item_type!.toLowerCase()))
    : inventory;

  return matched.map((i: any) => ({
    sku: i.sku,
    name: i.name,
    category: i.category,
    currentQuantity: i.quantity,
    unit: i.unit,
    dailyConsumptionRate: i.dailyConsumption || i.daily_consumption,
    calculatedDaysAutonomy: Number((i.quantity / (i.dailyConsumption || i.daily_consumption || 1)).toFixed(1)),
    lastResupplyDate: i.lastResupplyDate || i.last_resupply_date || '2026-02-14',
    nextResupplyDate: i.nextPlannedResupplyDate || i.next_planned_resupply_date || '2026-11-05',
  }));
}

export async function get_projected_stockout(params: { station_id: string; item_type: string }) {
  const history = await get_inventory_consumption_history(params);
  if (history.length === 0) {
    return { error: `No inventory records matching '${params.item_type}' at station '${params.station_id}'.` };
  }
  const item = history[0];
  const now = new Date();
  const depletionDate = new Date(now.getTime() + item.calculatedDaysAutonomy * 24 * 3600 * 1000);

  const resupplyDate = new Date(item.nextResupplyDate);
  const daysUntilResupply = Math.max(0, Math.ceil((resupplyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const deficitDays = Number(Math.max(0, daysUntilResupply - item.calculatedDaysAutonomy).toFixed(1));

  return {
    item: item.name,
    currentStock: `${item.currentQuantity} ${item.unit}`,
    dailyConsumption: `${item.dailyConsumptionRate} ${item.unit}/day`,
    projectedDaysRemaining: item.calculatedDaysAutonomy,
    projectedDepletionDate: depletionDate.toISOString().split('T')[0],
    nextPlannedResupplyDate: item.nextResupplyDate,
    daysUntilResupply,
    projectedSupplyGapDays: deficitDays,
    isShortageDetected: deficitDays > 0,
    riskClassification: deficitDays > 0 ? 'CRITICAL RISK: Depletion occurs prior to scheduled vessel resupply' : 'SAFE: Stock autonomy exceeds scheduled resupply date',
  };
}

// 5. Resupply Schedules
export async function get_resupply_schedule(params?: { station_id?: string }) {
  return [
    {
      stationId: params?.station_id || 'st-bharati',
      stationName: 'Bharati Station',
      transportVessel: 'MV Vasiliy Golovnin (Chartered Polar Research Vessel)',
      departureHub: 'Cape Town Port Terminal 4',
      scheduledArrivalDate: '2026-11-05',
      daysUntilArrival: 39,
      manifestedCargoWeightKg: 142500,
      cargoHighlights: '18,500 L Aviation Fuel, 8,200 kg Wintering Rations, AIIMS Medical Packs, Generator Spares',
      status: 'On Schedule (Traversing Southern Ocean)',
    },
    {
      stationId: 'st-maitri',
      stationName: 'Maitri Station',
      transportVessel: 'Basler BT-67 Air Charter (ALCI Cape Town-Novo)',
      departureHub: 'Cape Town Logistics Hub',
      scheduledArrivalDate: '2026-10-20',
      daysUntilArrival: 23,
      manifestedCargoWeightKg: 4200,
      cargoHighlights: 'Replacement Hydraulic Hoses, Specialized Ozone Sondes, Emergency Cold Plasma',
      status: 'Delayed in Durban (Pending Southern Ocean weather window)',
    }
  ];
}

export async function get_next_resupply(params: { station_id: string }) {
  const schedule = await get_resupply_schedule(params);
  const match = schedule.find((s) => s.stationId.toLowerCase().includes(params.station_id.toLowerCase()) || s.stationName.toLowerCase().includes(params.station_id.toLowerCase()));
  return match || schedule[0];
}

// 6. Personnel
export async function get_personnel(params?: { station_id?: string }) {
  let list = localPersonnel;
  if (supabase) {
    try {
      const { data, error } = await supabase.from('personnel').select('*');
      if (!error && data && data.length > 0) list = data;
    } catch {}
  }
  if (params?.station_id) {
    const sId = params.station_id.toLowerCase();
    list = list.filter((p: any) => (p.stationId || p.station_id)?.toLowerCase().includes(sId));
  }
  return list;
}

export async function get_personnel_at_station(params: { station_id: string }) {
  const list = await get_personnel(params);
  return list.filter((p: any) => p.status === 'At Station');
}

export async function get_personnel_movement(params?: { personnel_id?: string }) {
  return SEED_PERSONNEL_MOVEMENTS;
}

export async function get_personnel_count(params: { station_id: string }) {
  const list = await get_personnel_at_station(params);
  return {
    stationId: params.station_id,
    activePersonnelCount: list.length,
    personnel: list.map((p: any) => ({ name: p.name, role: p.role, specialization: p.specialization, bloodGroup: p.bloodGroup || p.blood_group })),
  };
}

// 7. Assets & Maintenance
export async function get_assets(params?: { station_id?: string }) {
  let list = localAssets;
  if (supabase) {
    try {
      const { data, error } = await supabase.from('assets').select('*');
      if (!error && data && data.length > 0) list = data;
    } catch {}
  }
  if (params?.station_id) {
    const sId = params.station_id.toLowerCase();
    list = list.filter((a: any) => (a.stationId || a.station_id)?.toLowerCase().includes(sId));
  }
  return list;
}

export async function get_asset_status(params: { asset_code: string }) {
  const assets = await get_assets();
  const q = params.asset_code.toLowerCase();
  const asset = assets.find((a: any) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
  if (!asset) return { error: `Asset '${params.asset_code}' not found.` };
  return asset;
}

export async function get_asset_maintenance(params?: { asset_code?: string }) {
  return SEED_ASSET_MAINTENANCE;
}

export async function get_failed_assets() {
  const assets = await get_assets();
  return assets.filter((a: any) => (a.operationalStatus || a.operational_status) === 'Faulty' || (a.operationalStatus || a.operational_status) === 'Under Maintenance');
}

export async function get_overdue_maintenance() {
  const assets = await get_assets();
  const today = new Date().toISOString().split('T')[0];
  return assets.filter((a: any) => {
    const status = a.operationalStatus || a.operational_status;
    const nextDue = a.nextScheduledMaintenance || a.next_scheduled_maintenance;
    return status === 'Maintenance Due' || (nextDue && nextDue < today);
  });
}

// 8. Emergencies
export async function get_active_emergencies() {
  let list = localEmergencies;
  if (supabase) {
    try {
      const { data, error } = await supabase.from('emergencies').select('*');
      if (!error && data && data.length > 0) list = data;
    } catch {}
  }
  return list.filter((e: any) => e.status === 'Active' || e.status === 'Investigating');
}

export async function get_emergency_history() {
  return localEmergencies;
}

export async function get_station_emergency_snapshot(params: { station_id: string }) {
  const stationId = params.station_id;
  const stations = await get_stations();
  const station = stations.find((s: any) => s.id.toLowerCase().includes(stationId.toLowerCase()) || s.name.toLowerCase().includes(stationId.toLowerCase()));

  const personnel = await get_personnel_at_station({ station_id: stationId });
  const assets = await get_assets({ station_id: stationId });
  const criticalAssets = assets.filter((a: any) => a.criticality === 'Vital Life-Support' || a.criticality === 'Primary Operational');
  const vehicles = assets.filter((a: any) => (a.category?.toLowerCase().includes('vehicle') || a.category?.toLowerCase().includes('snowcat')) && (a.operationalStatus === 'Operational' || a.operational_status === 'Operational'));
  const inventory = await get_station_inventory({ station_id: stationId });
  const medical = inventory.filter((i: any) => i.category === 'Medicine');
  const emergencies = await get_active_emergencies();
  const weather = await weatherService.getCurrentWeather(station?.name || stationId);

  return {
    station: station?.name || stationId,
    personnelCount: personnel.length,
    personnelOnSite: personnel.map((p: any) => ({ name: p.name, role: p.role, bloodGroup: p.bloodGroup || p.blood_group })),
    vitalLifeSupportAssets: criticalAssets.map((a: any) => ({ code: a.code, name: a.name, status: a.operationalStatus || a.operational_status, hours: a.operatingHours || a.operating_hours })),
    availableVehicles: vehicles.map((v: any) => ({ code: v.code, name: v.name, status: v.operationalStatus || v.operational_status })),
    medicalStock: medical.map((m: any) => ({ item: m.name, quantity: `${m.quantity} ${m.unit}` })),
    activeEmergenciesAtStation: emergencies.filter((e: any) => (e.stationId || e.station_id)?.toLowerCase().includes(stationId.toLowerCase())),
    liveWeather: {
      temperature: `${weather.temperatureCelsius}°C`,
      windSpeed: `${weather.windSpeedKts} kts`,
      condition: weather.condition,
      warning: weather.severeWeatherWarning || 'None',
    },
    communicationStatus: station?.communicationStatus || 'Nominal (Satcom Primary)',
  };
}

// 9. Weather Tools (Mandatory Section 4)
export async function get_weather(params: { location: string; latitude?: number; longitude?: number }) {
  return weatherService.getCurrentWeather(params.location, params.latitude, params.longitude);
}

export async function get_weather_forecast(params: { location: string; latitude?: number; longitude?: number; days?: number }) {
  return weatherService.getWeatherForecast(params.location, params.latitude, params.longitude, params.days || 5);
}

// 10. What-If Simulation Tool (Mandatory Section 12)
export async function run_what_if_simulation(params: {
  station_id: string;
  resupply_delay_days: number;
  additional_personnel?: number;
  fuel_burn_multiplier?: number;
  generator_failed?: boolean;
}) {
  const inventory = await get_station_inventory({ station_id: params.station_id });
  const delay = params.resupply_delay_days || 0;
  const simulatedDaysToResupply = 39 + delay;
  const extraCrew = params.additional_personnel || 0;
  const fuelMult = params.fuel_burn_multiplier || 1.0;

  const results = inventory.map((item: any) => {
    let burn = Number(item.dailyConsumption || item.daily_consumption || 1);
    if (item.category === 'Food') {
      burn = burn * (1 + (extraCrew / 28));
    } else if (item.category === 'Fuel') {
      burn = burn * fuelMult * (params.generator_failed ? 1.15 : 1.0);
    }
    const daysRemaining = Number((item.quantity / burn).toFixed(1));
    const deficitDays = Number(Math.max(0, simulatedDaysToResupply - daysRemaining).toFixed(1));
    return {
      item: item.name,
      category: item.category,
      currentStock: `${item.quantity} ${item.unit}`,
      simulatedDailyBurn: `${burn.toFixed(1)} ${item.unit}/day`,
      simulatedDaysRemaining: daysRemaining,
      simulatedDaysToResupply,
      projectedDeficitDays: deficitDays,
      status: deficitDays > 0 ? 'CRITICAL SHORTAGE' : 'STABLE',
    };
  });

  return {
    simulationNotice: 'SIMULATION EXECUTION — ZERO IMPACT ON PRODUCTION DATABASE',
    stationId: params.station_id,
    simulatedParameters: {
      resupplyDelayDays: delay,
      additionalPersonnel: extraCrew,
      fuelBurnMultiplier: fuelMult,
      generatorOutage: Boolean(params.generator_failed),
    },
    simulatedDaysToResupply,
    projectedStockouts: results.filter((r) => r.projectedDeficitDays > 0),
    allProjectedReserves: results,
  };
}

// 11. Audit Logs
export async function get_audit_logs() {
  return localAuditLogs.slice(0, 15);
}

export async function get_historical_operations() {
  return {
    recentActions: localAuditLogs.slice(0, 5),
    activeExpedition: 'ISEA-44 (44th Indian Scientific Expedition to Antarctica)',
    historicalBaseline: 'Past 3 seasons recorded 2 gale-induced delays averaging 12 days for Southern Ocean passage.',
  };
}


// -----------------------------------------------------------------------------
// HUMAN-IN-THE-LOOP OPERATIONAL ACTIONS
// The AI can propose an action, but this layer is the only place that can
// mutate operational records. Execution requires an explicit confirmation
// through /api/agent/confirm-action.
// -----------------------------------------------------------------------------

export type OperationalActionType =
  | 'update_inventory'
  | 'update_cargo_status'
  | 'update_asset_status'
  | 'update_emergency_status'
  | 'create_emergency';

export interface OperationalAction {
  id: string;
  actionType: OperationalActionType;
  title: string;
  description: string;
  targetId?: string;
  targetStationId?: string;
  parameters: Record<string, any>;
  status: 'pending' | 'executed' | 'rejected';
  createdAt: string;
  executedAt?: string;
  result?: any;
}

const pendingOperationalActions = new Map<string, OperationalAction>();

const normalize = (value: any) => String(value ?? '').trim().toLowerCase();

const findInventoryItem = (targetId?: string, stationId?: string) => {
  const q = normalize(targetId);
  const station = normalize(stationId);
  return localInventory.find((item: any) => {
    const matchesTarget = !q || [item.id, item.sku, item.name, item.code]
      .some((v) => normalize(v) === q || normalize(v).includes(q));
    const itemStation = normalize(item.stationId || item.station_id);
    const matchesStation = !station || itemStation === station || itemStation.includes(station);
    return matchesTarget && matchesStation;
  });
};

const findCargoItem = (targetId?: string) => {
  const q = normalize(targetId);
  return localCargo.find((item: any) =>
    [item.id, item.trackingNumber, item.tracking_number, item.name]
      .some((v) => normalize(v) === q || normalize(v).includes(q))
  );
};

const findAssetItem = (targetId?: string, stationId?: string) => {
  const q = normalize(targetId);
  const station = normalize(stationId);
  return localAssets.find((item: any) => {
    const matchesTarget = !q || [item.id, item.code, item.name]
      .some((v) => normalize(v) === q || normalize(v).includes(q));
    const itemStation = normalize(item.stationId || item.station_id);
    const matchesStation = !station || itemStation === station || itemStation.includes(station);
    return matchesTarget && matchesStation;
  });
};

const findEmergencyItem = (targetId?: string, stationId?: string) => {
  const q = normalize(targetId);
  const station = normalize(stationId);
  return localEmergencies.find((item: any) => {
    const matchesTarget = !q || [item.id, item.incidentCode, item.incident_code, item.title]
      .some((v) => normalize(v) === q || normalize(v).includes(q));
    const itemStation = normalize(item.stationId || item.station_id);
    const matchesStation = !station || itemStation === station || itemStation.includes(station);
    return matchesTarget && matchesStation;
  });
};

export async function createOperationalAction(input: {
  actionType: OperationalActionType;
  title: string;
  description: string;
  targetId?: string;
  targetStationId?: string;
  parameters?: Record<string, any>;
}) {
  const allowed: OperationalActionType[] = [
    'update_inventory',
    'update_cargo_status',
    'update_asset_status',
    'update_emergency_status',
    'create_emergency',
  ];

  if (!allowed.includes(input.actionType)) {
    return { error: `Unsupported operational action: ${input.actionType}` };
  }

  const action: OperationalAction = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actionType: input.actionType,
    title: input.title || 'Operational action',
    description: input.description || 'Operational change requested by the user.',
    targetId: input.targetId,
    targetStationId: input.targetStationId,
    parameters: input.parameters || {},
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  pendingOperationalActions.set(action.id, action);

  return {
    requiresHumanConfirmation: true,
    action,
    message: 'Action prepared. No operational record has been changed. Human confirmation is required before execution.',
  };
}

export function getPendingOperationalAction(actionId: string) {
  return pendingOperationalActions.get(actionId);
}

export function rejectOperationalAction(actionId: string) {
  const action = pendingOperationalActions.get(actionId);
  if (!action) return { error: 'Operational action not found or already handled.' };
  action.status = 'rejected';
  pendingOperationalActions.delete(actionId);
  return { success: true, action };
}

async function writeAuditLog(
  userName: string,
  action: string,
  entity: string,
  entityId: string,
  previousValue: any,
  newValue: any,
) {
  const entry: any = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userName,
    action,
    entity,
    entityId,
    previousValue: previousValue == null ? undefined : JSON.stringify(previousValue),
    newValue: newValue == null ? undefined : JSON.stringify(newValue),
    timestamp: new Date().toISOString(),
  };
  localAuditLogs = [entry, ...localAuditLogs].slice(0, 100);

  if (supabase) {
    try {
      await supabase.from('audit_logs').insert({
        user_name: userName,
        action,
        entity,
        entity_id: entityId,
        previous_value: entry.previousValue,
        new_value: entry.newValue,
      });
    } catch (error) {
      console.warn('[POLAR-SATHI] Audit log persistence failed:', error);
    }
  }
}

export async function executeOperationalAction(actionId: string, userName = 'Confirmed Operator') {
  const action = pendingOperationalActions.get(actionId);
  if (!action) {
    throw new Error('Operational action not found, expired, or already handled.');
  }

  if (action.status !== 'pending') {
    throw new Error(`Operational action is already ${action.status}.`);
  }

  const p = action.parameters || {};
  let result: any;

  switch (action.actionType) {
    case 'update_inventory': {
      const item = findInventoryItem(action.targetId, action.targetStationId);
      if (!item) throw new Error(`Inventory item '${action.targetId || ''}' was not found.`);

      const requestedQuantity = p.quantity ?? p.newQuantity;
      const delta = p.quantityDelta;
      const nextQuantity = requestedQuantity != null
        ? Number(requestedQuantity)
        : Number(item.quantity) + Number(delta || 0);

      if (!Number.isFinite(nextQuantity) || nextQuantity < 0) {
        throw new Error('Inventory quantity must be a valid number greater than or equal to zero.');
      }

      const previous = { ...item };
      item.quantity = nextQuantity;
      item.updatedAt = new Date().toISOString();
      localInventory = [...localInventory];

      if (supabase) {
        const { error } = await supabase
          .from('inventory_items')
          .update({ quantity: nextQuantity, updated_at: new Date().toISOString() })
          .eq('id', item.id);
        if (error) throw new Error(`Inventory database update failed: ${error.message}`);
      }

      await writeAuditLog(userName, 'AI-confirmed inventory update', 'Inventory', item.id, previous.quantity, nextQuantity);
      result = { entity: item, previousQuantity: previous.quantity, newQuantity: nextQuantity };
      break;
    }

    case 'update_cargo_status': {
      const cargo = findCargoItem(action.targetId);
      if (!cargo) throw new Error(`Cargo '${action.targetId || ''}' was not found.`);

      const allowedStatuses = ['Planned', 'Packed', 'Dispatched', 'In Transit', 'At Station', 'Received', 'Delayed', 'Lost/Damaged'];
      const newStatus = p.status;
      if (!allowedStatuses.includes(newStatus)) {
        throw new Error(`Invalid cargo status '${newStatus}'.`);
      }

      const previous = { ...cargo };
      cargo.status = newStatus;
      if (p.currentLocation != null) cargo.currentLocation = p.currentLocation;
      cargo.updatedAt = new Date().toISOString();
      localCargo = [...localCargo];

      if (supabase) {
        const dbUpdate: any = {
          status: newStatus,
          updated_at: new Date().toISOString(),
        };
        if (p.currentLocation != null) dbUpdate.current_location = p.currentLocation;
        const { error } = await supabase.from('cargo').update(dbUpdate).eq('id', cargo.id);
        if (error) throw new Error(`Cargo database update failed: ${error.message}`);
      }

      await writeAuditLog(userName, 'AI-confirmed cargo status update', 'Cargo', cargo.id, previous.status, newStatus);
      result = { entity: cargo, previousStatus: previous.status, newStatus };
      break;
    }

    case 'update_asset_status': {
      const asset = findAssetItem(action.targetId, action.targetStationId);
      if (!asset) throw new Error(`Asset '${action.targetId || ''}' was not found.`);

      const allowedStatuses = ['Operational', 'Maintenance Due', 'Under Maintenance', 'Faulty', 'Retired'];
      const newStatus = p.status;
      if (!allowedStatuses.includes(newStatus)) {
        throw new Error(`Invalid asset status '${newStatus}'.`);
      }

      const previous = { ...asset };
      asset.operationalStatus = newStatus;
      asset.operational_status = newStatus;
      asset.updatedAt = new Date().toISOString();
      localAssets = [...localAssets];

      if (supabase) {
        const { error } = await supabase
          .from('assets')
          .update({ operational_status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', asset.id);
        if (error) throw new Error(`Asset database update failed: ${error.message}`);
      }

      await writeAuditLog(userName, 'AI-confirmed asset status update', 'Asset', asset.id, previous.operationalStatus || previous.operational_status, newStatus);
      result = { entity: asset, previousStatus: previous.operationalStatus || previous.operational_status, newStatus };
      break;
    }

    case 'update_emergency_status': {
      const emergency = findEmergencyItem(action.targetId, action.targetStationId);
      if (!emergency) throw new Error(`Emergency '${action.targetId || ''}' was not found.`);

      const allowedStatuses = ['Active', 'Investigating', 'Contained', 'Resolved', 'Closed'];
      const newStatus = p.status;
      if (!allowedStatuses.includes(newStatus)) {
        throw new Error(`Invalid emergency status '${newStatus}'.`);
      }

      const previous = { ...emergency };
      emergency.status = newStatus;
      if (p.commanderNotes != null) emergency.commanderNotes = p.commanderNotes;
      if (newStatus === 'Resolved' || newStatus === 'Closed') emergency.resolvedAt = new Date().toISOString();
      localEmergencies = [...localEmergencies];

      if (supabase) {
        const dbUpdate: any = { status: newStatus };
        if (p.commanderNotes != null) dbUpdate.commander_notes = p.commanderNotes;
        if (newStatus === 'Resolved' || newStatus === 'Closed') dbUpdate.resolved_at = new Date().toISOString();
        const { error } = await supabase.from('emergencies').update(dbUpdate).eq('id', emergency.id);
        if (error) throw new Error(`Emergency database update failed: ${error.message}`);
      }

      await writeAuditLog(userName, 'AI-confirmed emergency status update', 'Emergency', emergency.id, previous.status, newStatus);
      result = { entity: emergency, previousStatus: previous.status, newStatus };
      break;
    }

    case 'create_emergency': {
      const stationId = p.stationId || action.targetStationId;
      if (!stationId) throw new Error('A stationId is required to create an emergency.');
      const title = p.title || action.title;
      const type = p.type || 'Other';
      const severity = p.severity || 'Moderate (Level 3)';
      const status = p.status || 'Active';
      const id = `emg-${Date.now()}`;
      const incidentCode = `EMG-${new Date().getFullYear()}-${String(localEmergencies.length + 1).padStart(3, '0')}`;
      const emergency: any = {
        id,
        incidentCode,
        incident_code: incidentCode,
        title,
        type,
        stationId,
        station_id: stationId,
        locationDetails: p.locationDetails || p.location_details || 'Station operations area',
        location_details: p.locationDetails || p.location_details || 'Station operations area',
        severity,
        status,
        description: p.description || action.description,
        reportedBy: userName,
        reported_by: userName,
        reportedAt: new Date().toISOString(),
        affectedPersonnelIds: p.affectedPersonnelIds || [],
        requiredResources: p.requiredResources || [],
        commanderNotes: p.commanderNotes,
        isSeedDemo: false,
      };
      localEmergencies = [emergency, ...localEmergencies];

      if (supabase) {
        const { error } = await supabase.from('emergencies').insert({
          id,
          incident_code: incidentCode,
          title,
          type,
          station_id: stationId,
          location_details: emergency.locationDetails,
          severity,
          status,
          description: emergency.description,
          reported_by: userName,
          affected_personnel_ids: emergency.affectedPersonnelIds,
          required_resources: emergency.requiredResources,
          commander_notes: emergency.commanderNotes,
        });
        if (error) throw new Error(`Emergency creation failed: ${error.message}`);
      }

      await writeAuditLog(userName, 'AI-confirmed emergency created', 'Emergency', id, undefined, emergency);
      result = { entity: emergency };
      break;
    }
  }

  action.status = 'executed';
  action.executedAt = new Date().toISOString();
  action.result = result;
  pendingOperationalActions.delete(actionId);

  return {
    success: true,
    action,
    result,
    message: 'Operational action executed successfully and recorded in the audit log.',
  };
}
