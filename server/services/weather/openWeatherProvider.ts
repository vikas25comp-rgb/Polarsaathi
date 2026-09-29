import { WeatherProvider, WeatherData, ForecastData, WeatherForecastDay } from './weatherTypes';

export class OpenWeatherProvider implements WeatherProvider {
  public name = 'OpenWeather & Open-Meteo Polar Meterological Service';
  private apiKey: string;

  constructor(apiKey: string = process.env.WEATHER_API_KEY || '') {
    this.apiKey = apiKey;
  }

  public async getCurrentWeather(location: string, latitude: number, longitude: number): Promise<WeatherData> {
    // If OpenWeather key is configured, use OpenWeather
    if (this.apiKey && this.apiKey !== 'your_weather_api_key_here') {
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${this.apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const windKts = Number((data.wind?.speed * 1.94384).toFixed(1));
          const gustsKts = data.wind?.gust ? Number((data.wind.gust * 1.94384).toFixed(1)) : undefined;

          let warning: string | undefined = undefined;
          if (windKts > 35) {
            warning = 'Gale Force Blizzard Alert: Extreme wind chill hazard. All exterior travel suspended.';
          } else if (data.main?.temp < -35) {
            warning = 'Severe Deep Freeze Alert: Sub-zero hydraulic seal embrittlement risk.';
          }

          return {
            location: data.name || location,
            latitude,
            longitude,
            temperatureCelsius: Number(data.main?.temp.toFixed(1)),
            feelsLikeCelsius: Number(data.main?.feels_like.toFixed(1)),
            windSpeedKts: windKts,
            windDirectionDeg: data.wind?.deg || 0,
            windGustsKts: gustsKts,
            precipitationMm: data.rain?.['1h'] || data.snow?.['1h'] || 0,
            snowMm: data.snow?.['1h'] || 0,
            visibilityKm: Number(((data.visibility || 10000) / 1000).toFixed(1)),
            pressureHpa: data.main?.pressure || 990,
            humidityPct: data.main?.humidity || 75,
            condition: data.weather?.[0]?.description || 'Polar clear',
            severeWeatherWarning: warning,
            updatedAt: new Date().toISOString(),
          };
        }
      } catch (err) {
        console.warn('[WeatherProvider] OpenWeather call failed, falling back to Open-Meteo:', err);
      }
    }

