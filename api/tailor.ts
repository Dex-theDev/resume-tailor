import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-haiku-4-5-20251001'

const PROMPT = (jd: string, pool: any) => `
You are a resume optimization expert. Given a job description and a candidate's content pool, select and optimize resume content for maximum ATS keyword matching.

JOB DESCRIPTION:
${jd}

CONTENT POOL:

Summary variants:
${JSON.stringify(pool.summary_variants, null, 2)}

Skills:
${JSON.stringify(pool.skills, null, 2)}

Bullets:
${JSON.stringify(pool.bullets.map((b: any) => ({ id: b.id, label: b.label, text: b.text, tags: b.tags, quantified: b.quantified, priority: b.priority })), null, 2)}

YOUR TASKS:
1. Extract the most important required and preferred keywords/skills from the JD
2. Select 6-8 bullets that best match the JD — prioritize quantified bullets and tag overlap
3. Select the most relevant summary variant
4. Select only the skills relevant to this role
5. Find required JD keywords missing from selected bullets
6. For up to 3 missing keywords genuinely covered by the candidate's work, modify the most relevant bullet to naturally include the term
7. Estimate keyword match score before and after (0-100)

RULES:
- Only inject keywords the candidate's work legitimately covered — do not fabricate
- Keep injected text natural, not forced
- Return only valid JSON, no other text

Return this exact JSON structure:
{
  "extractedKeywords": ["keyword1", "keyword2"],
  "selectedBulletIds": ["id1", "id2"],
  "selectedSummaryId": "summary-id",
  "selectedSkillNames": ["Skill Name"],
  "injectedKeywords": ["keyword1"],
  "modifiedBullets": { "bullet-id": "full modified bullet text here" },
  "matchScoreBefore": 40,
  "matchScoreAfter": 78
}
`

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { jd, pool } = req.body

  if (!jd || !pool) {
    return res.status(400).json({ error: 'Missing jd or pool' })
  }

  // Call Claude
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: PROMPT(jd, pool) }],
  })

  // Parse response
  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const parsed = JSON.parse(raw.trim())

  // Reconstruct full objects from IDs, applying any bullet modifications
  const selectedBullets = parsed.selectedBulletIds
    .map((id: string) => {
      const bullet = pool.bullets.find((b: any) => b.id === id)
      if (!bullet) return null
      if (parsed.modifiedBullets?.[id]) {
        return { ...bullet, text: parsed.modifiedBullets[id] }
      }
      return bullet
    })
    .filter(Boolean)

  const selectedSkills = pool.skills.filter((s: any) =>
    parsed.selectedSkillNames.includes(s.name)
  )

  const summary = pool.summary_variants.find(
    (sv: any) => sv.id === parsed.selectedSummaryId
  ) ?? pool.summary_variants[0]

  return res.status(200).json({
    selectedBullets,
    selectedSkills,
    summary,
    matchScore: {
      before: parsed.matchScoreBefore,
      after: parsed.matchScoreAfter,
    },
    extractedKeywords: parsed.extractedKeywords,
    injectedKeywords: parsed.injectedKeywords,
  })
}
