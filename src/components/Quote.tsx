import { useState, useEffect } from 'react'

interface QuoteData {
  content: string
  author: string
}

// Fallback quotes in case API fails
const FALLBACK_QUOTES: QuoteData[] = [
  { content: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { content: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
  { content: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
  { content: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { content: 'It is during our darkest moments that we must focus to see the light.', author: 'Aristotle' },
]

async function fetchQuote(): Promise<QuoteData> {
  try {
    const response = await fetch('https://api.quotable.io/random?maxLength=100')
    if (!response.ok) throw new Error('Failed to fetch quote')
    const data = await response.json()
    return {
      content: data.content,
      author: data.author,
    }
  } catch {
    // Return a random fallback quote
    return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]
  }
}

export default function Quote() {
  const [quote, setQuote] = useState<QuoteData | null>(null)

  useEffect(() => {
    // Check if we have a cached quote for today
    const cached = localStorage.getItem('horizon_daily_quote')
    if (cached) {
      const { quote: cachedQuote, date } = JSON.parse(cached)
      const today = new Date().toDateString()
      if (date === today) {
        setQuote(cachedQuote)
        return
      }
    }

    // Fetch new quote
    fetchQuote().then((newQuote) => {
      setQuote(newQuote)
      // Cache for today
      localStorage.setItem(
        'horizon_daily_quote',
        JSON.stringify({ quote: newQuote, date: new Date().toDateString() })
      )
    })
  }, [])

  if (!quote) return null

  return (
    <div
      className="max-w-xl text-center mt-8 px-4"
      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
    >
      <p className="text-lg md:text-xl font-serif-elegant italic text-white/70 leading-relaxed">
        "{quote.content}"
      </p>
      <p className="mt-3 text-sm font-serif-elegant text-white/50">
        — {quote.author}
      </p>
    </div>
  )
}
