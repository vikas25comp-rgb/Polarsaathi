export interface WeatherData {
  location: string;
  stationId?: string;
  latitude: number;
  longitude: number;
  temperatureCelsius: number;
  feelsLikeCelsius: number;
  windSpeedKts: number;
  windDirectionDeg: number;
  windGustsKts?: number;
  precipitationMm: number;
  snowMm?: number;
  visibilityKm: number;
  pressureHpa: number;
  humidityPct: number;
  condition: string;
  severeWeatherWarning?: string;
  updatedAt: string;
  isSimulatedFallback?: boolean;
}

export interface WeatherForecastDay {
  date: string;
  tempMinCelsius: number;
  tempMaxCelsius: number;
  avgWindSpeedKts: number;
  maxGustsKts: number;
  precipitationChancePct: number;
  snowAccumulationCm: number;
  condition: string;
  blizzardRisk: 'Low' | 'Moderate' | 'Severe (Blizzard Warning)';
  flightWindowStatus: 'Open' | 'Marginal' | 'Grounded (Below Mins)';
  traverseSafetyStatus: 'Safe' | 'Exercise Caution' | 'Hazardous / Crevasse Risk';
}

export interface ForecastData {
  location: string;
  stationId?: string;
  latitude: number;
  longitude: number;
  days: WeatherForecastDay[];
  summary: string;
  operationalImpactAnalysis: string;
}

export interface WeatherProvider {
  name: string;
  getCurrentWeather(location: string, latitude: number, longitude: number): Promise<WeatherData>;
  getWeatherForecast(location: string, latitude: number, longitude: number, days?: number): Promise<ForecastData>;
}