    // Default zero-config live polar weather via Open-Meteo (Real high-latitude meteorological model)
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,precipitation,rain,snowfall,weather_code,surface_pressure,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=kn`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const cur = data.current || {};
        const windKts = Number(cur.wind_speed_10m || 20);
        const gustsKts = Number(cur.wind_gusts_10m || windKts * 1.3);
        const temp = Number(cur.temperature_2m ?? -22.5);
        const feelsLike = Number(cur.apparent_temperature ?? temp - 8);

        let warning: string | undefined = undefined;
        if (windKts > 30 || gustsKts > 45) {
          warning = `High Wind Hazard: Sustained winds at ${windKts} kts with gusts to ${gustsKts} kts. Blizzard conditions developing.`;
        }

        return {
          location,
          latitude,
          longitude,
          temperatureCelsius: temp,
          feelsLikeCelsius: feelsLike,
          windSpeedKts: windKts,
          windDirectionDeg: cur.wind_direction_10m || 180,
          windGustsKts: gustsKts,
          precipitationMm: cur.precipitation || 0,
          snowMm: cur.snowfall || 0,
          visibilityKm: windKts > 30 ? 2.5 : 10.0,
          pressureHpa: Math.round(cur.surface_pressure || 988),
          humidityPct: Math.round(cur.relative_humidity_2m || 78),
          condition: this.mapWmoWeatherCode(cur.weather_code),
          severeWeatherWarning: warning,
          updatedAt: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('[WeatherProvider] Open-Meteo call failed, using deterministic polar climate baseline:', err);
    }

    // Offline / Fallback baseline
    return this.getOfflineBaselineWeather(location, latitude, longitude);
  }

  public async getWeatherForecast(location: string, latitude: number, longitude: number, days: number = 5): Promise<ForecastData> {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max&wind_speed_unit=kn&forecast_days=${days}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const daily = data.daily || {};
        const forecastDays: WeatherForecastDay[] = [];

        for (let i = 0; i < (daily.time?.length || 0); i++) {
          const windMax = Number(daily.wind_speed_10m_max?.[i] || 22);
          const gustsMax = Number(daily.wind_gusts_10m_max?.[i] || windMax * 1.35);
          const snow = Number(daily.snowfall_sum?.[i] || 0);

          let blizzardRisk: WeatherForecastDay['blizzardRisk'] = 'Low';
          let flightWindow: WeatherForecastDay['flightWindowStatus'] = 'Open';
          let traverseSafety: WeatherForecastDay['traverseSafetyStatus'] = 'Safe';

          if (windMax >= 35 || gustsMax >= 50 || snow >= 8) {
            blizzardRisk = 'Severe (Blizzard Warning)';
            flightWindow = 'Grounded (Below Mins)';
            traverseSafety = 'Hazardous / Crevasse Risk';
          } else if (windMax >= 25 || gustsMax >= 38) {
            blizzardRisk = 'Moderate';
            flightWindow = 'Marginal';
            traverseSafety = 'Exercise Caution';
          }

          forecastDays.push({
            date: daily.time[i],
            tempMinCelsius: Number(daily.temperature_2m_min?.[i] ?? -28),
            tempMaxCelsius: Number(daily.temperature_2m_max?.[i] ?? -19),
            avgWindSpeedKts: windMax,
            maxGustsKts: gustsMax,
            precipitationChancePct: daily.precipitation_probability_max?.[i] || 20,
            snowAccumulationCm: snow,
            condition: this.mapWmoWeatherCode(daily.weather_code?.[i]),
            blizzardRisk,
            flightWindowStatus: flightWindow,
            traverseSafetyStatus: traverseSafety,
          });
        }

        const highWindDays = forecastDays.filter((d) => d.avgWindSpeedKts >= 28).length;
        const summary = `${location}: ${days}-day outlook indicates ${highWindDays > 0 ? `${highWindDays} high-wind/blizzard days` : 'favorable polar transit conditions'}.`;
        const operationalImpact = highWindDays > 0
          ? `Gale force winds expected. Surface cargo traverses and ski-plane (Basler BT-67) flights must be restricted on days with gusts > 35 kts. Generator heating fuel consumption will increase by an estimated 12-18% due to thermal wind chill.`
          : `Weather conditions remain within safe operating thresholds for over-snow heavy traverses and aerial operations.`;

        return {
          location,
          latitude,
          longitude,
          days: forecastDays,
          summary,
          operationalImpactAnalysis: operationalImpact,
        };
      }
    } catch (err) {
      console.warn('[WeatherProvider] Open-Meteo forecast failed, generating baseline forecast:', err);
    }

    return this.getOfflineBaselineForecast(location, latitude, longitude, days);
  }

  private mapWmoWeatherCode(code?: number): string {
    if (code === undefined || code === null) return 'Polar Clear';
    if (code === 0) return 'Clear Skies (Astronomical Seeing)';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Ice Fog / Ground Blizzard Mist';
    if (code <= 65) return 'Freezing Drizzle / Sleet';
    if (code <= 75) return 'Blowing Snow / Drift';
    if (code <= 86) return 'Heavy Polar Snow Blizzard';
    return 'Severe Polar Storm';
  }

  private getOfflineBaselineWeather(location: string, latitude: number, longitude: number): WeatherData {
    const isArctic = latitude > 0;
    const baseTemp = isArctic ? -14.5 : -24.8;
    return {
      location,
      latitude,
      longitude,
      temperatureCelsius: baseTemp,
      feelsLikeCelsius: baseTemp - 7,
      windSpeedKts: 24,
      windDirectionDeg: 140,
      windGustsKts: 32,
      precipitationMm: 0,
      snowMm: 0.2,
      visibilityKm: 8.5,
      pressureHpa: 988,
      humidityPct: 80,
      condition: 'Blowing Snow & Low Cloud',
      updatedAt: new Date().toISOString(),
      isSimulatedFallback: true,
    };
  }

  private getOfflineBaselineForecast(location: string, latitude: number, longitude: number, days: number): ForecastData {
    const forecastDays: WeatherForecastDay[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const isBlizzard = i === 1 || i === 2; // day 2-3 simulate high winds
      const wind = isBlizzard ? 36 : 18;

      forecastDays.push({
        date: d.toISOString().split('T')[0],
        tempMinCelsius: isBlizzard ? -31 : -24,
        tempMaxCelsius: isBlizzard ? -22 : -17,
        avgWindSpeedKts: wind,
        maxGustsKts: wind * 1.35,
        precipitationChancePct: isBlizzard ? 75 : 15,
        snowAccumulationCm: isBlizzard ? 6.5 : 0.5,
        condition: isBlizzard ? 'Severe Blizzard Warning' : 'Overcast & Cold',
        blizzardRisk: isBlizzard ? 'Severe (Blizzard Warning)' : 'Low',
        flightWindowStatus: isBlizzard ? 'Grounded (Below Mins)' : 'Open',
        traverseSafetyStatus: isBlizzard ? 'Hazardous / Crevasse Risk' : 'Safe',
      });
    }

    return {
      location,
      latitude,
      longitude,
      days: forecastDays,
      summary: `${location}: Multi-day forecast predicts high winds on upcoming days.`,
      operationalImpactAnalysis: `Forecast indicates high wind and blowing snow on day 2. Over-snow transport and flight windows must be paused during active blizzard warning. Fuel burn rate projected to elevate by 15%.`,
    };
  }
}
