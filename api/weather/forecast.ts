import type { VercelRequest, VercelResponse } from '@vercel/node';
import { weatherService } from '../../_shared/init';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const location = (req.query.location as string) || 'Bharati';
    const days = req.query.days ? Number(req.query.days) : 5;
    const forecast = await weatherService.getWeatherForecast(location, undefined, undefined, days);
    return res.json(forecast);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch weather forecast' });
  }
}
