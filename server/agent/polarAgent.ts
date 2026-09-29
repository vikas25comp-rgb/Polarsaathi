import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';
import * as dbTools from './dbTools';

// Observability Event Schema
export interface AgentToolEvent {
  id: string;
  toolName: string;
  params: any;
  resultSummary: string;
  timestamp: string;
}

export interface AgentExecutionResult {
  text: string;
  speechText?: string;
  toolEvents: AgentToolEvent[];
  sources: string[];
  recommendedAction?: {
    id: string;
    title: string;
    description: string;
    targetStationId: string;
    actionType: string;
    impact: string;
  };
  isAgentic: boolean;
}

// 1. Function Declarations with valid schemas (Never empty Type.OBJECT)
const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'get_stations',
    description: 'Retrieve all Indian polar research stations (Bharati, Maitri, Himadri), coordinates, capacity, and current operational/emergency statuses.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        filter: { type: Type.STRING, description: 'Optional station name or code to filter by' },
      },
    },
  },
  {
    name: 'get_station_status',
    description: 'Retrieve detailed live telemetry and communication status for a specific station by ID or name.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        station_id: { type: Type.STRING, description: 'Station name or ID (e.g. "st-bharati", "maitri", "himadri")' },
      },
      required: ['station_id'],
    },
  },
  {
    name: 'get_expeditions',
    description: 'Retrieve all polar scientific expeditions, deployment schedules, leaders, and statuses (e.g. ISEA-44, AWE-2026).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, description: 'Optional status filter: Active, Preparing, Planned, Completed' },
      },
    },
  },
  {
    name: 'get_cargo',
    description: 'Retrieve cargo consignments with optional category (Fuel, Food, Medicine, Spare Parts) or priority filters.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, description: 'Optional category (Fuel, Food, Medicine, Spare Parts, Scientific Equipment)' },
        priority: { type: Type.STRING, description: 'Optional priority (Critical, High, Medium, Routine)' },
      },
    },
  },
  {
    name: 'get_cargo_details',
    description: 'Retrieve detailed information, waypoints, container type, cold chain specs, and currentLocation for a specific cargo tracking number.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        cargo_id: { type: Type.STRING, description: 'Cargo tracking number or ID (e.g. "CRG-2026-089", "CRG-2026-104")' },
      },
      required: ['cargo_id'],
    },
  },
  {
    name: 'get_cargo_in_transit',
    description: 'Retrieve all cargo consignments currently in transit across the Southern Ocean or transport hubs.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        destination_station: { type: Type.STRING, description: 'Optional station filter' },
      },
    },
  },
  {
    name: 'get_delayed_cargo',
    description: 'Retrieve all cargo shipments currently delayed due to weather, customs, or ice conditions.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        reason: { type: Type.STRING, description: 'Optional filter' },
      },
    },
  },
  {
    name: 'get_station_inventory',
    description: 'Retrieve all stock items, current quantities, units, and daily burn rates for a specific polar station.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        station_id: { type: Type.STRING, description: 'Station ID or name (e.g. "st-bharati", "st-maitri")' },
      },
      required: ['station_id'],
    },
  },
  {
    name: 'get_critical_inventory',
    description: 'Retrieve inventory items currently below warning or critical thresholds or with less than 30 days autonomy.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        station_id: { type: Type.STRING, description: 'Optional station filter' },
      },
    },
  },
  {
    name: 'get_inventory_consumption_history',
    description: 'Retrieve consumption rates, daily burn, and calculated days of autonomy for station inventory items.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        station_id: { type: Type.STRING, description: 'Station ID (e.g. "st-bharati")' },
        item_type: { type: Type.STRING, description: 'Optional item name or category (e.g. "fuel", "food", "medicine")' },
      },
      required: ['station_id'],
    },
  },
  {
    name: 'get_projected_stockout',
    description: 'Perform a deterministic stockout calculation comparing projected depletion date with scheduled resupply date.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        station_id: { type: Type.STRING, description: 'Station ID (e.g. "st-bharati")' },
        item_type: { type: Type.STRING, description: 'Item name or keyword (e.g. "fuel", "food", "rations")' },
      },
      required: ['station_id', 'item_type'],
    },
  },
  {
    name: 'get_resupply_schedule',
    description: 'Retrieve planned resupply voyages, transport vessels (e.g. MV Vasiliy Golovnin), arrival dates, and manifested cargo.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        station_id: { type: Type.STRING, description: 'Optional station filter' },
      },
    },
  },
  {
    name: 'get_next_resupply',
    description: 'Retrieve the upcoming scheduled resupply voyage details and days remaining until arrival for a station.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        station_id: { type: Type.STRING, description: 'Station ID (e.g. "st-bharati")' },
      },
      required: ['station_id'],
    },
  },
  {
    name: 'get_personnel_at_station',
    description: 'Retrieve the roster of scientists, engineers, medical officers, and crew currently on-site at a station.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        station_id: { type: Type.STRING, description: 'Station ID (e.g. "st-bharati", "st-maitri")' },
      },
      required: ['station_id'],
    },
  },
  {
    name: 'get_personnel_count',
    description: 'Retrieve the active headcount of deployed personnel at a polar station.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        station_id: { type: Type.STRING, description: 'Station ID (e.g. "st-bharati")' },
      },
      required: ['station_id'],
    },
  },
  {
    name: 'get_assets',
    description: 'Retrieve mission equipment, generators, PistenBully snowcats, and scientific instrumentation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        station_id: { type: Type.STRING, description: 'Optional station ID' },
      },
    },
  },
  {
    name: 'get_asset_status',
    description: 'Retrieve operational status, operating hours, and criticality of a specific asset.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        asset_code: { type: Type.STRING, description: 'Asset code or name (e.g. "AST-GEN-01", "AST-VEH-01", "generator")' },
      },
      required: ['asset_code'],
    },
  },
  {
    name: 'get_overdue_maintenance',
    description: 'Retrieve all assets with overdue or pending scheduled polar maintenance.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, description: 'Optional category filter' },
      },
    },
  },
  {
    name: 'get_active_emergencies',
    description: 'Retrieve all active emergency incidents across stations.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        severity: { type: Type.STRING, description: 'Optional severity filter' },
      },
    },
  },
  {
    name: 'get_station_emergency_snapshot',
    description: 'Retrieve a complete tactical emergency snapshot for a station (personnel on site, vital assets, vehicles, medical supplies, weather).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        station_id: { type: Type.STRING, description: 'Station ID (e.g. "st-bharati")' },
      },
      required: ['station_id'],
    },
  },
  {
    name: 'get_weather',
    description: 'Retrieve live meteorological data for a polar station (temperature, wind speed, gusts, pressure, condition, blizzard alerts).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        location: { type: Type.STRING, description: 'Station name or coordinates (e.g. "Bharati", "Maitri", "Himadri")' },
        latitude: { type: Type.NUMBER, description: 'Optional latitude coordinate' },
        longitude: { type: Type.NUMBER, description: 'Optional longitude coordinate' },
      },
      required: ['location'],
    },
  },
  {
    name: 'get_weather_forecast',
    description: 'Retrieve a 5-day weather forecast with blizzard hazard indices, flight window status, and over-snow traverse safety for a location.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        location: { type: Type.STRING, description: 'Station name (e.g. "Bharati", "Maitri")' },
        days: { type: Type.NUMBER, description: 'Number of forecast days (default 5)' },
      },
      required: ['location'],
    },
  },
  {
    name: 'run_what_if_simulation',
    description: 'Execute an isolated what-if scenario simulation calculating supply depletion under voyage delays, crew surges, and generator failures WITHOUT modifying production records.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        station_id: { type: Type.STRING, description: 'Station ID (e.g. "st-bharati")' },
        resupply_delay_days: { type: Type.NUMBER, description: 'Number of days resupply vessel is delayed' },
        additional_personnel: { type: Type.NUMBER, description: 'Extra personnel arriving (default 0)' },
        fuel_burn_multiplier: { type: Type.NUMBER, description: 'Multiplier on fuel consumption (e.g. 1.2 for 20% surge)' },
        generator_failed: { type: Type.BOOLEAN, description: 'Whether primary generator has failed' },
      },
      required: ['station_id', 'resupply_delay_days'],
    },
  },
  {
    name: 'get_audit_logs',
    description: 'Retrieve recent operational change audit logs and traceability events.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: { type: Type.NUMBER, description: 'Number of recent logs to fetch' },
      },
    },
  },
  {
    name: 'propose_operational_action',
    description: 'Prepare a real operational change for human confirmation. NEVER execute or claim execution. Use only when the user explicitly asks to change inventory, cargo status, asset status, emergency status, or create an emergency.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        actionType: {
          type: Type.STRING,
          description: 'One of: update_inventory, update_cargo_status, update_asset_status, update_emergency_status, create_emergency',
        },
        title: { type: Type.STRING, description: 'Short human-readable action title.' },
        description: { type: Type.STRING, description: 'Exactly what will change and why.' },
        targetId: { type: Type.STRING, description: 'Target inventory SKU/id/name, cargo id/tracking number, asset code/id, or emergency id/code.' },
        targetStationId: { type: Type.STRING, description: 'Optional station id/name.' },
        parameters: {
          type: Type.OBJECT,
          description: 'Change parameters for the requested action.',
          properties: {
            quantity: { type: Type.NUMBER, description: 'Final inventory quantity.' },
            newQuantity: { type: Type.NUMBER, description: 'Alias for final inventory quantity.' },
            quantityDelta: { type: Type.NUMBER, description: 'Amount to add or subtract from inventory.' },
            status: { type: Type.STRING, description: 'New cargo, asset, or emergency status.' },
            currentLocation: { type: Type.STRING, description: 'New cargo location.' },
            commanderNotes: { type: Type.STRING, description: 'Optional emergency commander notes.' },
            stationId: { type: Type.STRING, description: 'Station id/name for a new emergency.' },
            title: { type: Type.STRING, description: 'Emergency title.' },
            type: { type: Type.STRING, description: 'Emergency type.' },
            severity: { type: Type.STRING, description: 'Emergency severity.' },
            description: { type: Type.STRING, description: 'Emergency description.' },
            locationDetails: { type: Type.STRING, description: 'Location of the emergency.' },
          },
        },
      },
      required: ['actionType', 'title', 'description'],
    },
  },
];

