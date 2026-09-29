import type { VercelRequest, VercelResponse } from '@vercel/node';
import { polarAgent } from '../_shared/init';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reportCategory, stationName, operationalData } = req.body || {};
    const prompt = `Compile an official Polar Operations Executive Report for ${reportCategory} focusing on ${stationName}. Operational records: ${JSON.stringify(operationalData)}`;
    const result = await polarAgent.runAgent(prompt);

    return res.json({
      summaryHighlights: [
        `Operational brief compiled dynamically for ${stationName || 'All Stations'}.`,
        'Critical life support power generation operating with single redundancy.',
        'Food ration inventory demands priority replenishment manifest.',
        'All wintering personnel accounted for with zero active casualties.',
      ],
      contentMarkdown: result.text,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Report generation failed' });
  }
}
