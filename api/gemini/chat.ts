import type { VercelRequest, VercelResponse } from '@vercel/node';
import { polarAgent, syncServerStore } from '../_shared/init';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, conversationHistory, syncState } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (syncState) syncServerStore(syncState);

    const result = await polarAgent.runAgent(prompt, conversationHistory || []);
    return res.json(result);
  } catch (error: any) {
    console.error('[DHRUVYAN Agent] Error in gemini chat:', error);
    return res.status(500).json({ error: error.message || 'Agent error' });
  }
}
