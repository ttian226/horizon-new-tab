// Weather Service - Open-Meteo API (免费，无需 API Key)
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
