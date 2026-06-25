import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-haiku-4-5-20251001'

const PROMPT = (jd: string, pool: any) => `
You are a resume optimization expert. Given a job description and a candidate's content pool, select and optimize the resume content for maximum ATS keyword alignment.

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
1. Extract required and preferred keywords from the JD (technologies, skills, methodologies, domain terms)
2. Select 6-8 bullets that best match the JD — prefer quantified bullets and strong tag overlap; deprioritize pure DevOps/infra bullets if the role is backend service or product focused
3. Select the summary variant whose primary focus best matches the role's PRIMARY skill requirement (e.g. if the JD leads with Go and distributed systems, pick the Go/distributed summary — not an infra-ops one)
4. Select only skills that appear in the JD or are directly implied by it — actively exclude skills the JD does not mention
5. Identify required JD keywords genuinely missing from your selected bullets
6. For up to 3 of those keywords: inject the term into the most relevant bullet ONLY if the work substantively covered it — not tangentially. Do not inject keywords that are a stretch. If unsure, skip the injection.
7. Estimate keyword match score before and after tailoring (0-100)

STRICT RULES:
- NEVER remove or paraphrase specific numbers, percentages, or dollar amounts from bullet text — preserve all quantified metrics exactly as written
- NEVER inject a keyword that is only loosely related to what the bullet describes (e.g. do not add "A/B testing" to a CI/CD pipeline bullet)
- NEVER repeat the same injected phrase across multiple bullets
- Skills list must only contain skills the JD explicitly or strongly implicitly asks for — omit everything else even if the candidate has it
- Summary selection must match the dominant technical theme of the JD, not just the closest tag overlap
- Return only valid JSON, no markdown, no explanation

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
    max_tokens: 2048,
    messages: [{ role: 'user', content: PROMPT(jd, pool) }],
  })

  // Parse response — strip markdown code fences if present
  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const parsed = JSON.parse(cleaned)

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
