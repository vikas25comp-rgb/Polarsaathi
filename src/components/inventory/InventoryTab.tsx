import React, { useState } from 'react';
import {
  Layers,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Building2,
  Calendar,
  Search,
  Filter,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';
import { dataStore } from '../../lib/dataStore';
import { InventoryItem, InventoryCategory, InventoryTransaction } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const InventoryTab: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>(dataStore.getInventory());
  const [selectedStationId, setSelectedStationId] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateQtyModalOpen, setIsUpdateQtyModalOpen] = useState(false);
  const [selectedItemForUpdate, setSelectedItemForUpdate] = useState<InventoryItem | null>(null);

  // Update Qty Form
  const [newQuantityInput, setNewQuantityInput] = useState<number>(0);
  const [updateReason, setUpdateReason] = useState<string>('');
  const [updateType, setUpdateType] = useState<InventoryTransaction['type']>('Consumption');

  // Create Form State
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<InventoryCategory>('Fuel');
  const [formStationId, setFormStationId] = useState('st-bharati');
  const [formQuantity, setFormQuantity] = useState<number>(5000);
  const [formUnit, setFormUnit] = useState('Liters');
  const [formMinThreshold, setFormMinThreshold] = useState<number>(3000);
  const [formCriticalThreshold, setFormCriticalThreshold] = useState<number>(1500);
  const [formDailyConsumption, setFormDailyConsumption] = useState<number>(150);
  const [formStorageLocation, setFormStorageLocation] = useState('Central Fuel Farm Tank 3');

  const stations = dataStore.getStations();

  const handleOpenUpdateModal = (item: InventoryItem) => {
    setSelectedItemForUpdate(item);
    setNewQuantityInput(item.quantity);
    setUpdateReason('');
    setUpdateType('Consumption');
    setIsUpdateQtyModalOpen(true);
  };

  const handleUpdateQuantitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForUpdate) return;

    dataStore.updateInventoryQuantity(
      selectedItemForUpdate.id,
      Number(newQuantityInput),
      updateReason || `Routine ${updateType}`,
      user?.fullName || 'Station Logistics Officer',
      updateType
    );

    setInventory(dataStore.getInventory());
    setIsUpdateQtyModalOpen(false);
    setSelectedItemForUpdate(null);
  };

  const handleCreateItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const sku = formSku || `SKU-${formCategory.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    dataStore.createInventoryItem(
      {
        sku,
        name: formName,
        category: formCategory,
        stationId: formStationId,
        quantity: Number(formQuantity),
        unit: formUnit,
        minimumThreshold: Number(formMinThreshold),
        criticalThreshold: Number(formCriticalThreshold),
        dailyConsumption: Number(formDailyConsumption),
        storageLocation: formStorageLocation,
      },
      user?.fullName || 'Station Logistics Officer'
    );

    setInventory(dataStore.getInventory());
    setIsCreateModalOpen(false);

    // Reset Form
    setFormSku('');
    setFormName('');
  };

  const filteredInventory = inventory.filter((item) => {
    if (selectedStationId !== 'all' && item.stationId !== selectedStationId) return false;
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.storageLocation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Station Inventory &amp; Reserve Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time stock accounting, deterministic burn-rate depletion metrics, and automated critical threshold triggers.
          </p>
        </div>

        <button
          onClick={() => {
            setFormSku(`SKU-NEW-${Math.floor(100 + Math.random() * 900)}`);
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Station Inventory SKU</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-cyan-400" />
          <input
            type="text"
            placeholder="Search SKU, item name, storage bunker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none"
            >
              <option value="all">All Polar Stations</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Fuel">Fuel</option>
            <option value="Food">Food</option>
            <option value="Medicine">Medicine</option>
            <option value="Water & Treatment">Water & Treatment</option>
            <option value="Vehicle Spares">Vehicle Spares</option>
            <option value="Scientific Consumables">Scientific Consumables</option>
          </select>
        </div>
      </div>

      {/* Main Inventory Table with Calculated Days Remaining */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Item &amp; SKU</th>
                <th className="py-3 px-4">Polar Station</th>
                <th className="py-3 px-4">Stock on Hand</th>
                <th className="py-3 px-4">Daily Burn</th>
                <th className="py-3 px-4">Calculated Autonomy</th>
                <th className="py-3 px-4">Risk Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredInventory.map((item) => {
                const metrics = dataStore.calculateInventoryMetrics(item);
                const station = stations.find((s) => s.id === item.stationId);

                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {item.isSeedDemo && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                            Demo
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {item.sku} • {item.category} • Loc: {item.storageLocation}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      {station?.name || item.stationId}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-sm text-slate-100">
                        {item.quantity.toLocaleString()} {item.unit}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Min: {item.minimumThreshold} | Crit: {item.criticalThreshold}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {item.dailyConsumption} {item.unit}/day
                    </td>

                    {/* Calculated Days Remaining (Section 11: "Days Remaining = Current Quantity / Average Daily Consumption") */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className={`font-bold text-sm ${
                        metrics.riskLevel === 'Critical' ? 'text-red-400' :
                        metrics.riskLevel === 'Warning' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {metrics.daysRemaining} Days
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Depletes ~{metrics.projectedDepletionDate}
                      </div>
                    </td>

                    {/* Risk Badge calculated from stored thresholds */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          metrics.riskLevel === 'Critical'
                            ? 'bg-red-950 text-red-300 border border-red-800 animate-pulse'
                            : metrics.riskLevel === 'Warning'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {metrics.riskLevel === 'Critical' && <AlertTriangle className="w-3 h-3 text-red-400" />}
                        {metrics.riskLevel === 'Normal' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        {metrics.riskLevel}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenUpdateModal(item)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-900/60 hover:text-cyan-300 border border-slate-700 rounded text-slate-200 text-xs font-medium transition-colors"
                      >
                        Log Burn / Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Log Consumption / Resupply Transaction */}
      {isUpdateQtyModalOpen && selectedItemForUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <span>Log Inventory Transaction</span>
              </h3>
              <button onClick={() => setIsUpdateQtyModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateQuantitySubmit} className="py-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Selected Item:</span>
                <span className="font-bold text-sm text-slate-100">{selectedItemForUpdate.name}</span>
                <div className="text-[11px] font-mono text-slate-400 mt-1 flex justify-between">
                  <span>Current Balance: <strong className="text-cyan-400">{selectedItemForUpdate.quantity} {selectedItemForUpdate.unit}</strong></span>
                  <span>Daily Rate: {selectedItemForUpdate.dailyConsumption}/day</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Transaction Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUpdateType('Consumption');
                      setNewQuantityInput(Math.max(0, selectedItemForUpdate.quantity - selectedItemForUpdate.dailyConsumption));
                    }}
                    className={`p-2 rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-all ${
                      updateType === 'Consumption'
                        ? 'bg-amber-950 text-amber-200 border-amber-600'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4 text-amber-400" />
                    <span>Log Daily Consumption</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUpdateType('Resupply');
                      setNewQuantityInput(selectedItemForUpdate.quantity + 1000);
                    }}
                    className={`p-2 rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-all ${
                      updateType === 'Resupply'
                        ? 'bg-emerald-950 text-emerald-200 border-emerald-600'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    <span>Log Inward Resupply</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  New Absolute Stock Level ({selectedItemForUpdate.unit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newQuantityInput}
                  onChange={(e) => setNewQuantityInput(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-base font-bold focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Change: {newQuantityInput - selectedItemForUpdate.quantity >= 0 ? '+' : ''}
                  {(newQuantityInput - selectedItemForUpdate.quantity).toFixed(1)} {selectedItemForUpdate.unit}
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Reason / Officer Authorization Note *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily generator power burn / Inward ski-drop resupply"
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUpdateQtyModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold shadow"
                >
                  Confirm &amp; Recalculate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create SKU */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <span>Register New Polar Inventory SKU</span>
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItemSubmit} className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as InventoryCategory)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Fuel">Fuel</option>
                    <option value="Food">Food</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Water & Treatment">Water & Treatment</option>
                    <option value="Vehicle Spares">Vehicle Spares</option>
                    <option value="Scientific Consumables">Scientific Consumables</option>
                    <option value="Power & Electrical">Power & Electrical</option>
                    <option value="Survival & Cold Gear">Survival & Cold Gear</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Item Title / Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arctic Synthetic High-Grade Engine Oil 5W-40"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Station</label>
                  <select
                    value={formStationId}
                    onChange={(e) => setFormStationId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    {stations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Liters, Rations, Units, Kg"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Initial Quantity</label>
                  <input
                    type="number"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Estimated Daily Consumption</label>
                  <input
                    type="number"
                    step="any"
                    value={formDailyConsumption}
                    onChange={(e) => setFormDailyConsumption(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Warning Threshold (Min)</label>
                  <input
                    type="number"
                    value={formMinThreshold}
                    onChange={(e) => setFormMinThreshold(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Critical Threshold (Red Alert)</label>
                  <input
                    type="number"
                    value={formCriticalThreshold}
                    onChange={(e) => setFormCriticalThreshold(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Storage Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Workshop Bay 4 Shelf B"
                    value={formStorageLocation}
                    onChange={(e) => setFormStorageLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold shadow"
                >
                  Save &amp; Track Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
