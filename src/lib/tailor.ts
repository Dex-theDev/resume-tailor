import type { ResumePool, TailorResponse } from '../types'

function mockResponse(pool: ResumePool): TailorResponse {
  return {
    selectedBullets: pool.bullets.slice(0, 6),
    selectedSkills: pool.skills.slice(0, 10),
    summary: pool.summary_variants[0],
    matchScore: { before: 38, after: 81 },
    extractedKeywords: ['go', 'kubernetes', 'distributed systems', 'ci/cd', 'microservices'],
    injectedKeywords: ['microservices'],
  }
}

export async function tailorResume(jd: string, pool: ResumePool): Promise<TailorResponse> {
  // In dev, skip the edge function and return mock data directly
  if (import.meta.env.DEV) {
    await new Promise((r) => setTimeout(r, 1200)) // simulate latency
    return mockResponse(pool)
  }

  const response = await fetch('/api/tailor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jd, pool }),
  })

  if (!response.ok) {
    throw new Error(`Tailor API failed: ${response.statusText}`)
  }

  return response.json()
}
