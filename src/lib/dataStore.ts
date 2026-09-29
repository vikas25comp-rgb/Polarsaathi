import {
  Station,
  Expedition,
  CargoItem,
  CargoMovement,
  Container,
  InventoryItem,
  InventoryTransaction,
  Personnel,
  PersonnelMovement,
  Asset,
  AssetMaintenance,
  EmergencyIncident,
  EmergencyAction,
  SystemAlert,
  AuditLog,
  ReportRecord,
  ResupplyPlanProposal,
  OfflineSyncItem,
  StockRiskLevel
} from '../types';
import {
  SEED_STATIONS,
  SEED_EXPEDITIONS,
  SEED_CONTAINERS,
  SEED_CARGO,
  SEED_CARGO_MOVEMENTS,
  SEED_INVENTORY,
  SEED_PERSONNEL,
  SEED_PERSONNEL_MOVEMENTS,
  SEED_ASSETS,
  SEED_ASSET_MAINTENANCE,
  SEED_EMERGENCIES,
  SEED_EMERGENCY_ACTIONS,
  SEED_ALERTS,
  SEED_AUDIT_LOGS,
  SEED_REPORTS
} from './seedData';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  STATIONS: 'polar_stations_v1',
  EXPEDITIONS: 'polar_expeditions_v1',
  CONTAINERS: 'polar_containers_v1',
  CARGO: 'polar_cargo_v1',
  CARGO_MOVEMENTS: 'polar_cargo_movements_v1',
  INVENTORY: 'polar_inventory_v1',
  INVENTORY_TXNS: 'polar_inventory_txns_v1',
  PERSONNEL: 'polar_personnel_v1',
  PERSONNEL_MOVEMENTS: 'polar_personnel_movements_v1',
  ASSETS: 'polar_assets_v1',
  ASSET_MAINTENANCE: 'polar_asset_maint_v1',
  EMERGENCIES: 'polar_emergencies_v1',
  EMERGENCY_ACTIONS: 'polar_emergency_actions_v1',
  ALERTS: 'polar_alerts_v1',
  AUDIT_LOGS: 'polar_audit_logs_v1',
  REPORTS: 'polar_reports_v1',
  RESUPPLY_PLANS: 'polar_resupply_plans_v1',
  OFFLINE_QUEUE: 'polar_offline_queue_v1',
  FORCED_OFFLINE: 'polar_forced_offline_v1',
};