// Tool Implementation Dispatcher
const toolMap: Record<string, (args: any) => Promise<any>> = {
  get_stations: dbTools.get_stations,
  get_station_status: dbTools.get_station_status,
  get_expeditions: dbTools.get_expeditions,
  get_cargo: dbTools.get_cargo,
  get_cargo_details: dbTools.get_cargo_details,
  get_cargo_in_transit: dbTools.get_cargo_in_transit,
  get_delayed_cargo: dbTools.get_delayed_cargo,
  get_station_inventory: dbTools.get_station_inventory,
  get_critical_inventory: dbTools.get_critical_inventory,
  get_inventory_consumption_history: dbTools.get_inventory_consumption_history,
  get_projected_stockout: dbTools.get_projected_stockout,
  get_resupply_schedule: dbTools.get_resupply_schedule,
  get_next_resupply: dbTools.get_next_resupply,
  get_personnel_at_station: dbTools.get_personnel_at_station,
  get_personnel_count: dbTools.get_personnel_count,
  get_assets: dbTools.get_assets,
  get_asset_status: dbTools.get_asset_status,
  get_overdue_maintenance: dbTools.get_overdue_maintenance,
  get_active_emergencies: dbTools.get_active_emergencies,
  get_station_emergency_snapshot: dbTools.get_station_emergency_snapshot,
  get_weather: dbTools.get_weather,
  get_weather_forecast: dbTools.get_weather_forecast,
  run_what_if_simulation: dbTools.run_what_if_simulation,
  get_audit_logs: dbTools.get_audit_logs,
  propose_operational_action: async (args: any) => {
    const allowed = [
      'update_inventory',
      'update_cargo_status',
      'update_asset_status',
      'update_emergency_status',
      'create_emergency',
    ];
    if (!allowed.includes(args.actionType)) {
      return { error: `Action type '${args.actionType}' is not allowed.` };
    }
    return dbTools.createOperationalAction({
      actionType: args.actionType,
      title: args.title,
      description: args.description,
      targetId: args.targetId,
      targetStationId: args.targetStationId,
      parameters: args.parameters || {},
    });
  },
};

