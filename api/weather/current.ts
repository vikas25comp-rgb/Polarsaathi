import type { VercelRequest, VercelResponse } from '@vercel/node';
import { weatherService } from '../_shared/init';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const location = (req.query.location as string) || 'Bharati';
    const lat = req.query.lat ? Number(req.query.lat) : undefined;
    const lon = req.query.lon ? Number(req.query.lon) : undefined;
    const weather = await weatherService.getCurrentWeather(location, lat, lon);
    return res.json(weather);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch weather' });
  }
}