class DataStoreService {
  private listeners: Set<() => void> = new Set();
  private isOnlineStatus: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnlineStatus = true;
        this.processSyncQueue();
        this.notifyListeners();
      });
      window.addEventListener('offline', () => {
        this.isOnlineStatus = false;
        this.notifyListeners();
      });
      this.initDefaultData();
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn());
  }

  // --- Offline & Connection State ---
  public isForcedOffline(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.FORCED_OFFLINE) === 'true';
  }

  public setForcedOffline(forced: boolean) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.FORCED_OFFLINE, String(forced));
    if (!forced && this.isOnlineStatus) {
      this.processSyncQueue();
    }
    this.notifyListeners();
  }

  public isConnected(): boolean {
    if (this.isForcedOffline()) return false;
    return this.isOnlineStatus;
  }

  // --- Seed Initialization ---
  private initDefaultData() {
    if (!localStorage.getItem(STORAGE_KEYS.STATIONS)) {
      localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(SEED_STATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXPEDITIONS)) {
      localStorage.setItem(STORAGE_KEYS.EXPEDITIONS, JSON.stringify(SEED_EXPEDITIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONTAINERS)) {
      localStorage.setItem(STORAGE_KEYS.CONTAINERS, JSON.stringify(SEED_CONTAINERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CARGO)) {
      localStorage.setItem(STORAGE_KEYS.CARGO, JSON.stringify(SEED_CARGO));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CARGO_MOVEMENTS)) {
      localStorage.setItem(STORAGE_KEYS.CARGO_MOVEMENTS, JSON.stringify(SEED_CARGO_MOVEMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVENTORY)) {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(SEED_INVENTORY));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PERSONNEL)) {
      localStorage.setItem(STORAGE_KEYS.PERSONNEL, JSON.stringify(SEED_PERSONNEL));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PERSONNEL_MOVEMENTS)) {
      localStorage.setItem(STORAGE_KEYS.PERSONNEL_MOVEMENTS, JSON.stringify(SEED_PERSONNEL_MOVEMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ASSETS)) {
      localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(SEED_ASSETS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ASSET_MAINTENANCE)) {
      localStorage.setItem(STORAGE_KEYS.ASSET_MAINTENANCE, JSON.stringify(SEED_ASSET_MAINTENANCE));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EMERGENCIES)) {
      localStorage.setItem(STORAGE_KEYS.EMERGENCIES, JSON.stringify(SEED_EMERGENCIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EMERGENCY_ACTIONS)) {
      localStorage.setItem(STORAGE_KEYS.EMERGENCY_ACTIONS, JSON.stringify(SEED_EMERGENCY_ACTIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ALERTS)) {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(SEED_ALERTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(SEED_AUDIT_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(SEED_REPORTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE)) {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify([]));
    }
  }

  // Helper read/write
  private getLocal<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setLocal<T>(key: string, value: T) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
    this.notifyListeners();
  }

  // --- Offline Sync Queue ---
  public getSyncQueue(): OfflineSyncItem[] {
    return this.getLocal<OfflineSyncItem[]>(STORAGE_KEYS.OFFLINE_QUEUE, []);
  }

  public getPendingSyncCount(): number {
    return this.getSyncQueue().filter((q) => q.status === 'pending').length;
  }

  private queueSyncOperation(table: string, action: 'INSERT' | 'UPDATE' | 'DELETE', recordId: string, data: any) {
    const queue = this.getSyncQueue();
    const item: OfflineSyncItem = {
      id: 'sync-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      table,
      action,
      recordId,
      data,
      status: 'pending',
    };
    queue.push(item);
    this.setLocal(STORAGE_KEYS.OFFLINE_QUEUE, queue);

    // If online & Supabase configured, attempt immediate push
    if (this.isConnected() && isSupabaseConfigured()) {
      this.processSyncQueue();
    }
  }

  public async processSyncQueue(): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
    if (!this.isConnected() || !isSupabaseConfigured()) {
      return { success: false, syncedCount: 0, errors: ['Offline or Supabase not configured'] };
    }

    const queue = this.getSyncQueue();
    const pending = queue.filter((i) => i.status === 'pending');
    if (pending.length === 0) {
      return { success: true, syncedCount: 0, errors: [] };
    }

    let syncedCount = 0;
    const errors: string[] = [];

    for (const item of pending) {
      try {
        item.status = 'syncing';
        // Map table name
        const tbl = item.table;
        if (item.action === 'INSERT') {
          const { error } = await supabase.from(tbl).upsert(item.data);
          if (error) throw error;
        } else if (item.action === 'UPDATE') {
          const { error } = await supabase.from(tbl).update(item.data).eq('id', item.recordId);
          if (error) throw error;
        } else if (item.action === 'DELETE') {
          const { error } = await supabase.from(tbl).delete().eq('id', item.recordId);
          if (error) throw error;
        }
        item.status = 'synced';
        syncedCount++;
      } catch (err: any) {
        item.status = 'failed';
        item.error = err?.message || 'Sync error';
        errors.push(`${item.table}:${item.recordId} - ${item.error}`);
      }
    }

    // Keep only last 50 synced items for history audit
    const remaining = queue.filter((i) => i.status !== 'synced');
    this.setLocal(STORAGE_KEYS.OFFLINE_QUEUE, remaining);
    this.notifyListeners();

    if (syncedCount > 0) {
      this.logAudit('System Sync Agent', 'Offline Changes Replayed to Supabase', 'SyncQueue', `${syncedCount} records`);
    }

    return { success: errors.length === 0, syncedCount, errors };
  }

  // --- Audit Logging ---
  public logAudit(userName: string, action: string, entity: string, entityId: string, prevVal?: string, newVal?: string) {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: 'aud-' + Date.now(),
      userName,
      action,
      entity,
      entityId,
      previousValue: prevVal,
      newValue: newVal,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    this.setLocal(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 100)); // keep top 100
  }

  public getAuditLogs(): AuditLog[] {
    return this.getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
  }

  // --- Stations ---
  public getStations(): Station[] {
    return this.getLocal<Station[]>(STORAGE_KEYS.STATIONS, SEED_STATIONS);
  }

  public updateStation(id: string, updates: Partial<Station>, user: string = 'Operator'): Station {
    const list = this.getStations();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Station not found');
    const old = list[idx];
    const updated = { ...old, ...updates, lastCommunication: new Date().toISOString() };
    list[idx] = updated;
    this.setLocal(STORAGE_KEYS.STATIONS, list);
    this.queueSyncOperation('stations', 'UPDATE', id, updated);
    this.logAudit(user, 'Station Status Updated', 'Station', id, old.operationalStatus, updated.operationalStatus);
    return updated;
  }

  // --- Expeditions ---
  public getExpeditions(): Expedition[] {
    return this.getLocal<Expedition[]>(STORAGE_KEYS.EXPEDITIONS, SEED_EXPEDITIONS);
  }

  public createExpedition(item: Omit<Expedition, 'id' | 'createdAt' | 'updatedAt'>, user: string = 'Expedition Manager'): Expedition {
    const list = this.getExpeditions();
    const newExp: Expedition = {
      ...item,
      id: 'exp-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(newExp);
    this.setLocal(STORAGE_KEYS.EXPEDITIONS, list);
    this.queueSyncOperation('expeditions', 'INSERT', newExp.id, newExp);
    this.logAudit(user, 'Expedition Created', 'Expedition', newExp.id, undefined, newExp.code);
    return newExp;
  }

  public updateExpedition(id: string, updates: Partial<Expedition>, user: string = 'Expedition Manager'): Expedition {
    const list = this.getExpeditions();
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Expedition not found');
    const old = list[idx];
    const updated = { ...old, ...updates, updatedAt: new Date().toISOString() };
    list[idx] = updated;
    this.setLocal(STORAGE_KEYS.EXPEDITIONS, list);
    this.queueSyncOperation('expeditions', 'UPDATE', id, updated);
    this.logAudit(user, 'Expedition Updated', 'Expedition', id, old.status, updated.status);
    return updated;
  }

  // --- Cargo & Movements ---
  public getCargo(): CargoItem[] {
    return this.getLocal<CargoItem[]>(STORAGE_KEYS.CARGO, SEED_CARGO);
  }

  public createCargo(item: Omit<CargoItem, 'id' | 'createdAt' | 'updatedAt'>, user: string = 'Logistics Officer'): CargoItem {
    const list = this.getCargo();
    const newCargo: CargoItem = {
      ...item,
      id: 'crg-' + Date.now(),
      isSeedDemo: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(newCargo);
    this.setLocal(STORAGE_KEYS.CARGO, list);
    this.queueSyncOperation('cargo', 'INSERT', newCargo.id, newCargo);

    // Initial movement record
    this.addCargoMovement({
      cargoId: newCargo.id,
      status: newCargo.status,
      location: newCargo.currentLocation || newCargo.originHub,
      officerName: user,
      notes: 'Initial cargo consignment registered.',
    });

    this.logAudit(user, 'Cargo Registered', 'Cargo', newCargo.id, undefined, `${newCargo.trackingNumber} (${newCargo.name})`);
    return newCargo;
  }

  public updateCargoStatus(
    id: string,
    newStatus: CargoItem['status'],
    currentLocation: string,
    officerName: string,
    notes?: string
  ): CargoItem {
    const list = this.getCargo();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Cargo not found');
    const old = list[idx];
    const updated: CargoItem = {
      ...old,
      status: newStatus,
      currentLocation,
      actualArrival: newStatus === 'Received' || newStatus === 'At Station' ? new Date().toISOString().split('T')[0] : old.actualArrival,
      receivingOfficer: newStatus === 'Received' ? officerName : old.receivingOfficer,
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    this.setLocal(STORAGE_KEYS.CARGO, list);
    this.queueSyncOperation('cargo', 'UPDATE', id, updated);

    // Record movement timeline
    this.addCargoMovement({
      cargoId: id,
      status: newStatus,
      location: currentLocation,
      officerName,
      notes: notes || `Status updated from ${old.status} to ${newStatus}`,
    });

    // Alert if delayed
    if (newStatus === 'Delayed') {
      this.createAlert({
        type: 'cargo_delayed',
        title: `Cargo Consignment Delayed: ${updated.trackingNumber}`,
        message: `${updated.name} has been marked DELAYED at ${currentLocation}. Reason: ${notes || 'Logistics delay'}.`,
        severity: 'warning',
        entityType: 'cargo',
        entityId: id,
      });
    }

    this.logAudit(officerName, 'Cargo Status Changed', 'Cargo', id, old.status, newStatus);
    return updated;
  }

  public getCargoMovements(cargoId?: string): CargoMovement[] {
    const list = this.getLocal<CargoMovement[]>(STORAGE_KEYS.CARGO_MOVEMENTS, SEED_CARGO_MOVEMENTS);
    if (cargoId) return list.filter((m) => m.cargoId === cargoId);
    return list;
  }

  private addCargoMovement(movement: Omit<CargoMovement, 'id' | 'timestamp'>) {
    const list = this.getCargoMovements();
    const newMove: CargoMovement = {
      ...movement,
      id: 'cm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
    };
    list.unshift(newMove);
    this.setLocal(STORAGE_KEYS.CARGO_MOVEMENTS, list);
    this.queueSyncOperation('cargo_movements', 'INSERT', newMove.id, newMove);
  }

  // --- Containers ---
  public getContainers(): Container[] {
    return this.getLocal<Container[]>(STORAGE_KEYS.CONTAINERS, SEED_CONTAINERS);
  }

  public createContainer(container: Omit<Container, 'id'>): Container {
    const list = this.getContainers();
    const newCont: Container = { ...container, id: 'cont-' + Date.now() };
    list.unshift(newCont);
    this.setLocal(STORAGE_KEYS.CONTAINERS, list);
    this.queueSyncOperation('containers', 'INSERT', newCont.id, newCont);
    return newCont;
  }

  // --- Inventory & Predictive Calculations ---
  public getInventory(): InventoryItem[] {
    return this.getLocal<InventoryItem[]>(STORAGE_KEYS.INVENTORY, SEED_INVENTORY);
  }

  public calculateInventoryMetrics(item: InventoryItem): {
    daysRemaining: number;
    riskLevel: StockRiskLevel;
    projectedDepletionDate: string;
    daysUntilResupply: number | null;
    supplyGapDays: number | null;
    isBelowCritical: boolean;
    isBelowMinimum: boolean;
  } {
    const consumption = item.dailyConsumption > 0 ? item.dailyConsumption : 1;
    const daysRemaining = Number((item.quantity / consumption).toFixed(1));

    let riskLevel: StockRiskLevel = 'Normal';
    if (item.quantity <= item.criticalThreshold) {
      riskLevel = 'Critical';
    } else if (item.quantity <= item.minimumThreshold) {
      riskLevel = 'Warning';
    }

    // Projected depletion date
    const depletionDate = new Date();
    depletionDate.setDate(depletionDate.getDate() + Math.floor(daysRemaining));
    const projectedDepletionDate = depletionDate.toISOString().split('T')[0];

    // Resupply calculations
    let daysUntilResupply: number | null = null;
    let supplyGapDays: number | null = null;

    if (item.nextPlannedResupplyDate) {
      const targetDate = new Date(item.nextPlannedResupplyDate);
      const now = new Date();
      const diffTime = targetDate.getTime() - now.getTime();
      daysUntilResupply = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      if (daysRemaining < daysUntilResupply) {
        supplyGapDays = Number((daysUntilResupply - daysRemaining).toFixed(1));
        riskLevel = 'Critical'; // Overwrite to Critical if depletion precedes resupply!
      }
    }

    return {
      daysRemaining,
      riskLevel,
      projectedDepletionDate,
      daysUntilResupply,
      supplyGapDays,
      isBelowCritical: item.quantity <= item.criticalThreshold,
      isBelowMinimum: item.quantity <= item.minimumThreshold,
    };
  }

  public createInventoryItem(item: Omit<InventoryItem, 'id' | 'updatedAt'>, user: string = 'Station Logistics Officer'): InventoryItem {
    const list = this.getInventory();
    const newItem: InventoryItem = {
      ...item,
      id: 'inv-' + Date.now(),
      isSeedDemo: false,
      updatedAt: new Date().toISOString(),
    };
    list.unshift(newItem);
    this.setLocal(STORAGE_KEYS.INVENTORY, list);
    this.queueSyncOperation('inventory_items', 'INSERT', newItem.id, newItem);

    // Initial transaction log
    this.logInventoryTransaction({
      itemId: newItem.id,
      stationId: newItem.stationId,
      type: 'Resupply',
      quantityDelta: newItem.quantity,
      balanceAfter: newItem.quantity,
      officerName: user,
      reason: 'Initial station stock registration',
    });

    this.logAudit(user, 'Inventory Item Registered', 'Inventory', newItem.id, undefined, `${newItem.name} (${newItem.quantity} ${newItem.unit})`);
    return newItem;
  }

  public updateInventoryQuantity(
    id: string,
    newQuantity: number,
    reason: string,
    officerName: string,
    type: InventoryTransaction['type'] = 'Correction'
  ): InventoryItem {
    const list = this.getInventory();
    const idx = list.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Inventory item not found');
    const old = list[idx];
    const delta = newQuantity - old.quantity;

    const updated: InventoryItem = {
      ...old,
      quantity: Math.max(0, newQuantity),
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    this.setLocal(STORAGE_KEYS.INVENTORY, list);
    this.queueSyncOperation('inventory_items', 'UPDATE', id, updated);

    // Transaction record
    this.logInventoryTransaction({
      itemId: id,
      stationId: old.stationId,
      type,
      quantityDelta: delta,
      balanceAfter: updated.quantity,
      officerName,
      reason,
    });

    // Check thresholds & create alert if crossed
    const metrics = this.calculateInventoryMetrics(updated);
    if (metrics.riskLevel === 'Critical') {
      this.createAlert({
        type: 'inventory_critical',
        title: `CRITICAL SUPPLY GAP: ${updated.name}`,
        message: `${updated.name} stock has reached ${updated.quantity} ${updated.unit}. Projected autonomy is ${metrics.daysRemaining} days (Critical threshold: ${updated.criticalThreshold}).`,
        severity: 'critical',
        entityType: 'inventory',
        entityId: id,
      });
    }

    this.logAudit(officerName, 'Inventory Quantity Updated', 'Inventory', id, `${old.quantity} ${old.unit}`, `${updated.quantity} ${updated.unit}`);
    return updated;
  }

  private logInventoryTransaction(tx: Omit<InventoryTransaction, 'id' | 'timestamp'>) {
    const list = this.getLocal<InventoryTransaction[]>(STORAGE_KEYS.INVENTORY_TXNS, []);
    const newTx: InventoryTransaction = {
      ...tx,
      id: 'itx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
    };
    list.unshift(newTx);
    this.setLocal(STORAGE_KEYS.INVENTORY_TXNS, list);
    this.queueSyncOperation('inventory_transactions', 'INSERT', newTx.id, newTx);
  }

  // --- Personnel & Movements ---
  public getPersonnel(): Personnel[] {
    return this.getLocal<Personnel[]>(STORAGE_KEYS.PERSONNEL, SEED_PERSONNEL);
  }

  public createPersonnel(person: Omit<Personnel, 'id' | 'createdAt'>, user: string = 'Expedition Admin'): Personnel {
    const list = this.getPersonnel();
    const newPerson: Personnel = {
      ...person,
      id: 'prs-' + Date.now(),
      isSeedDemo: false,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newPerson);
    this.setLocal(STORAGE_KEYS.PERSONNEL, list);
    this.queueSyncOperation('personnel', 'INSERT', newPerson.id, newPerson);
    this.logAudit(user, 'Personnel Deployed', 'Personnel', newPerson.id, undefined, `${newPerson.name} (${newPerson.role})`);
    return newPerson;
  }

  public updatePersonnelMovement(
    id: string,
    toLocation: string,
    transportMode: PersonnelMovement['transportMode'],
    authorizedBy: string
  ): Personnel {
    const list = this.getPersonnel();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Personnel not found');
    const old = list[idx];
    const prevLoc = old.currentLocation;

    let newStatus: Personnel['status'] = 'At Station';
    if (toLocation.toLowerCase().includes('field') || toLocation.toLowerCase().includes('traverse')) {
      newStatus = 'Field Camp';
    } else if (toLocation.toLowerCase().includes('transit') || toLocation.toLowerCase().includes('vessel')) {
      newStatus = 'In Transit';
    }

    const updated: Personnel = {
      ...old,
      currentLocation: toLocation,
      status: newStatus,
    };
    list[idx] = updated;
    this.setLocal(STORAGE_KEYS.PERSONNEL, list);
    this.queueSyncOperation('personnel', 'UPDATE', id, updated);

    // Movement history
    const movements = this.getLocal<PersonnelMovement[]>(STORAGE_KEYS.PERSONNEL_MOVEMENTS, SEED_PERSONNEL_MOVEMENTS);
    const newMove: PersonnelMovement = {
      id: 'pm-' + Date.now(),
      personnelId: id,
      fromLocation: prevLoc,
      toLocation,
      transportMode,
      timestamp: new Date().toISOString(),
      authorizedBy,
      status: 'Completed',
    };
    movements.unshift(newMove);
    this.setLocal(STORAGE_KEYS.PERSONNEL_MOVEMENTS, movements);
    this.queueSyncOperation('personnel_movements', 'INSERT', newMove.id, newMove);

    this.logAudit(authorizedBy, 'Personnel Movement Recorded', 'Personnel', id, prevLoc, toLocation);
    return updated;
  }

  // --- Assets & Maintenance ---
  public getAssets(): Asset[] {
    return this.getLocal<Asset[]>(STORAGE_KEYS.ASSETS, SEED_ASSETS);
  }

  public updateAssetStatus(
    id: string,
    status: Asset['operationalStatus'],
    user: string = 'Operator'
  ): Asset {
    const list = this.getAssets();
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Asset not found');
    const old = list[idx];
    const updated = { ...old, operationalStatus: status, updatedAt: new Date().toISOString() };
    list[idx] = updated;
    this.setLocal(STORAGE_KEYS.ASSETS, list);
    this.queueSyncOperation('assets', 'UPDATE', id, updated);
    this.logAudit(user, 'Asset Status Updated', 'Asset', id, old.operationalStatus, status);
    return updated;
  }

  public createAsset(asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>, user: string = 'Station Engineer'): Asset {
    const list = this.getAssets();
    const newAsset: Asset = {
      ...asset,
      id: 'ast-' + Date.now(),
      isSeedDemo: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(newAsset);
    this.setLocal(STORAGE_KEYS.ASSETS, list);
    this.queueSyncOperation('assets', 'INSERT', newAsset.id, newAsset);
    this.logAudit(user, 'Asset Commissioned', 'Asset', newAsset.id, undefined, `${newAsset.code} (${newAsset.name})`);
    return newAsset;
  }

  public recordAssetMaintenance(
    assetId: string,
    maintenance: Omit<AssetMaintenance, 'id' | 'assetId'>,
    user: string = 'Technician'
  ): AssetMaintenance {
    const assets = this.getAssets();
    const idx = assets.findIndex((a) => a.id === assetId);
    if (idx === -1) throw new Error('Asset not found');

    const maintList = this.getLocal<AssetMaintenance[]>(STORAGE_KEYS.ASSET_MAINTENANCE, SEED_ASSET_MAINTENANCE);
    const newMaint: AssetMaintenance = {
      ...maintenance,
      id: 'maint-' + Date.now(),
      assetId,
    };
    maintList.unshift(newMaint);
    this.setLocal(STORAGE_KEYS.ASSET_MAINTENANCE, maintList);
    this.queueSyncOperation('asset_maintenance', 'INSERT', newMaint.id, newMaint);

    // Update asset
    assets[idx] = {
      ...assets[idx],
      operationalStatus: 'Operational',
      lastMaintenanceDate: maintenance.performedDate,
      nextScheduledMaintenance: maintenance.nextDueDate,
      operatingHours: maintenance.operatingHoursAtService,
      updatedAt: new Date().toISOString(),
    };
    this.setLocal(STORAGE_KEYS.ASSETS, assets);
    this.queueSyncOperation('assets', 'UPDATE', assetId, assets[idx]);

    this.logAudit(user, 'Asset Maintenance Recorded', 'Asset', assetId, undefined, `Service: ${maintenance.maintenanceType}`);
    return newMaint;
  }

  public getAssetMaintenance(assetId?: string): AssetMaintenance[] {
    const list = this.getLocal<AssetMaintenance[]>(STORAGE_KEYS.ASSET_MAINTENANCE, SEED_ASSET_MAINTENANCE);
    if (assetId) return list.filter((m) => m.assetId === assetId);
    return list;
  }

  // --- Emergencies & Command Snapshot ---
  public getEmergencies(): EmergencyIncident[] {
    return this.getLocal<EmergencyIncident[]>(STORAGE_KEYS.EMERGENCIES, SEED_EMERGENCIES);
  }

  public mergeEmergencyFromServer(emergency: EmergencyIncident) {
    const list = this.getEmergencies();
    const idx = list.findIndex((e) => e.id === emergency.id);
    if (idx >= 0) list[idx] = emergency;
    else list.unshift(emergency);
    this.setLocal(STORAGE_KEYS.EMERGENCIES, list);
    return emergency;
  }

  public createEmergency(
    incident: Omit<EmergencyIncident, 'id' | 'incidentCode' | 'reportedAt'>,
    user: string = 'Emergency Coordinator'
  ): EmergencyIncident {
    const list = this.getEmergencies();
    const newCode = `EMG-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`;
    const newEmg: EmergencyIncident = {
      ...incident,
      id: 'emg-' + Date.now(),
      incidentCode: newCode,
      reportedAt: new Date().toISOString(),
      isSeedDemo: false,
    };
    list.unshift(newEmg);
    this.setLocal(STORAGE_KEYS.EMERGENCIES, list);
    this.queueSyncOperation('emergencies', 'INSERT', newEmg.id, newEmg);

    // Alert & Station status update
    this.createAlert({
      type: 'emergency_active',
      title: `ACTIVE EMERGENCY: ${newEmg.title}`,
      message: `Station: ${newEmg.stationId} | Severity: ${newEmg.severity} | Location: ${newEmg.locationDetails}`,
      severity: 'critical',
      entityType: 'emergency',
      entityId: newEmg.id,
    });

    this.logAudit(user, 'Emergency Incident Declared', 'Emergency', newEmg.id, undefined, `${newCode}: ${newEmg.title}`);
    return newEmg;
  }

  public updateEmergencyStatus(
    id: string,
    status: EmergencyIncident['status'],
    commanderNotes?: string,
    user: string = 'Emergency Commander'
  ): EmergencyIncident {
    const list = this.getEmergencies();
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Emergency incident not found');
    const old = list[idx];
    const updated: EmergencyIncident = {
      ...old,
      status,
      commanderNotes: commanderNotes || old.commanderNotes,
      resolvedAt: status === 'Resolved' || status === 'Closed' ? new Date().toISOString() : old.resolvedAt,
    };
    list[idx] = updated;
    this.setLocal(STORAGE_KEYS.EMERGENCIES, list);
    this.queueSyncOperation('emergencies', 'UPDATE', id, updated);

    this.logAudit(user, 'Emergency Status Changed', 'Emergency', id, old.status, status);
    return updated;
  }

  public getEmergencyActions(incidentId?: string): EmergencyAction[] {
    const list = this.getLocal<EmergencyAction[]>(STORAGE_KEYS.EMERGENCY_ACTIONS, SEED_EMERGENCY_ACTIONS);
    if (incidentId) return list.filter((a) => a.incidentId === incidentId);
    return list;
  }

  public addEmergencyAction(incidentId: string, actionText: string, assignedTo: string): EmergencyAction {
    const list = this.getEmergencyActions();
    const newAction: EmergencyAction = {
      id: 'ea-' + Date.now(),
      incidentId,
      actionText,
      assignedTo,
      status: 'Pending',
      timestamp: new Date().toISOString(),
    };
    list.unshift(newAction);
    this.setLocal(STORAGE_KEYS.EMERGENCY_ACTIONS, list);
    this.queueSyncOperation('emergency_actions', 'INSERT', newAction.id, newAction);
    return newAction;
  }

  public updateEmergencyActionStatus(actionId: string, status: EmergencyAction['status']): EmergencyAction {
    const list = this.getEmergencyActions();
    const idx = list.findIndex((a) => a.id === actionId);
    if (idx === -1) throw new Error('Action not found');
    list[idx] = {
      ...list[idx],
      status,
      completedAt: status === 'Completed' ? new Date().toISOString() : undefined,
    };
    this.setLocal(STORAGE_KEYS.EMERGENCY_ACTIONS, list);
    this.queueSyncOperation('emergency_actions', 'UPDATE', actionId, list[idx]);
    return list[idx];
  }

  /**
   * Section 16 Requirement: Automatic Emergency Snapshot
   * When an emergency is opened, automatically retrieve:
   * - Personnel currently at affected station
   * - Critical assets available
   * - Available vehicles
   * - Nearby inventory
   * - Medical supplies
   * - Communication status
   * - Open incidents
   * - Relevant cargo
   */
  public getEmergencySnapshot(stationId: string) {
    const stations = this.getStations();
    const station = stations.find((s) => s.id === stationId);
    const stationPersonnel = this.getPersonnel().filter(
      (p) => p.stationId === stationId && (p.status === 'At Station' || p.status === 'Field Camp')
    );
    const stationAssets = this.getAssets().filter((a) => a.stationId === stationId);
    const criticalAssets = stationAssets.filter((a) => a.criticality === 'Vital Life-Support' || a.criticality === 'Primary Operational');
    const availableVehicles = stationAssets.filter(
      (a) => a.category === 'Vehicles & Heavy Mobile' && a.operationalStatus === 'Operational'
    );
    const stationInventory = this.getInventory().filter((i) => i.stationId === stationId);
    const medicalSupplies = stationInventory.filter((i) => i.category === 'Medicine');
    const stationCargo = this.getCargo().filter(
      (c) => c.destinationStationId === stationId && (c.status === 'In Transit' || c.status === 'At Station' || c.status === 'Dispatched')
    );
    const openIncidents = this.getEmergencies().filter((e) => e.stationId === stationId && e.status !== 'Closed');

    return {
      station,
      personnel: stationPersonnel,
      criticalAssets,
      vehicles: availableVehicles,
      inventory: stationInventory,
      medicalSupplies,
      cargo: stationCargo,
      openIncidents,
      communicationStatus: station ? station.communicationStatus : 'Unknown',
      currentWeather: station ? `${station.temperatureCelsius}°C, Wind ${station.windSpeedKts} kts` : 'N/A',
    };
  }

  // --- Alerts ---
  public getAlerts(): SystemAlert[] {
    return this.getLocal<SystemAlert[]>(STORAGE_KEYS.ALERTS, SEED_ALERTS);
  }

  public createAlert(alert: Omit<SystemAlert, 'id' | 'timestamp' | 'read'>): SystemAlert {
    const list = this.getAlerts();
    const newAlert: SystemAlert = {
      ...alert,
      id: 'alt-' + Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    list.unshift(newAlert);
    this.setLocal(STORAGE_KEYS.ALERTS, list);
    return newAlert;
  }

  public markAlertAsRead(id: string) {
    const list = this.getAlerts();
    const idx = list.findIndex((a) => a.id === id);
    if (idx !== -1) {
      list[idx].read = true;
      this.setLocal(STORAGE_KEYS.ALERTS, list);
    }
  }

  public dismissAlert(id: string) {
    const list = this.getAlerts().filter((a) => a.id !== id);
    this.setLocal(STORAGE_KEYS.ALERTS, list);
  }

  // --- Reports ---
  public getReports(): ReportRecord[] {
    return this.getLocal<ReportRecord[]>(STORAGE_KEYS.REPORTS, SEED_REPORTS);
  }

  public saveReport(report: Omit<ReportRecord, 'id' | 'generatedAt' | 'reportCode'>): ReportRecord {
    const list = this.getReports();
    const code = `REP-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`;
    const newRep: ReportRecord = {
      ...report,
      id: 'rep-' + Date.now(),
      reportCode: code,
      generatedAt: new Date().toISOString(),
    };
    list.unshift(newRep);
    this.setLocal(STORAGE_KEYS.REPORTS, list);
    this.queueSyncOperation('reports', 'INSERT', newRep.id, newRep);
    return newRep;
  }

  // --- Resupply Plans ---
  public getResupplyPlans(): ResupplyPlanProposal[] {
    return this.getLocal<ResupplyPlanProposal[]>(STORAGE_KEYS.RESUPPLY_PLANS, []);
  }

  public saveResupplyPlan(plan: Omit<ResupplyPlanProposal, 'id' | 'createdAt'>): ResupplyPlanProposal {
    const list = this.getResupplyPlans();
    const newPlan: ResupplyPlanProposal = {
      ...plan,
      id: 'rsp-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    list.unshift(newPlan);
    this.setLocal(STORAGE_KEYS.RESUPPLY_PLANS, list);
    this.queueSyncOperation('resupply_plans', 'INSERT', newPlan.id, newPlan);
    return newPlan;
  }

  public updateResupplyPlanStatus(planId: string, status: ResupplyPlanProposal['status'], user: string): ResupplyPlanProposal {
    const list = this.getResupplyPlans();
    const idx = list.findIndex((p) => p.id === planId);
    if (idx === -1) throw new Error('Resupply plan not found');
    list[idx].status = status;
    this.setLocal(STORAGE_KEYS.RESUPPLY_PLANS, list);
    this.queueSyncOperation('resupply_plans', 'UPDATE', planId, list[idx]);
    this.logAudit(user, `Resupply Plan ${status}`, 'ResupplyPlan', planId, undefined, status);
    return list[idx];
  }

  // --- Seed Data Management ---
  public clearDemoSeedData() {
    this.setLocal(STORAGE_KEYS.CARGO, this.getCargo().filter((c) => !c.isSeedDemo));
    this.setLocal(STORAGE_KEYS.INVENTORY, this.getInventory().filter((i) => !i.isSeedDemo));
    this.setLocal(STORAGE_KEYS.PERSONNEL, this.getPersonnel().filter((p) => !p.isSeedDemo));
    this.setLocal(STORAGE_KEYS.ASSETS, this.getAssets().filter((a) => !a.isSeedDemo));
    this.setLocal(STORAGE_KEYS.EMERGENCIES, this.getEmergencies().filter((e) => !e.isSeedDemo));
    this.logAudit('Administrator', 'Cleared Demonstration Seed Records', 'Database', 'All', undefined, 'User data preserved');
  }

  public resetAllToSeedData() {
    localStorage.removeItem(STORAGE_KEYS.STATIONS);
    localStorage.removeItem(STORAGE_KEYS.EXPEDITIONS);
    localStorage.removeItem(STORAGE_KEYS.CONTAINERS);
    localStorage.removeItem(STORAGE_KEYS.CARGO);
    localStorage.removeItem(STORAGE_KEYS.CARGO_MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.INVENTORY);
    localStorage.removeItem(STORAGE_KEYS.INVENTORY_TXNS);
    localStorage.removeItem(STORAGE_KEYS.PERSONNEL);
    localStorage.removeItem(STORAGE_KEYS.PERSONNEL_MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.ASSETS);
    localStorage.removeItem(STORAGE_KEYS.ASSET_MAINTENANCE);
    localStorage.removeItem(STORAGE_KEYS.EMERGENCIES);
    localStorage.removeItem(STORAGE_KEYS.EMERGENCY_ACTIONS);
    localStorage.removeItem(STORAGE_KEYS.ALERTS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    localStorage.removeItem(STORAGE_KEYS.RESUPPLY_PLANS);
    this.initDefaultData();
    this.notifyListeners();
  }
}

export const dataStore = new DataStoreService();