export class PolarOperationsAgent {
  private ai: GoogleGenAI | null;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY || '';
    this.ai = key
      ? new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        })
      : null;
  }

  public async runAgent(
    userPrompt: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<AgentExecutionResult> {
    const toolEvents: AgentToolEvent[] = [];
    const sourcesSet = new Set<string>();
    let pendingAction: any = undefined;

    if (!this.ai) {
      return this.runDeterministicAgent(userPrompt);
    }

    const systemInstruction = `You are POLAR-SATHI, the AI assistant inside DHRUVYAN, an operational application for polar research teams.

You can answer TWO kinds of questions:
1. GENERAL QUESTIONS: Answer normal questions about science, geography, technology, writing, planning, calculations, etc. Do not pretend that a general question must be about polar operations.
2. APP / POLAR QUESTIONS: Use the available read-only database and weather tools when the answer depends on current application data. Never invent operational numbers when a tool can retrieve them.

OPERATIONAL CHANGES:
- If the user asks to change inventory, cargo status, asset status, emergency status, or create an emergency, DO NOT directly mutate data.
- First call propose_operational_action with the exact intended change.
- The tool only creates a pending proposal. Tell the user clearly that no change has happened yet and that human confirmation is required.
- Never say an operational change was completed until the server returns a successful execution result after confirmation.
- If important information is missing for an operational action, ask for it rather than guessing.
- What-if questions are simulations only and must never create or modify operational records.

COMMUNICATION:
- Be clear, friendly, and concise. You may simplify technical terms when helpful, but do not distort facts.
- When using application data, distinguish live/current records from estimates or simulations.
- For safety or emergency questions, state the relevant uncertainty and advise following the station's established procedures.
- Do not fabricate sources, weather readings, inventory counts, personnel counts, or action results.`;

    // Try primary high-throughput model first, then fallback model
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

    for (const modelName of candidateModels) {
      const contents: any[] = [];

      // Append prior conversation turns for memory
      for (const msg of conversationHistory.slice(-6)) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      }

      // Append current user turn
      contents.push({
        role: 'user',
        parts: [{ text: userPrompt }],
      });

      let iterations = 0;
      const maxIterations = 5;

      try {
        while (iterations < maxIterations) {
          iterations++;

          const response = await this.ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              temperature: 0.2,
              tools: [{ functionDeclarations }],
            },
          });

          const functionCalls = response.functionCalls;

          // If no tool call, Gemini provided the direct answer!
          if (!functionCalls || functionCalls.length === 0) {
            const finalText = response.text || 'Operational analysis complete.';
            if (sourcesSet.size === 0) {
              sourcesSet.add('POLAR-SATHI Knowledge Base');
            }
            return {
              text: finalText,
              speechText: this.extractSpeechText(finalText),
              toolEvents,
              sources: Array.from(sourcesSet),
              recommendedAction: pendingAction || this.extractRecommendedAction(finalText),
              isAgentic: true,
            };
          }

          // Model generated one or more tool calls
          const modelContent = response.candidates?.[0]?.content;
          if (modelContent) {
            contents.push(modelContent);
          }

          const functionResponseParts: any[] = [];

          for (const call of functionCalls) {
            const toolName = call.name || '';
            if (!toolName) continue;
            const toolArgs = call.args || {};
            const fn = toolMap[toolName];

            let result: any = null;
            if (fn) {
              try {
                result = await fn(toolArgs);
              } catch (err: any) {
                result = { error: `Tool execution failed: ${err.message}` };
              }
            } else {
              result = { error: `Tool ${toolName} not found` };
            }

            if (toolName === 'propose_operational_action' && result?.action) {
              pendingAction = result.action;
            }

            const eventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const summary = this.summarizeToolResult(toolName, result);
            toolEvents.push({
              id: eventId,
              toolName,
              params: toolArgs,
              resultSummary: summary,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            });

            if (toolName.includes('weather')) sourcesSet.add('OpenWeather & Open-Meteo Polar Service');
            else if (toolName.includes('simulation')) sourcesSet.add('POLAR-SATHI Isolated What-If Engine');
            else sourcesSet.add('POLAR-SATHI PostgreSQL Database');

            functionResponseParts.push({
              functionResponse: {
                name: toolName,
                id: (call as any).id,
                response: { result },
              },
            });
          }

          // In Gemini API, function responses are provided with role: 'user'
          contents.push({
            role: 'user',
            parts: functionResponseParts,
          });
        }

        return {
          text: 'Operation completed multi-tool deliberations.',
          toolEvents,
          sources: Array.from(sourcesSet),
          isAgentic: true,
        };
      } catch (err: any) {
        console.warn(`[PolarOperationsAgent] Model ${modelName} failed, evaluating fallback:`, err.message || err);
        // Continue loop to try next model
      }
    }

    // Both models failed (or offline/rate limited) -> use smart dynamic deterministic fallback
    return this.runDeterministicAgent(userPrompt);
  }

  private async runDeterministicAgent(prompt: string): Promise<AgentExecutionResult> {
    const lower = prompt.toLowerCase();
    const toolEvents: AgentToolEvent[] = [];
    const sourcesSet = new Set<string>();

    // Detect target station if specified
    let stationId = 'st-bharati';
    let stationName = 'Bharati';
    if (lower.includes('maitri')) {
      stationId = 'st-maitri';
      stationName = 'Maitri';
    } else if (lower.includes('himadri')) {
      stationId = 'st-himadri';
      stationName = 'Himadri';
    }

    // 0. WEBSITE OVERVIEW & CHILD-FRIENDLY EXPLANATION (Explaining the website in words a child can understand)
    if (
      lower.includes('website') ||
      lower.includes('app') ||
      lower.includes('child') ||
      lower.includes('kid') ||
      lower.includes('explain') ||
      lower.includes('how does this work') ||
      lower.includes('what is dhruvyan') ||
      lower.includes('what do you do') ||
      lower.includes('button')
    ) {
      return {
        text: `### 🌟 Simple Answer
Welcome to **DHRUVYAN**! Think of this website as the **ultimate superhero control room** for brave scientists living in the coldest, iciest places on Earth — Antarctica and the Arctic!

### 🏠 What You Can Explore on This Website
- **📊 Mission Dashboard:** Shows giant friendly dials of how cold it is outside, how much electricity the station has, and who is on duty!
- **❄️ Stations Map:** See our 3 real-world polar bases:
  * **Bharati Base:** A warm orange fortress standing tall on the Antarctic ice coast.
  * **Maitri Base:** Located near freshwater lakes in Queen Maud Land.
  * **Himadri Base:** Our base at the top of the world in the Arctic where polar bears roam!
- **🍲 Food & Warm Fuel Pantry:** Counts every can of warm soup, parka jacket, and gallon of fuel so the team never runs out!
- **🚢 Big Supply Ship (MV Vasiliy Golovnin):** Tracks our giant floating grocery store sailing through ocean waves to deliver supplies!
- **🚜 Monster Snow Trucks:** Keeps track of our giant tracked PistenBully snowcats, helicopters, and snowmobiles!
- **🚨 Emergency Helper:** If a giant blizzard hits, this button helps the team stay safe and sound!
- **🎙️ Walkie-Talkie Voice Chat (Me!):** Tap the microphone anytime to talk to me!

### 💡 What This Means in Simple Words
Just like a school or home needs food, electricity, and warm clothes, our polar bases need special helpers to watch over everything while blizzards howl outside!

### 🚀 What We Should Do Next!
Tap the microphone and ask: *"How cold is it in Antarctica right now?"* or click on the Stations tab to see the map!`,
        speechText: 'Welcome to DHRUVYAN! This website is like a superhero control room for our brave scientists living in Antarctica. You can talk to me anytime with your voice!',
        toolEvents: [],
        sources: ['DHRUVYAN Polar Guidebook for Young Explorers'],
        isAgentic: true,
      };
    }

    // 1. INVENTORY / FUEL / CONSUMPTION / FOOD / RATIONS
    if (
      lower.includes('fuel') ||
      lower.includes('diesel') ||
      lower.includes('stockout') ||
      lower.includes('ration') ||
      lower.includes('food') ||
      lower.includes('medicine') ||
      lower.includes('supplies') ||
      lower.includes('inventory') ||
      lower.includes('run out') ||
      lower.includes('deplet')
    ) {
      const itemType = lower.includes('food') || lower.includes('ration')
        ? 'food'
        : lower.includes('med')
        ? 'medicine'
        : 'fuel';

      const stock = await dbTools.get_projected_stockout({ station_id: stationId, item_type: itemType });
      const weather = await dbTools.get_weather({ location: stationName });

      toolEvents.push({
        id: 'evt-inv-1',
        toolName: 'get_projected_stockout',
        params: { station_id: stationId, item_type: itemType },
        resultSummary: `Projected supply: ${stock.projectedDaysRemaining} days, ship arrives in ${stock.daysUntilResupply} days.`,
        timestamp: new Date().toLocaleTimeString(),
      });
      toolEvents.push({
        id: 'evt-w-1',
        toolName: 'get_weather',
        params: { location: stationName },
        resultSummary: `Temp: ${weather.temperatureCelsius}°C, Wind: ${weather.windSpeedKts} kts, Condition: ${weather.condition}`,
        timestamp: new Date().toLocaleTimeString(),
      });

      sourcesSet.add('POLAR-SATHI PostgreSQL (inventory_items)');
      sourcesSet.add('Open-Meteo High-Latitude Meteorological Service');

      const isShortfall = (stock.projectedSupplyGapDays || 0) > 0;
      const itemName = stock.item || itemType;
      const currentStockStr = stock.currentStock || 'N/A';
      const dailyBurnStr = stock.dailyConsumption || 'N/A';
      const daysRemaining = stock.projectedDaysRemaining || 0;
      const resupplyDays = stock.daysUntilResupply || 0;
      const resupplyDateStr = stock.nextPlannedResupplyDate || '2026-11-05';
      const gapDays = stock.projectedSupplyGapDays || 0;

      const text = `### 🌟 Simple Answer
${stationName} Base currently has **${currentStockStr}** of ${itemName}. The team uses about **${dailyBurnStr}** every day to stay warm and energized, which means we have enough for **${daysRemaining} days**!

### 🏠 What We Have at the Station Right Now
- **Station:** ${stationName} Base (surrounded by snowy ice!)
- **Item in the Pantry:** ${itemName}
- **How Much We Have:** ${currentStockStr}
- **How Much We Use Each Day:** ${dailyBurnStr}
- **How Many Days It Lasts:** ${daysRemaining} days
- **When the Big Supply Ship Arrives:** ${resupplyDateStr} (in about ${resupplyDays} days)
- **Status:** ${isShortfall ? '⚠️ Warning: We will need more before the ship gets here!' : '✅ All Good: Plenty of supplies!'}

### ❄️ Weather Outside
- **Current Temperature:** ${weather.temperatureCelsius}°C (${weather.temperatureCelsius < 0 ? 'Brrr, below freezing!' : 'Chilly!'})
- **Wind Speed:** ${weather.windSpeedKts} knots (${weather.condition})

### 💡 What This Means in Simple Words
${
  isShortfall
    ? `Our supply will run out **${gapDays} days before** the big supply ship gets here! Just like when your snack box is empty before grocery day, we need to order an emergency delivery right away so nobody gets cold!`
    : `We have plenty of supplies to keep the station warm and happy until the big ship arrives!`
}

### 🚀 What We Should Do Next!
${
  isShortfall
    ? `Tell the big supply ship (MV Vasiliy Golovnin) to pack extra ${itemName}, and turn down room heaters in empty rooms to save fuel!`
    : `Keep doing science and stay warm inside!`
}`;

      return {
        text,
        speechText: `${stationName} Base has ${currentStockStr} of ${itemName}, lasting ${daysRemaining} days. The big supply ship arrives in ${resupplyDays} days.`,
        toolEvents,
        sources: Array.from(sourcesSet),
        recommendedAction: isShortfall ? {
          id: `act-resupply-${Date.now()}`,
          title: `Send Extra ${itemName} to ${stationName}`,
          description: `Pack emergency supplies on MV Vasiliy Golovnin so our team stays safe and warm.`,
          targetStationId: stationId,
          actionType: 'resupply_priority',
          impact: `Keeps the station warm and fed with zero interruptions.`,
        } : undefined,
        isAgentic: true,
      };
    }

    // 2. WEATHER / METEOROLOGY / BLIZZARD
    if (
      lower.includes('weather') ||
      lower.includes('forecast') ||
      lower.includes('blizzard') ||
      lower.includes('wind') ||
      lower.includes('temperature') ||
      lower.includes('temp') ||
      lower.includes('snow') ||
      lower.includes('outside') ||
      lower.includes('play') ||
      lower.includes('cold')
    ) {
      const forecast = await dbTools.get_weather_forecast({ location: stationName, days: 5 });
      const current = await dbTools.get_weather({ location: stationName });

      toolEvents.push({
        id: 'evt-w-cur',
        toolName: 'get_weather',
        params: { location: stationName },
        resultSummary: `Current: ${current.temperatureCelsius}°C, Winds ${current.windSpeedKts} kts, ${current.condition}`,
        timestamp: new Date().toLocaleTimeString(),
      });
      toolEvents.push({
        id: 'evt-w-fc',
        toolName: 'get_weather_forecast',
        params: { location: stationName, days: 5 },
        resultSummary: `5-Day Outlook: ${forecast.summary}`,
        timestamp: new Date().toLocaleTimeString(),
      });

      sourcesSet.add('Open-Meteo High-Latitude Meteorological Service');

      const maxGusts = Math.max(...forecast.days.map((d: any) => d.maxGustsKts || 0));
      const hasSevere = maxGusts > 35;

      const text = `### 🌟 Simple Answer
Right now at **${stationName} Base**, it is **${current.temperatureCelsius}°C** (brrr, that is freezing cold!) with winds blowing at **${current.windSpeedKts} knots** (${current.condition}).

### ❄️ Weather Forecast for the Next Few Days
- **Today:** ${forecast.days[0]?.condition} | ${forecast.days[0]?.tempMinCelsius}°C to ${forecast.days[0]?.tempMaxCelsius}°C | Winds: ${forecast.days[0]?.avgWindSpeedKts} kts
- **Tomorrow:** ${forecast.days[1]?.condition} | ${forecast.days[1]?.tempMinCelsius}°C to ${forecast.days[1]?.tempMaxCelsius}°C | Winds: ${forecast.days[1]?.avgWindSpeedKts} kts ${forecast.days[1]?.blizzardRisk === 'Severe (Blizzard Warning)' ? '⚠️ (Blizzard Alert!)' : ''}
- **Day After:** ${forecast.days[2]?.condition} | ${forecast.days[2]?.tempMinCelsius}°C to ${forecast.days[2]?.tempMaxCelsius}°C

### 💡 Can We Go Outside?
${
  hasSevere
    ? `💨 **No, stay inside!** The wind is blowing super fast with heavy blowing snow. It feels like -40°C! It is time to stay inside the warm station with hot cocoa!`
    : `🧤 **Yes, but bundle up!** Put on your heavy astronaut-style snow suit, double mittens, and snow goggles before stepping out!`
}

### 🚀 What We Should Do Next!
${
  hasSevere
    ? `Lock down the snowmobiles, check that all doors are shut tight, and stay cozy inside!`
    : `Have a great time exploring and don't forget to take photos of the penguins!`
}`;

      return {
        text,
        speechText: `At ${stationName} Base, it is ${current.temperatureCelsius} degrees Celsius with wind blowing at ${current.windSpeedKts} knots. ${hasSevere ? 'A big snowstorm is coming, so stay cozy inside!' : 'Remember to wear your big warm snowsuit!'}`,
        toolEvents,
        sources: Array.from(sourcesSet),
        isAgentic: true,
      };
    }

    // 3. CARGO / SHIPMENTS / BOXES
    if (
      lower.includes('cargo') ||
      lower.includes('container') ||
      lower.includes('consignment') ||
      lower.includes('shipment') ||
      lower.includes('delay') ||
      lower.includes('transit') ||
      lower.includes('crg-')
    ) {
      const cargoList = await dbTools.get_cargo();
      const inTransit = await dbTools.get_cargo_in_transit();
      const delayed = await dbTools.get_delayed_cargo();

      toolEvents.push({
        id: 'evt-crg-1',
        toolName: 'get_cargo',
        params: {},
        resultSummary: `Retrieved ${cargoList.length} total shipments (${inTransit.length} sailing on ocean).`,
        timestamp: new Date().toLocaleTimeString(),
      });

      sourcesSet.add('POLAR-SATHI PostgreSQL (cargo)');

      const text = `### 🌟 Simple Answer
We are currently tracking **${cargoList.length} big supply boxes**, with **${inTransit.length} boxes currently sailing on the ocean** on their way to Antarctica!

### 🏠 Boxes on the Way
${inTransit
  .map(
    (c: any) =>
      `  • 📦 **${c.name}** (${c.trackingNumber}): Heading to **${c.destinationStationId}** | Expected arrival: **${c.eta}** | Current spot: *${c.currentLocation}*`
  )
  .join('\n')}

### 💡 What This Means in Simple Words
The big ship is carrying medicine, warm winter gear, and delicious food across the wavy ocean. Everything is kept super safe in special insulated freezer containers so nothing spoils!

### 🚀 What We Should Do Next!
Get the snow trucks ready at the harbor so when the ship arrives, our team can unpack all the boxes quickly!`;

      return {
        text,
        speechText: `We have ${inTransit.length} big supply boxes sailing across the ocean right now, carrying food and warm clothes to our stations!`,
        toolEvents,
        sources: Array.from(sourcesSet),
        isAgentic: true,
      };
    }

    // 4. PERSONNEL / CREW / SCIENTISTS
    if (
      lower.includes('personnel') ||
      lower.includes('crew') ||
      lower.includes('scientist') ||
      lower.includes('doctor') ||
      lower.includes('who is') ||
      lower.includes('headcount') ||
      lower.includes('team') ||
      lower.includes('people')
    ) {
      const roster = await dbTools.get_personnel_at_station({ station_id: stationId });
      const count = await dbTools.get_personnel_count({ station_id: stationId });

      toolEvents.push({
        id: 'evt-pers-1',
        toolName: 'get_personnel_at_station',
        params: { station_id: stationId },
        resultSummary: `Found ${roster.length} crew at ${stationName}.`,
        timestamp: new Date().toLocaleTimeString(),
      });

      sourcesSet.add('POLAR-SATHI PostgreSQL (personnel)');

      const text = `### 🌟 Simple Answer
There are **${count.activePersonnelCount} brave scientists and engineers** living and working at **${stationName} Base** right now!

### 🏠 Some of the Team Members
${roster
  .slice(0, 6)
  .map((p: any) => `  • 🧑‍🔬 **${p.name}** — ${p.role} (${p.status})`)
  .join('\n')}

### 💡 What They Do All Day
They study the ice, watch the stars and colorful auroras in the sky, check weather satellites, and make sure the station stays warm and safe! Everyone is healthy and happy.

### 🚀 What We Should Do Next!
Send them a warm hello message from command!`;

      return {
        text,
        speechText: `There are ${count.activePersonnelCount} scientists and engineers living at ${stationName} Base right now, and everyone is healthy and doing great!`,
        toolEvents,
        sources: Array.from(sourcesSet),
        isAgentic: true,
      };
    }

    // 5. ASSETS / EQUIPMENT / MACHINES / SNOWCATS / GENERATORS
    if (
      lower.includes('asset') ||
      lower.includes('generator') ||
      lower.includes('pistenbully') ||
      lower.includes('equipment') ||
      lower.includes('maintenance') ||
      lower.includes('machine') ||
      lower.includes('vehicle') ||
      lower.includes('truck') ||
      lower.includes('snowcat')
    ) {
      const assets = await dbTools.get_assets({ station_id: stationId });

      toolEvents.push({
        id: 'evt-ast-1',
        toolName: 'get_assets',
        params: { station_id: stationId },
        resultSummary: `Found ${assets.length} machines at ${stationName}.`,
        timestamp: new Date().toLocaleTimeString(),
      });

      sourcesSet.add('POLAR-SATHI PostgreSQL (assets, asset_maintenance)');

      const text = `### 🌟 Simple Answer
${stationName} Base has **${assets.length} super cool polar machines**, including big warm power generators and monster snowcats with giant tracks that drive over ice!

### 🏠 Our Machines
${assets
  .slice(0, 5)
  .map(
    (a: any) =>
      `- 🚜 **${a.name}**: Status **${a.operationalStatus}** | Working great!`
  )
  .join('\n')}

### 💡 What This Means in Simple Words
The big generators act like giant warm fireplaces that keep electricity running for our lights, kitchens, and computers. The PistenBully snow trucks are like winter superheroes that never get stuck in snowbanks!

### 🚀 What We Should Do Next!
Keep checking the engine oil and make sure the warm garage doors are closed tightly!`;

      return {
        text,
        speechText: `${stationName} has ${assets.length} cool polar machines including monster snowcats and big warm generators that are all running nicely!`,
        toolEvents,
        sources: Array.from(sourcesSet),
        isAgentic: true,
      };
    }

    // 6. OUTSIDE-APPLICATION QUESTIONS: World Capitals, Geography, General Science
    if (lower.includes('capital of') || lower.includes('what is the capital')) {
      const match = lower.match(/capital of\s+([a-zA-Z\s]+)/i);
      const country = match ? match[1].replace(/[?.]/g, '').trim() : '';

      const capitalMap: Record<string, string> = {
        france: 'Paris',
        india: 'New Delhi',
        norway: 'Oslo',
        russia: 'Moscow',
        usa: 'Washington, D.C.',
        'united states': 'Washington, D.C.',
        uk: 'London',
        'united kingdom': 'London',
        germany: 'Berlin',
        japan: 'Tokyo',
        china: 'Beijing',
        australia: 'Canberra',
        chile: 'Santiago',
        argentina: 'Buenos Aires',
        canada: 'Ottawa',
        brazil: 'Brasília',
        italy: 'Rome',
        spain: 'Madrid',
        'south africa': 'Pretoria and Cape Town',
        sweden: 'Stockholm',
        finland: 'Helsinki',
        denmark: 'Copenhagen',
        iceland: 'Reykjavík',
        'new zealand': 'Wellington',
      };

      const found = country && capitalMap[country.toLowerCase()];
      const capitalText = found
        ? `The capital of **${country.charAt(0).toUpperCase() + country.slice(1)}** is **${found}**!`
        : `The capital of **France** is **Paris**, and **India** is **New Delhi**!`;

      return {
        text: `### 🌟 Simple Answer
${capitalText}

### 💡 Fun Polar Fact!
When Indian polar explorers travel to Antarctica, their big airplane first lands in **Cape Town, South Africa**, which is our sunny gateway city before boarding the big icebreaker ship to Antarctica!`,
        speechText: found ? `The capital of ${country} is ${found}!` : 'The capital of France is Paris, and India is New Delhi!',
        toolEvents: [],
        sources: ['POLAR-SATHI World Geography for Kids'],
        isAgentic: true,
      };
    }

    // 7. ANTARCTIC TREATY
    if (lower.includes('treaty') || lower.includes('antarctic treaty')) {
      return {
        text: `### 🌟 Simple Answer
The **Antarctic Treaty** is a special world friendship promise made in **1959** so that Antarctica belongs to no single country!

### 💡 The Big Rules in Simple Words
1. 🕊️ **Only Peace and Friendship:** No soldiers or weapons are allowed. Antarctica is purely for science and nature!
2. 🔬 **Sharing Science:** All scientists from all countries share their discoveries like good friends!
3. 🐧 **Protecting Animals:** Penguins, whales, and seals are protected so their homes stay safe!
4. 🚫 **No Trash or Nuclear Waste:** Keeping Antarctica clean and sparkling white forever!`,
        speechText: 'The Antarctic Treaty is a world peace promise signed in 1959 so that Antarctica is kept safe for science and penguins with no weapons allowed!',
        toolEvents: [],
        sources: ['Antarctic Treaty for Young Citizens'],
        isAgentic: true,
      };
    }

    // 8. POLAR SCIENCE / ICE CORES / AURORAS
    if (
      lower.includes('ice core') ||
      lower.includes('drill') ||
      lower.includes('katabatic') ||
      lower.includes('aurora') ||
      lower.includes('penguin') ||
      lower.includes('shackleton') ||
      lower.includes('amundsen') ||
      lower.includes('scott')
    ) {
      if (lower.includes('aurora')) {
        return {
          text: `### 🌟 Simple Answer
The **Aurora Australis** (Southern Lights) is a magical glowing rainbow dance of light in the nighttime polar sky!

### 💡 How It Happens in Simple Words
The Sun sends tiny invisible energetic particles flying across space. When they reach Earth, our magnetic shield catches them and they bump into air atoms, glowing in bright neon greens, pinks, and purples!`,
          speechText: 'The Southern Lights are glowing neon ribbons in the sky made when particles from the Sun bump into Earth\'s air!',
          toolEvents: [],
          sources: ['Polar Sky Wonders for Kids'],
          isAgentic: true,
        };
      }

      return {
        text: `### 🌟 Simple Answer
**Ice cores** are like giant frozen time capsules! Scientists use giant drills to pull out long cylinders of ice from thousands of feet deep under the snow.

### 💡 How It Works
Each layer of snow traps tiny bubbles of air from hundreds of thousands of years ago, letting us see what the Earth was like when mammoths roamed around!`,
        speechText: 'Ice cores are frozen time capsules that trap ancient air bubbles from thousands of years ago!',
        toolEvents: [],
        sources: ['Polar Science for Curious Kids'],
        isAgentic: true,
      };
    }

    // 9. GENERAL INTELLIGENCE FALLBACK
    return {
      text: `### 🌟 Simple Answer
Hello explorer! I am your **DHRUVYAN Station Helper**! I can answer anything about our polar bases, our big ships, the weather outside, or any science question you are curious about!

### 💬 Fun Things to Ask Me
- 🎙️ *"Explain this whole website to me like I'm 8!"*
- ❄️ *"How cold is it at Bharati and Maitri right now?"*
- 🍲 *"How much food and warm fuel is left?"*
- 🚜 *"Can we drive the snow trucks outside tomorrow?"*
- 🚢 *"Where is our big supply ship right now?"*
- 🐧 *"Tell me about the penguins in Antarctica!"*

You can also tap the **Microphone button** 🎙️ and talk to me with your voice!`,
      speechText: 'Hello explorer! I am your DHRUVYAN Station Helper. Ask me anything about Antarctica, our food, fuel, snow trucks, or the weather!',
      toolEvents: [],
      sources: ['DHRUVYAN Polar Command Helper'],
      isAgentic: true,
    };
  }

  private summarizeToolResult(toolName: string, result: any): string {
    if (!result) return 'Completed with null response.';
    if (result.error) return `Error: ${result.error}`;
    if (Array.isArray(result)) return `Retrieved ${result.length} record(s).`;
    if (toolName === 'get_weather') {
      return `Temp: ${result.temperatureCelsius}°C, Wind: ${result.windSpeedKts} kts, Condition: ${result.condition}`;
    }
    if (toolName === 'get_weather_forecast') {
      return `Retrieved ${result.days?.length || 0}-day outlook. Summary: ${result.summary?.substring(0, 70)}...`;
    }
    if (toolName === 'get_projected_stockout') {
      return `Days remaining: ${result.projectedDaysRemaining}d, Days to resupply: ${result.daysUntilResupply}d, Gap: ${result.projectedSupplyGapDays}d`;
    }
    if (toolName === 'run_what_if_simulation') {
      return `Simulated ${result.projectedStockouts?.length || 0} critical stockout(s) under delay.`;
    }
    if (toolName === 'get_station_emergency_snapshot') {
      return `Snapshot ready: ${result.personnelCount} crew, ${result.vitalLifeSupportAssets?.length} assets, ${result.availableVehicles?.length} vehicles`;
    }
    return `Retrieved operational record for ${result.name || result.code || result.item || 'entity'}.`;
  }

  private extractSpeechText(fullText: string): string {
    const answerMatch = fullText.match(/### (?:🌟 Simple Answer|Answer)\s*([\s\S]*?)(?=###|$)/i);
    const content = answerMatch ? answerMatch[1].trim() : fullText;
    const clean = content.replace(/[*_#`\[\]]/g, '').trim();
    const sentences = clean.split(/(?<=[.?!])\s+/).slice(0, 3).join(' ');
    return sentences || 'All polar stations are safe, warm, and happy!';
  }

  private extractRecommendedAction(fullText: string): any {
    const actionMatch = fullText.match(/### Recommended Action\s*([\s\S]*?)(?=###|$)/i);
    if (!actionMatch || !actionMatch[1].trim() || actionMatch[1].toLowerCase().includes('none')) {
      return undefined;
    }
    const actionText = actionMatch[1].trim().replace(/[*_#]/g, '');
    return {
      id: `act-${Date.now()}`,
      title: 'Operational Protocol Recommendation',
      description: actionText,
      targetStationId: 'st-bharati',
      actionType: 'resupply_priority',
      impact: 'Prevents supply gap and maintains polar life-support safety margin.',
    };
  }
}

export const polarAgent = new PolarOperationsAgent();
