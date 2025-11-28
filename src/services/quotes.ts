// Quotes Service - Quotable API (免费，无需 API Key)
// https://github.com/lukePeavey/quotable

export interface Quote {
  content: string
  author: string
}

export async function getRandomQuote(): Promise<Quote> {
  // TODO: Implement quote fetching
  throw new Error('Not implemented')
}
