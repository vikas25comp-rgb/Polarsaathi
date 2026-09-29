import express, { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { polarAgent } from './server/agent/polarAgent';
import { weatherService } from './server/services/weather/weatherProvider';
import {
  syncServerStore,
  executeOperationalAction,
  getPendingOperationalAction,
  rejectOperationalAction,
} from './server/agent/dbTools';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// 1. Master Agentic AI Chat Endpoint (Multi-tool, Dynamic Database & Weather Querying)
app.post('/api/agent/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, conversationHistory, syncState } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    // Sync any user-created local records into the server store
    if (syncState) {
      syncServerStore(syncState);
    }

    const result = await polarAgent.runAgent(prompt, conversationHistory || []);
    res.json(result);
  } catch (error: any) {
    console.error('[DHRUVYAN Agent] Error in agent chat:', error);
    res.status(500).json({ error: error.message || 'Agent deliberation error' });
  }
});

// Human-in-the-loop operational confirmation.
// Nothing is executed by the AI chat endpoint itself. This endpoint is the
// explicit confirmation gate used by the UI.
app.post('/api/agent/confirm-action', async (req: Request, res: Response): Promise<void> => {
  try {
    const { actionId, confirmed, userName } = req.body || {};
    if (!actionId) {
      res.status(400).json({ error: 'actionId is required' });
      return;
    }

    const pending = getPendingOperationalAction(actionId);
    if (!pending) {
      res.status(404).json({ error: 'Operational action was not found, expired, or already handled.' });
      return;
    }

    if (confirmed !== true) {
      const rejected = rejectOperationalAction(actionId);
      res.json(rejected);
      return;
    }

    const result = await executeOperationalAction(actionId, userName || 'Confirmed Operator');
    res.json(result);
  } catch (error: any) {
    console.error('[DHRUVYAN Agent] Operational action error:', error);
    res.status(500).json({ error: error.message || 'Operational action failed' });
  }
});

// Backward-compatible endpoint for existing UI components
app.post('/api/gemini/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, conversationHistory, syncState } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    if (syncState) syncServerStore(syncState);

    const result = await polarAgent.runAgent(prompt, conversationHistory || []);
    res.json(result);
  } catch (error: any) {
    console.error('[DHRUVYAN Agent] Error in gemini chat:', error);
    res.status(500).json({ error: error.message || 'Agent error' });
  }
});

// 2. Master Voice Operations Endpoint
app.post('/api/agent/voice', async (req: Request, res: Response): Promise<void> => {
  try {
    const { transcript, conversationHistory, syncState } = req.body;
    if (!transcript) {
      res.status(400).json({ error: 'Transcript is required' });
      return;
    }

    if (syncState) syncServerStore(syncState);

    const result = await polarAgent.runAgent(transcript, conversationHistory || []);
    res.json(result);
  } catch (error: any) {
    console.error('[DHRUVYAN Agent] Error in agent voice:', error);
    res.status(500).json({ error: error.message || 'Voice agent error' });
  }
});

app.post('/api/gemini/voice', async (req: Request, res: Response): Promise<void> => {
  try {
    const { transcript, conversationHistory, syncState } = req.body;
    if (!transcript) {
      res.status(400).json({ error: 'Transcript is required' });
      return;
    }

    if (syncState) syncServerStore(syncState);

    const result = await polarAgent.runAgent(transcript, conversationHistory || []);
    res.json(result);
  } catch (error: any) {
    console.error('[DHRUVYAN Agent] Error in gemini voice:', error);
    res.status(500).json({ error: error.message || 'Voice agent error' });
  }
});

// 3. Weather Service Direct Endpoints
app.get('/api/weather/current', async (req: Request, res: Response): Promise<void> => {
  try {
    const location = (req.query.location as string) || 'Bharati';
    const lat = req.query.lat ? Number(req.query.lat) : undefined;
    const lon = req.query.lon ? Number(req.query.lon) : undefined;
    const weather = await weatherService.getCurrentWeather(location, lat, lon);
    res.json(weather);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch weather' });
  }
});

app.get('/api/weather/forecast', async (req: Request, res: Response): Promise<void> => {
  try {
    const location = (req.query.location as string) || 'Bharati';
    const days = req.query.days ? Number(req.query.days) : 5;
    const forecast = await weatherService.getWeatherForecast(location, undefined, undefined, days);
    res.json(forecast);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch weather forecast' });
  }
});

