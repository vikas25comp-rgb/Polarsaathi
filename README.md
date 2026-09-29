# POLAR-SATHI

**Integrated Polar Expedition Logistics & Emergency Management System**  
*Problem Statement ID: SIH26062*  
*Tagline: “One platform for planning, tracking, predicting and responding across polar expeditions.”*

---

## 1. Project Overview

**POLAR-SATHI** is a mission-critical web application engineered for polar expedition logistics, supply forecasting, asset life-cycle management, and emergency response across India's Antarctic and Arctic research stations (**Bharati**, **Maitri**, and **Himadri**), as well as ongoing scientific expeditions such as **ISEA-44** and **AWE-2026**.

In high-latitude polar operations, logistics failures risk lives. Extreme weather, frozen sea-routes, and 6-month dark winters mean a missed supply voyage or unpredicted generator failure can trigger a station evacuation. POLAR-SATHI unifies individual operational silos into a cohesive decision-support platform with:
- **Unified Expedition Planning & Station Monitoring**
- **Full Consignment Waypoint & Cold-Chain Tracking**
- **Station Inventory with Deterministic Depletion Calculations**
- **Predictive Logistics Shortage Forecasts & Supply Gap Alarms**
- **Gemini AI-Powered Resupply Planning Manifest Engine**
- **Offline-First Synchronization for High-Latitude Comm Blackouts**
- **Emergency Operations Command Center with Automatic Tactical Snapshots**
- **What-If Scenario Simulation Engine** (Non-destructive)
- **Natural-Language Voice & Text Operational Assistant**
- **Automated Mission Dossier & Executive Report Generation**

---

## 2. Key Features

| Module | Purpose & Capabilities |
| :--- | :--- |
| **Command Dashboard** | Real-time KPI matrix (Active Expeditions, Cargo In Transit, Critical Inventory, Assets Needing Maintenance, Deployed Personnel, Active Alerts), live station weather telemetry (temp, wind speed), and operational audit stream. |
| **Expeditions Management** | Full life-cycle tracking (Planned, Preparing, Active, Returning, Completed), base assignments, budget allocation, cargo and crew manifests. |
| **Cargo Tracking** | Multi-hop consignment tracking (`Registered → Packed → Dispatched → In Transit → At Station → Received`), container manifests (reefer, fuel ISO tanks), priority categorization, cold-chain temperature monitoring, and delay alerts. |
| **Inventory Management** | Station stock accounting with deterministic burn-rate depletion calculation: `Days Remaining = Current Quantity / Average Daily Consumption`. Automated warning and critical threshold alarms. |
| **Predictive Logistics (Feature 1)** | Mathematical supply gap forecasting comparing projected depletion dates against scheduled vessel arrival dates to identify acute shortages weeks in advance. |
| **AI Resupply Planning (Feature 2)** | Gemini AI analyzes crew headcount, weather, and consumption rates to propose replenishment manifests following the safety principle: *AI recommendation → Human review → Confirm action*. |
| **Offline-First Operation (Feature 3)** | Automatic local caching and queuing during satellite link loss (HF/Iridium blackout). Visible connection indicator (🟢 Online / 🟠 Offline queue count) with collision-safe sync replay upon reconnection. |
| **Emergency Command Center (Feature 4)** | Permanent emergency beacon, incident classification, and **Automatic Tactical Station Snapshot** (displays personnel on site, critical life-support assets, operational vehicles, medical supplies, and nearby resources in one single view). Response action item tracker. |
| **What-If Simulator (Feature 5)** | Sandbox simulator for supply disruptions (+15d voyage delay, +10 crew surge, +20% fuel burn, generator outage) with zero impact on real operational records. Gemini AI explains operational impacts and mitigation steps. |
| **Autonomous Operations Agent** | Multi-tool dynamic reasoning engine powered by Gemini 3.8 Flash function-calling (`dbTools.ts` + `weatherProvider.ts`). Inspects live PostgreSQL database records, queries real-time Antarctic/Arctic weather forecasts, evaluates over-snow traverse and flight safety, and executes isolated what-if simulations before responding. |
| **Agent Observability Trace** | Live developer and command execution trace panel displaying tool sequences, parameters, results, and cited data sources. |
| **Human-in-the-Loop Actions** | Interactive `[Approve Action]` / `[Decline]` controls for AI-recommended operational protocols, generating permanent audit logs upon officer confirmation. |
| **AI Voice & Text Assistant** | Natural-language query interface powered by Gemini 3.8 Flash using the unified agentic tool layer with Web Speech API speech-to-text recognition and text-to-speech voice radio feedback. |
| **Reporting Engine** | One-click official mission dossier compilation with AI executive summaries and Markdown export. |
| **Audit Log & Security** | Immutable event audit trail for traceability (actions, officers, timestamps, previous vs. new values). |

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons.
- **Backend / API Server:** Node.js, Express, TSX, Google GenAI SDK (`@google/genai`).
- **Database:** Supabase PostgreSQL with Row Level Security (RLS) and SQL schema migrations.
- **Authentication:** Supabase Authentication with local role-based fallback sessions.
- **AI Models:** Google Gemini 3.8 Flash (`gemini-3.8-flash`) via server-side proxy routes.
- **Offline Storage:** LocalStorage & IndexedDB with optimistic offline synchronization queue.

