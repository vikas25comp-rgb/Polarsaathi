import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow both GET and POST for health checks
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      configured: false,
      status: 'missing_key',
      message: 'GEMINI_API_KEY is not set in environment variables.',
      model: 'none',
      latencyMs: 0,
    });
  }

  const testModels = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];
  let lastError = '';

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    for (const model of testModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: 'Ping: polar station connectivity test',
        });
        if (response && response.text) {
          const latencyMs = Date.now() - startTime;
          return res.status(200).json({
            configured: true,
            status: 'connected',
            model,
            message: `Connected successfully to Google Gemini (${model}).`,
            latencyMs,
          });
        }
      } catch (err: any) {
        lastError = err.message || String(err);
      }
    }

    const latencyMs = Date.now() - startTime;
    return res.status(200).json({
      configured: true,
      status: 'error',
      model: testModels[0],
      message: `Gemini ping failed: ${lastError}`,
      latencyMs,
    });
  } catch (outerErr: any) {
    const latencyMs = Date.now() - startTime;
    return res.status(200).json({
      configured: true,
      status: 'error',
      model: 'gemini-3.5-flash',
      message: `Initialization error: ${outerErr.message || outerErr}`,
      latencyMs,
    });
  }
}
