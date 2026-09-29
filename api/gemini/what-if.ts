import type { VercelRequest, VercelResponse } from '@vercel/node';
import { polarAgent } from '../../_shared/init';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { scenarioInput, projectedMetrics, stationName } = req.body || {};
    const prompt = `Evaluate what happens in this what-if scenario for ${stationName}: Resupply delayed by ${scenarioInput?.resupplyDelayDays || 0} days, personnel increased by ${scenarioInput?.additionalPersonnelCount || 0}, generator failed: ${scenarioInput?.generatorFailed}. Metrics: ${JSON.stringify(projectedMetrics)}`;
    const result = await polarAgent.runAgent(prompt);

    return res.json({
      explanation: result.text,
      mitigations: [
        'Enforce Station Rationing Protocol Alpha (25% caloric conservation via reserve stores).',
        'Shed non-essential atmospheric laser and radar electric loads by 40 kW.',
        'Coordinate an emergency air-drop via ski-plane (Basler BT-67).',
      ],
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'What-if explanation failed' });
  }
}
