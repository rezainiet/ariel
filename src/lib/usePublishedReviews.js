import { useEffect, useState } from 'react'
import { REVIEWS_ENDPOINT } from '../data/reviews.js'

export function usePublishedReviews() {
  const [state, setState] = useState({ status: 'loading', reviews: [] })

  useEffect(() => {
    let alive = true
    const endpoints = [...new Set(['/api/reviews', REVIEWS_ENDPOINT])]
    Promise.all(endpoints.map((endpoint) => fetch(endpoint, { headers: { Accept: 'application/json' } })
      .then((response) => response.ok ? response.json() : [])
      .catch(() => [])))
      .then((lists) => {
        const reviews = lists.flatMap((list) => Array.isArray(list) ? list : [])
          .filter((review) => review && review.rating >= 1 && review.rating <= 5 && review.body && review.author && /^\d{4}-\d{2}-\d{2}$/.test(review.date || ''))
        const unique = [...new Map(reviews.map((review) => [review.id || `${review.author}-${review.date}-${review.body}`, review])).values()]
        if (alive) setState({ status: unique.length ? 'live' : 'none', reviews: unique })
      })

    return () => { alive = false }
  }, [])

  return state
}
