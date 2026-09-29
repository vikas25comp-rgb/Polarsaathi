import { WeatherProvider, WeatherData, ForecastData } from './weatherTypes';
import { OpenWeatherProvider } from './openWeatherProvider';

export class WeatherService {
  private provider: WeatherProvider;
  private stationCoordinates: Record<string, { lat: number; lon: number; name: string }> = {
    'st-bharati': { lat: -69.407, lon: 76.187, name: 'Bharati Station (Larsemann Hills)' },
    'bharati': { lat: -69.407, lon: 76.187, name: 'Bharati Station (Larsemann Hills)' },
    'st-maitri': { lat: -70.766, lon: 11.733, name: 'Maitri Station (Schirmacher Oasis)' },
    'maitri': { lat: -70.766, lon: 11.733, name: 'Maitri Station (Schirmacher Oasis)' },
    'st-himadri': { lat: 78.923, lon: 11.928, name: 'Himadri Station (Ny-Ålesund, Arctic)' },
    'himadri': { lat: 78.923, lon: 11.928, name: 'Himadri Station (Ny-Ålesund, Arctic)' },
  };

  constructor(provider?: WeatherProvider) {
    this.provider = provider || new OpenWeatherProvider();
  }

  public setProvider(provider: WeatherProvider) {
    this.provider = provider;
  }

  public getCoordinatesForStation(stationIdOrName: string): { lat: number; lon: number; name: string } {
    const key = stationIdOrName.toLowerCase().trim();
    if (this.stationCoordinates[key]) {
      return this.stationCoordinates[key];
    }
    for (const [k, v] of Object.entries(this.stationCoordinates)) {
      if (key.includes(k) || v.name.toLowerCase().includes(key)) {
        return v;
      }
    }
    // Default to Bharati
    return this.stationCoordinates['st-bharati'];
  }

  public async getCurrentWeather(location: string, lat?: number, lon?: number): Promise<WeatherData> {
    const coords = (lat !== undefined && lon !== undefined)
      ? { lat, lon, name: location }
      : this.getCoordinatesForStation(location);

    return this.provider.getCurrentWeather(coords.name, coords.lat, coords.lon);
  }

  public async getWeatherForecast(location: string, lat?: number, lon?: number, days: number = 5): Promise<ForecastData> {
    const coords = (lat !== undefined && lon !== undefined)
      ? { lat, lon, name: location }
      : this.getCoordinatesForStation(location);

    return this.provider.getWeatherForecast(coords.name, coords.lat, coords.lon, days);
  }
}

export const weatherService = new WeatherService();
