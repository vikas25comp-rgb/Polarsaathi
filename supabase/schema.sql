-- ==============================================================================
-- POLAR-SATHI: Integrated Polar Expedition Logistics & Emergency Management System
-- Database Schema for Supabase (PostgreSQL)
-- Supports SIH26062 Polar Operations Specifications
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Stations (Antarctic & Arctic Research Stations)
CREATE TABLE IF NOT EXISTS public.stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL CHECK (region IN ('Antarctic', 'Arctic', 'Sub-Antarctic')),
    coordinates VARCHAR(50) NOT NULL,
    operational_status VARCHAR(50) DEFAULT 'Fully Operational',
    capacity INT NOT NULL DEFAULT 40,
    current_personnel INT NOT NULL DEFAULT 0,
    temperature_celsius NUMERIC(5,2) DEFAULT -18.5,
    wind_speed_kts NUMERIC(5,2) DEFAULT 22.0,
    communication_status VARCHAR(60) DEFAULT 'Nominal (Satcom Primary)',
    emergency_status VARCHAR(40) DEFAULT 'Normal',
    last_communication TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Expeditions
CREATE TABLE IF NOT EXISTS public.expeditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(40) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    leader_name VARCHAR(100) NOT NULL,
    station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'Active' CHECK (status IN ('Planned', 'Preparing', 'Active', 'Returning', 'Completed', 'Cancelled')),
    budget_allocated NUMERIC(15,2) DEFAULT 0,
    personnel_count INT DEFAULT 0,
    cargo_weight_kg NUMERIC(10,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Containers
CREATE TABLE IF NOT EXISTS public.containers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    tare_weight_kg NUMERIC(8,2) NOT NULL,
    max_gross_weight_kg NUMERIC(8,2) NOT NULL,
    current_station_or_hub VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Empty',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Cargo
CREATE TABLE IF NOT EXISTS public.cargo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(60) NOT NULL,
    priority VARCHAR(30) NOT NULL DEFAULT 'Routine' CHECK (priority IN ('Critical', 'High', 'Medium', 'Routine')),
    status VARCHAR(40) NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'Packed', 'Dispatched', 'In Transit', 'At Station', 'Received', 'Delayed', 'Lost/Damaged')),
    expedition_id UUID REFERENCES public.expeditions(id) ON DELETE SET NULL,
    destination_station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL,
    container_id UUID REFERENCES public.containers(id) ON DELETE SET NULL,
    weight_kg NUMERIC(10,2) NOT NULL,
    volume_m3 NUMERIC(8,2) DEFAULT 1.0,
    is_hazmat BOOLEAN DEFAULT FALSE,
    hazmat_details TEXT,
    temperature_controlled BOOLEAN DEFAULT FALSE,
    required_temp_range VARCHAR(50),
    current_location VARCHAR(150) NOT NULL,
    origin_hub VARCHAR(100) NOT NULL,
    estimated_arrival DATE NOT NULL,
    actual_arrival DATE,
    receiving_officer VARCHAR(100),
    special_instructions TEXT,
    is_seed_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Cargo Movements (History timeline)
CREATE TABLE IF NOT EXISTS public.cargo_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cargo_id UUID NOT NULL REFERENCES public.cargo(id) ON DELETE CASCADE,
    status VARCHAR(40) NOT NULL,
    location VARCHAR(150) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    officer_name VARCHAR(100) NOT NULL,
    notes TEXT
);

-- 6. Inventory Items
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(60) NOT NULL,
    station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
    unit VARCHAR(30) NOT NULL,
    minimum_threshold NUMERIC(12,2) NOT NULL,
    critical_threshold NUMERIC(12,2) NOT NULL,
    daily_consumption NUMERIC(10,2) NOT NULL DEFAULT 1.0,
    expiry_date DATE,
    last_resupply_date DATE,
    next_planned_resupply_date DATE,
    unit_cost_inr NUMERIC(12,2) DEFAULT 0,
    storage_location VARCHAR(100) NOT NULL,
    is_seed_demo BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Inventory Transactions
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    quantity_delta NUMERIC(12,2) NOT NULL,
    balance_after NUMERIC(12,2) NOT NULL,
    officer_name VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Personnel
CREATE TABLE IF NOT EXISTS public.personnel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    badge_number VARCHAR(40) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(80) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    expedition_id UUID REFERENCES public.expeditions(id) ON DELETE SET NULL,
    station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL,
    current_location VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'At Station',
    blood_group VARCHAR(10) NOT NULL,
    emergency_contact VARCHAR(150) NOT NULL,
    certifications TEXT[] DEFAULT '{}',
    deployed_date DATE NOT NULL,
    rotation_end_date DATE NOT NULL,
    is_seed_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Personnel Movements
