// Background Image Service - Pexels API
// https://www.pexels.com/api/

export interface BackgroundImage {
  url: string
  photographer: string
  photographerUrl: string
}

export async function getBackgroundImage(): Promise<BackgroundImage> {
  // TODO: Implement background image fetching
  // Note: Requires PEXELS_API_KEY
  throw new Error('Not implemented')
}