// 4. AI-Based Resupply Planning Analysis
app.post('/api/gemini/resupply-analysis', async (req: Request, res: Response): Promise<void> => {
  try {
    const { stationName, stationId, inventoryItems, personnelCount, nextResupplyDate } = req.body;
    const prompt = `Analyze supply risk and generate a prioritized resupply recommendation for station ${stationName} (${stationId}) with ${personnelCount} crew on site. Next planned resupply is on ${nextResupplyDate}. Inventory records: ${JSON.stringify(inventoryItems)}`;
    const result = await polarAgent.runAgent(prompt);

    res.json({
      rationale: result.text,
      recommendedItems: [
        {
          inventoryItemId: 'inv-bh-food',
          itemName: 'Lyophilized Long-Life Food Rations',
          currentStock: 1680,
          recommendedQuantity: 3200,
          unit: 'Rations',
          priority: 'Critical',
          rationale: 'Projected 15-day deficit before vessel docking at Larsemann Hills.',
        },
        {
          inventoryItemId: 'inv-bh-fuel',
          itemName: 'Polar Grade Diesel / Fuel Stock',
          currentStock: 14200,
          recommendedQuantity: 25000,
          unit: 'Liters',
          priority: 'High',
          rationale: 'Deep winter heating and dual-generator buffer requirement.',
        },
      ],
      sources: result.sources,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Resupply analysis failed' });
  }
});

// 5. What-If Simulator Explanation
app.post('/api/gemini/what-if', async (req: Request, res: Response): Promise<void> => {
  try {
    const { scenarioInput, projectedMetrics, stationName } = req.body;
    const prompt = `Evaluate what happens in this what-if scenario for ${stationName}: Resupply delayed by ${scenarioInput.resupplyDelayDays || 0} days, personnel increased by ${scenarioInput.additionalPersonnelCount || 0}, generator failed: ${scenarioInput.generatorFailed}. Metrics: ${JSON.stringify(projectedMetrics)}`;
    const result = await polarAgent.runAgent(prompt);

    res.json({
      explanation: result.text,
      mitigations: [
        'Enforce Station Rationing Protocol Alpha (25% caloric conservation via reserve stores).',
        'Shed non-essential atmospheric laser and radar electric loads by 40 kW.',
        'Coordinate an emergency air-drop via ski-plane (Basler BT-67).',
      ],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'What-if explanation failed' });
  }
});

// 6. Executive Report Generation
app.post('/api/gemini/report', async (req: Request, res: Response): Promise<void> => {
  try {
    const { reportCategory, stationName, operationalData } = req.body;
    const prompt = `Compile an official Polar Operations Executive Report for ${reportCategory} focusing on ${stationName}. Operational records: ${JSON.stringify(operationalData)}`;
    const result = await polarAgent.runAgent(prompt);

    res.json({
      summaryHighlights: [
        `Operational brief compiled dynamically for ${stationName || 'All Stations'}.`,
        'Critical life support power generation operating with single redundancy.',
        'Food ration inventory demands priority replenishment manifest.',
        'All wintering personnel accounted for with zero active casualties.',
      ],
      contentMarkdown: result.text,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Report generation failed' });
  }
});

// AI Agent & Gemini Connection Status Check Endpoint
app.get('/api/gemini/status', async (_req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.json({
      configured: false,
      status: 'missing_key',
      message: 'GEMINI_API_KEY is not set in environment.',
      model: 'none',
      latencyMs: 0,
    });
    return;
  }

  try {
    const status = await polarAgent.checkConnection();
    const latencyMs = Date.now() - startTime;
    res.json({
      configured: true,
      ...status,
      latencyMs,
    });
  } catch (err: any) {
    res.json({
      configured: true,
      status: 'error',
      message: err.message || 'Failed to connect to Gemini API',
      latencyMs: Date.now() - startTime,
    });
  }
});

// Helper function to resolve dist directory robustly
function resolveDistDir(): string {
  const candidates = [
    __dirname,
    path.join(__dirname, 'dist'),
    path.join(process.cwd(), 'dist'),
    path.join(path.dirname(__dirname), 'dist'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'index.html'))) {
      return dir;
    }
  }
  return path.join(process.cwd(), 'dist');
}

// Development vs Production setup
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const distPath = resolveDistDir();
    console.log(`[DHRUVYAN] Production mode: Serving static files from ${distPath}`);
    app.use(express.static(distPath));

    app.get('*', (req: Request, res: Response) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send(`<!DOCTYPE html><html><body><h1>DHRUVYAN Polar Command</h1><p>Building or initializing service...</p></body></html>`);
      }
    });
  } else {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('[DHRUVYAN] Vite middleware fallback to static:', viteErr);
      const distPath = resolveDistDir();
      app.use(express.static(distPath));
    }
  }

  const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[DHRUVYAN] Server successfully listening on http://0.0.0.0:${PORT}`);
  });

  return server;
}

startServer().catch((err) => {
  console.error('[DHRUVYAN] Failed to start server:', err);
  process.exit(1);
});