CREATE TABLE IF NOT EXISTS public.personnel_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
    from_location VARCHAR(150) NOT NULL,
    to_location VARCHAR(150) NOT NULL,
    transport_mode VARCHAR(80) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    authorized_by VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Completed'
);

-- 10. Assets / Polar Equipment
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(60) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
    operational_status VARCHAR(40) NOT NULL DEFAULT 'Operational' CHECK (operational_status IN ('Operational', 'Maintenance Due', 'Under Maintenance', 'Faulty', 'Retired')),
    operating_hours NUMERIC(10,2) DEFAULT 0,
    criticality VARCHAR(50) NOT NULL DEFAULT 'Primary Operational',
    commission_date DATE NOT NULL,
    last_maintenance_date DATE NOT NULL,
    next_scheduled_maintenance DATE NOT NULL,
    assigned_team VARCHAR(100) NOT NULL,
    spare_parts_notes TEXT,
    is_seed_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Asset Maintenance Records
CREATE TABLE IF NOT EXISTS public.asset_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(60) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'Completed',
    technician_name VARCHAR(100) NOT NULL,
    performed_date DATE NOT NULL,
    operating_hours_at_service NUMERIC(10,2) NOT NULL,
    findings TEXT NOT NULL,
    parts_replaced TEXT,
    next_due_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Emergencies
CREATE TABLE IF NOT EXISTS public.emergencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Medical', 'Fire', 'Equipment Failure', 'Vehicle Failure', 'Communication Failure', 'Supply Crisis', 'Weather/Environmental', 'Other')),
    station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
    location_details VARCHAR(150) NOT NULL,
    severity VARCHAR(40) NOT NULL CHECK (severity IN ('Critical (Level 1)', 'Severe (Level 2)', 'Moderate (Level 3)', 'Advisory (Level 4)')),
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Investigating', 'Contained', 'Resolved', 'Closed')),
    description TEXT NOT NULL,
    reported_by VARCHAR(100) NOT NULL,
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    affected_personnel_ids TEXT[] DEFAULT '{}',
    required_resources TEXT[] DEFAULT '{}',
    commander_notes TEXT,
    is_seed_demo BOOLEAN DEFAULT FALSE
);

-- 13. Emergency Actions
CREATE TABLE IF NOT EXISTS public.emergency_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES public.emergencies(id) ON DELETE CASCADE,
    action_text TEXT NOT NULL,
    assigned_to VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 14. System Alerts
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    entity_type VARCHAR(40),
    entity_id VARCHAR(100),
    read BOOLEAN DEFAULT FALSE
);

-- 15. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_name VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(80) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Resupply Plans
CREATE TABLE IF NOT EXISTS public.resupply_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID REFERENCES public.stations(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    target_arrival_date DATE NOT NULL,
    transport_vessel VARCHAR(100) NOT NULL,
    items_to_replenish JSONB NOT NULL,
    ai_analysis_rationale TEXT,
    status VARCHAR(50) DEFAULT 'Proposed by AI',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Reports
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(60) NOT NULL,
    generated_by VARCHAR(100) NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL,
    content_markdown TEXT NOT NULL,
    ai_generated_summary BOOLEAN DEFAULT FALSE,
    summary_highlights TEXT[] DEFAULT '{}'
);

-- Enable Row Level Security (RLS) on key operational tables
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expeditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Anonymous and Authenticated users access policies (configurable per role)
CREATE POLICY "Public read for stations" ON public.stations FOR SELECT USING (true);
CREATE POLICY "Public write for stations" ON public.stations FOR ALL USING (true);

CREATE POLICY "Public read for expeditions" ON public.expeditions FOR SELECT USING (true);
CREATE POLICY "Public write for expeditions" ON public.expeditions FOR ALL USING (true);

CREATE POLICY "Public read for cargo" ON public.cargo FOR SELECT USING (true);
CREATE POLICY "Public write for cargo" ON public.cargo FOR ALL USING (true);

CREATE POLICY "Public read for inventory" ON public.inventory_items FOR SELECT USING (true);
CREATE POLICY "Public write for inventory" ON public.inventory_items FOR ALL USING (true);

CREATE POLICY "Public read for personnel" ON public.personnel FOR SELECT USING (true);
CREATE POLICY "Public write for personnel" ON public.personnel FOR ALL USING (true);

CREATE POLICY "Public read for assets" ON public.assets FOR SELECT USING (true);
CREATE POLICY "Public write for assets" ON public.assets FOR ALL USING (true);

CREATE POLICY "Public read for emergencies" ON public.emergencies FOR SELECT USING (true);
CREATE POLICY "Public write for emergencies" ON public.emergencies FOR ALL USING (true);

CREATE POLICY "Public read for alerts" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Public write for alerts" ON public.alerts FOR ALL USING (true);

CREATE POLICY "Public read for audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Public write for audit_logs" ON public.audit_logs FOR ALL USING (true);
