import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getPendingOperationalAction,
  rejectOperationalAction,
  executeOperationalAction,
} from '../../_shared/init';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { actionId, confirmed, userName } = req.body || {};
    if (!actionId) {
      return res.status(400).json({ error: 'actionId is required' });
    }

    const pending = getPendingOperationalAction(actionId);
    if (!pending) {
      return res.status(404).json({ error: 'Operational action was not found, expired, or already handled.' });
    }

    if (confirmed !== true) {
      const rejected = rejectOperationalAction(actionId);
      return res.json(rejected);
    }

    const result = await executeOperationalAction(actionId, userName || 'Confirmed Operator');
    return res.json(result);
  } catch (error: any) {
    console.error('[DHRUVYAN Agent] Operational action error:', error);
    return res.status(500).json({ error: error.message || 'Operational action failed' });
  }
}
