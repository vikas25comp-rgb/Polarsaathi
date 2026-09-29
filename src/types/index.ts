export type Role = 
  | 'Administrator'
  | 'Expedition Manager'
  | 'Logistics Officer'
  | 'Station Officer'
  | 'Emergency Coordinator';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  stationId?: string;
  avatarUrl?: string;
}

export type ExpeditionStatus = 
  | 'Planned'
  | 'Preparing'
  | 'Active'
  | 'Returning'
  | 'Completed'
  | 'Cancelled';

export interface Expedition {
  id: string;
  code: string; // e.g. "ISEA-44"
  name: string;
  leaderName: string;
  stationId: string;
  startDate: string;
  endDate: string;
  status: ExpeditionStatus;
  budgetAllocated: number;
  personnelCount: number;
  cargoWeightKg: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Station {
  id: string;
  code: string;
  name: string;
  region: 'Antarctic' | 'Arctic' | 'Sub-Antarctic';
  coordinates: string; // e.g. "69°24'S, 76°11'E"
  operationalStatus: 'Fully Operational' | 'Reduced Operations' | 'Wintering Over' | 'Emergency Alert';
  capacity: number;
  currentPersonnel: number;
  temperatureCelsius: number;
  windSpeedKts: number;
  communicationStatus: 'Nominal (Satcom Primary)' | 'Degraded (HF Backup)' | 'Loss of Signal' | 'High-Latency Iridium';
  emergencyStatus: 'Normal' | 'Advisory' | 'Emergency Active';
  lastCommunication: string;
}

export type CargoStatus = 
  | 'Planned'
  | 'Packed'
  | 'Dispatched'
  | 'In Transit'
  | 'At Station'
  | 'Received'
  | 'Delayed'
  | 'Lost/Damaged';

export type CargoCategory = 
  | 'Food'
  | 'Fuel'
  | 'Medicine'
  | 'Scientific Equipment'
  | 'Spare Parts'
  | 'Machinery'
  | 'Clothing'
  | 'Personal Supplies'
  | 'Other';

export type CargoPriority = 'Critical' | 'High' | 'Medium' | 'Routine';

export interface CargoItem {
  id: string;
  trackingNumber: string; // e.g. "CRG-2026-089"
  name: string;
  category: CargoCategory;
  priority: CargoPriority;
  status: CargoStatus;
  expeditionId: string;
  destinationStationId: string;
  containerId?: string;
  weightKg: number;
  volumeM3: number;
  isHazmat: boolean;
  hazmatDetails?: string;
  temperatureControlled: boolean;
  requiredTempRange?: string;
  currentLocation: string;
  originHub: string;
  estimatedArrival: string;
  actualArrival?: string;
  receivingOfficer?: string;
  specialInstructions?: string;
  isSeedDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CargoMovement {
  id: string;
  cargoId: string;
  status: CargoStatus;
  location: string;
  timestamp: string;
  officerName: string;
  notes?: string;
}

export interface Container {
  id: string;
  code: string; // e.g. "CONT-ISO-40-01"
  type: '20ft Dry Cargo' | '40ft Heavy Arctic Spec' | 'Reefer (-25°C)' | 'Helicopter Sling Pallet' | 'Fuel ISO Tank';
  tareWeightKg: number;
  maxGrossWeightKg: number;
  currentStationOrHub: string;
  status: 'Empty' | 'Loading' | 'Sealed & Manifested' | 'In Transit' | 'Staged at Station';
}

export type InventoryCategory = 
  | 'Fuel'
  | 'Food'
  | 'Medicine'
  | 'Water & Treatment'
  | 'Scientific Consumables'
  | 'Vehicle Spares'
  | 'Power & Electrical'
  | 'Survival & Cold Gear'
  | 'Other';

export type StockRiskLevel = 'Normal' | 'Warning' | 'Critical';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  stationId: string;
  quantity: number;
  unit: string; // e.g. "Liters", "Kg", "Units", "Rations"
  minimumThreshold: number;
  criticalThreshold: number;
  dailyConsumption: number;
  expiryDate?: string;
  lastResupplyDate?: string;
  nextPlannedResupplyDate?: string;
  unitCostInr?: number;
  storageLocation: string;
  isSeedDemo?: boolean;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  stationId: string;
  type: 'Consumption' | 'Resupply' | 'Transfer In' | 'Transfer Out' | 'Disposal' | 'Correction';
  quantityDelta: number;
  balanceAfter: number;
  officerName: string;
  reason: string;
  timestamp: string;
}

export type PersonnelStatus = 
  | 'At Station'
  | 'In Transit'
  | 'Field Camp'
  | 'Transit Hub (Cape Town)'
  | 'Transit Hub (Goa NCPOR)'
  | 'Medical Leave'
  | 'Repatriated';

export interface Personnel {
  id: string;
  badgeNumber: string;
  name: string;
  role: string; // e.g. "Station Commander", "Meteorologist", "Chief Engineer", "Medical Officer"
  specialization: string;
  expeditionId: string;
  stationId: string;
  currentLocation: string;
  status: PersonnelStatus;
  bloodGroup: string;
  emergencyContact: string;
  certifications: string[]; // e.g. "Polar Field Safety", "Cold Weather First Aid", "Snowcat Operator"
  deployedDate: string;
  rotationEndDate: string;
  isSeedDemo?: boolean;
  createdAt: string;
}

export interface PersonnelMovement {
  id: string;
  personnelId: string;
  fromLocation: string;
  toLocation: string;
  transportMode: 'Research Vessel (MV Bharati)' | 'Ski-Plane (Basler BT-67)' | 'PistenBully Snowcat' | 'Helicopter' | 'Commercial Air';
  timestamp: string;
  authorizedBy: string;
  status: 'Planned' | 'En Route' | 'Completed' | 'Delayed by Weather';
}

export type AssetCondition = 'Operational' | 'Maintenance Due' | 'Under Maintenance' | 'Faulty' | 'Retired';

export interface Asset {
  id: string;
  code: string; // e.g. "AST-GEN-01"
  name: string;
  category: 'Power & Heating' | 'Vehicles & Heavy Mobile' | 'Scientific Instrumentation' | 'Communication & Radar' | 'Life Support & Water';
  serialNumber: string;
  stationId: string;
  operationalStatus: AssetCondition;
  operatingHours: number;
  criticality: 'Vital Life-Support' | 'Primary Operational' | 'Secondary Support' | 'Non-Critical';
  commissionDate: string;
  lastMaintenanceDate: string;
  nextScheduledMaintenance: string;
  assignedTeam: string;
  sparePartsNotes?: string;
  isSeedDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  maintenanceType: 'Routine Scheduled' | 'Corrective Repair' | 'Emergency Polar Overhaul' | 'Pre-Wintering Prep';
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Pending Parts';
  technicianName: string;
  performedDate: string;
  operatingHoursAtService: number;
  findings: string;
  partsReplaced?: string;
  nextDueDate: string;
}

export type EmergencyType = 
  | 'Medical'
  | 'Fire'
  | 'Equipment Failure'
  | 'Vehicle Failure'
  | 'Communication Failure'
  | 'Supply Crisis'
  | 'Weather/Environmental'
  | 'Other';

export type EmergencySeverity = 'Critical (Level 1)' | 'Severe (Level 2)' | 'Moderate (Level 3)' | 'Advisory (Level 4)';

export type EmergencyStatus = 'Active' | 'Investigating' | 'Contained' | 'Resolved' | 'Closed';

export interface EmergencyIncident {
  id: string;
  incidentCode: string; // e.g. "EMG-2026-004"
  title: string;
  type: EmergencyType;
  stationId: string;
  locationDetails: string;
  severity: EmergencySeverity;
  status: EmergencyStatus;
  description: string;
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
  affectedPersonnelIds: string[];
  requiredResources: string[];
  commanderNotes?: string;
  isSeedDemo?: boolean;
}

export interface EmergencyAction {
  id: string;
  incidentId: string;
  actionText: string;
  assignedTo: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  timestamp: string;
  completedAt?: string;
}

export interface SystemAlert {
  id: string;
  type: 'inventory_critical' | 'cargo_delayed' | 'asset_overdue' | 'emergency_active' | 'sync_warning';
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  entityType?: 'inventory' | 'cargo' | 'asset' | 'emergency';
  entityId?: string;
  read: boolean;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface WhatIfScenarioInput {
  title: string;
  stationId: string;
  resupplyDelayDays: number;
  additionalPersonnelCount: number;
  fuelConsumptionMultiplier: number;
  foodConsumptionMultiplier: number;
  generatorFailed: boolean;
  notes?: string;
}

export interface WhatIfSimulationResult {
  id: string;
  scenarioName: string;
  timestamp: string;
  stationName: string;
  simulatedDays: number;
  projectedMetrics: {
    item: string;
    normalDaysRemaining: number;
    simulatedDaysRemaining: number;
    daysUntilResupply: number;
    deficitDays: number;
    riskLevel: StockRiskLevel;
  }[];
  powerOutputCapacityPct: number;
  criticalRisksSummary: string[];
  aiExplanation?: string;
  recommendedMitigations?: string[];
}

export interface ResupplyPlanProposal {
  id: string;
  stationId: string;
  title: string;
  targetArrivalDate: string;
  transportVessel: string;
  itemsToReplenish: {
    inventoryItemId: string;
    itemName: string;
    category: InventoryCategory;
    currentStock: number;
    recommendedQuantity: number;
    unit: string;
    priority: CargoPriority;
    rationale: string;
  }[];
  aiAnalysisRationale: string;
  status: 'Proposed by AI' | 'Reviewed by Officer' | 'Approved & Manifested' | 'Rejected';
  createdAt: string;
}

export interface ReportRecord {
  id: string;
  reportCode: string;
  title: string;
  category: 'Expedition Summary' | 'Cargo Movement' | 'Inventory & Depletion' | 'Personnel Deployment' | 'Asset Health' | 'Emergency After-Action';
  generatedBy: string;
  generatedAt: string;
  stationId?: string;
  contentMarkdown: string;
  aiGeneratedSummary: boolean;
  summaryHighlights: string[];
}

export interface OfflineSyncItem {
  id: string;
  timestamp: string;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  recordId: string;
  data: any;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  error?: string;
}
