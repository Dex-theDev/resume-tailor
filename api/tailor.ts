import type { VercelRequest, VercelResponse } from '@vercel/node'

// Stub — replace with real Claude API call in Phase 2
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { pool } = req.body

  // Mock: return first 6 bullets, first 8 skills, first summary
  // Real implementation will score against the JD via Claude API
  const selectedBullets = pool.bullets.slice(0, 6)
  const selectedSkills = pool.skills.slice(0, 8)
  const summary = pool.summary_variants[0]

  return res.status(200).json({
    selectedBullets,
    selectedSkills,
    summary,
    matchScore: { before: 38, after: 81 },
    extractedKeywords: ['go', 'kubernetes', 'distributed systems', 'ci/cd', 'microservices'],
    injectedKeywords: ['microservices'],
  })
}
