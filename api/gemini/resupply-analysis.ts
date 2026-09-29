import type { VercelRequest, VercelResponse } from '@vercel/node';
import { polarAgent } from '../../_shared/init';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { stationName, stationId, inventoryItems, personnelCount, nextResupplyDate } = req.body || {};
    const prompt = `Analyze supply risk and generate a prioritized resupply recommendation for station ${stationName} (${stationId}) with ${personnelCount} crew on site. Next planned resupply is on ${nextResupplyDate}. Inventory records: ${JSON.stringify(inventoryItems)}`;
    const result = await polarAgent.runAgent(prompt);

    return res.json({
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
    return res.status(500).json({ error: error.message || 'Resupply analysis failed' });
  }
}
