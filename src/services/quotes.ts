// Quotes Service - Quotable API (free, no API key required)
// https://github.com/lukePeavey/quotable

export interface Quote {
  content: string
  author: string
}

export async function getRandomQuote(): Promise<Quote> {
  // TODO: Implement quote fetching
  throw new Error('Not implemented')
}
