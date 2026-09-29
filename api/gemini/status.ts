import type { VercelRequest, VercelResponse } from '@vercel/node';
import { polarAgent } from '../_shared/init';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({
      configured: false,
      status: 'missing_key',
      message: 'GEMINI_API_KEY is not set in environment.',
      model: 'none',
      latencyMs: 0,
    });
  }

  try {
    const status = await polarAgent.checkConnection();
    const latencyMs = Date.now() - startTime;
    return res.json({
      configured: true,
      ...status,
      latencyMs,
    });
  } catch (err: any) {
    return res.json({
      configured: true,
      status: 'error',
      message: err.message || 'Failed to connect to Gemini API',
      latencyMs: Date.now() - startTime,
    });
  }
}
