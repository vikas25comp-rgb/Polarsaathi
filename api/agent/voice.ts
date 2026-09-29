import type { VercelRequest, VercelResponse } from '@vercel/node';
import { polarAgent, syncServerStore } from '../../_shared/init';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transcript, conversationHistory, syncState } = req.body || {};
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    if (syncState) {
      syncServerStore(syncState);
    }

    const result = await polarAgent.runAgent(transcript, conversationHistory || []);
    return res.json(result);
  } catch (error: any) {
    console.error('[DHRUVYAN Agent] Error in agent voice:', error);
    return res.status(500).json({ error: error.message || 'Voice agent error' });
  }
}