---

## 4. Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

| Variable | Required | Description |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Optional | Your Supabase project URL (`https://xyz.supabase.co`). When unconfigured, the app runs in full offline local storage mode. |
| `VITE_SUPABASE_ANON_KEY` | Optional | Client-safe Supabase Anonymous Key for client-side queries and authentication. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server-side only key for backend database administration. Never expose to frontend. |
| `GEMINI_API_KEY` | Recommended | Google Gemini API key. Enables natural language chat, voice responses, resupply planning, what-if interpretation, and AI reports. |
| `APP_URL` | Optional | The base hosting URL (e.g. `http://localhost:3000`). |

---

## 5. Supabase Setup & Migrations

1. Create a free project on [Supabase](https://supabase.com).
2. Open your Supabase dashboard and navigate to the **SQL Editor**.
3. Copy the contents of the migration file located at `supabase/schema.sql` in this repository.
4. Run the SQL script. This creates all 17 tables, foreign key constraints, indexes, RLS policies, and realistic initial seed records.
5. In **Project Settings -> API**, copy the `Project URL` and `anon public` key.
6. Add them to your `.env` file or hosting environment variables:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

---

## 6. Google Gemini API Setup

1. Obtain a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Set `GEMINI_API_KEY="your_api_key_here"` in your `.env` file (or in your hosting provider's Secrets panel).
3. The server-side proxy routes (`/api/gemini/*`) securely access this key without exposing credentials to the client bundle.

---

## 7. Local Development Commands

### Prerequisites
- Node.js 18+ or 20+
- npm or bun

### Setup & Run
```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server (Port 3000)
npm run dev

# 3. Open browser at
# http://localhost:3000
```

### Type Checking & Linting
```bash
npm run lint
```

### Production Build
```bash
npm run build
```

---

## 8. Deployment Instructions

### Deploy to GitHub
```bash
git init
git add .
git commit -m "feat: Initial commit for POLAR-SATHI (SIH26062)"
git branch -M main
git remote add origin https://github.com/<your-username>/polar-sathi.git
git push -u origin main
```

### Deploy to Vercel
1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New -> Project** and import the `polar-sathi` repository.
3. In **Build and Output Settings**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `GEMINI_API_KEY`: Your Google Gemini API Key
5. Click **Deploy**.

---

## 9. Offline Operation & Acceptance Tests

### How Offline Mode Works
1. When online, actions update both the local persistent store and Supabase.
2. If internet connection is lost (or when clicking **Simulate Offline Mode** in the Connection Manager badge):
   - Status badge turns to `🟠 Offline (N queued)`.
   - New consignments, stock consumptions, personnel movements, or emergency declarations are saved locally and queued in `OfflineSyncQueue`.
3. Upon reconnection, the sync agent automatically replays queued operations to Supabase in order.

### Verifying the Acceptance Tests
- **Test 1 (Cargo):** Go to *Cargo Tracking* → Register consignment → Update waypoint status to *In Transit* → Verify status update in list and audit log.
- **Test 2 (Inventory):** Go to *Inventory* → Click *Log Burn / Stock* on an item → Enter a quantity below the critical threshold → Verify calculated days remaining and observe the automated critical alert.
- **Test 3 (Personnel):** Go to *Personnel* → Click *Deploy New Crew Member* → Select member and click *Record Movement* to a field camp → Verify updated location.
- **Test 4 (Assets):** Go to *Assets & Maint.* → Commission asset → Log a maintenance service → Verify that status transitions to *Normal* and the next due date updates.
- **Test 5 (Emergency):** Click *EMERGENCY PROTOCOL* in header → Declare incident for Bharati Station → Verify that the **Automatic Tactical Station Snapshot** automatically retrieves all personnel on site, vital assets, vehicles, and medical inventory.
- **Test 6 (AI):** Open *AI Assistant* → Ask *"Which supplies are currently critical?"* → Verify Gemini responds using real station inventory data.
- **Test 7 (What-If):** Go to *What-If Simulator* → Move Resupply Delay slider to *+15 Days* → Verify calculated deficit days without modifying live database records.
- **Test 8 (Offline):** Click the connection badge in the header → Toggle *Simulate Loss of Signal* → Create an inventory update → Verify queue count increments → Click *Restore Connection* → Verify sync completion.
- **Test 9 (Auth):** Open the user menu in the top right → Click *Log Out* → Verify protected redirect to the Polar Operations Terminal.
- **Test 10 (Build):** Run `npm run build` to verify clean compilation.

---

## 10. Known Limitations

1. **Browser Speech Synthesis Language Pack:** High-fidelity voice playback depends on the operating system's installed text-to-speech voices.
2. **High-Latitude HF Latency:** In real polar deployments, satellite packet loss can exceed 40%; the system's local caching architecture is specifically designed to mitigate this constraint.

---

## License

Developed for **Smart India Hackathon 2026 (SIH26062)**.  
Open-source under the Apache-2.0 License.
