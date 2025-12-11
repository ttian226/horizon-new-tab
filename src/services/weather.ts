// Weather Service - Open-Meteo API (free, no API key required)
// https://open-meteo.com/

export interface WeatherData {
  temperature: number
  weatherCode: number
  isDay: boolean
}

export async function getWeather(latitude: number, longitude: number): Promise<WeatherData> {
  // TODO: Implement weather fetching
  throw new Error('Not implemented')
}
