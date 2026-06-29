import type { ResumePool, TailorResponse } from '../src/types'

export function buildTailorResult(
  pool: ResumePool,
  parsed: {
    selectedBulletIds: string[]
    selectedSummaryId: string
    selectedSkillNames: string[]
    modifiedBullets?: Record<string, string>
    matchScoreBefore: number
    matchScoreAfter: number
    extractedKeywords: string[]
    injectedKeywords: string[]
    companyName?: string
  }
): TailorResponse {
  const selectedBullets = parsed.selectedBulletIds
    .map((id) => {
      const bullet = pool.bullets.find((b) => b.id === id)
      if (!bullet) return null
      if (parsed.modifiedBullets?.[id]) {
        return { ...bullet, text: parsed.modifiedBullets[id] }
      }
      return bullet
    })
    .filter((b): b is NonNullable<typeof b> => b !== null)

  const bulletText = selectedBullets.map((b) => b.text.toLowerCase()).join(' ')
  const selectedSkills = pool.skills.filter(
    (s) =>
      parsed.selectedSkillNames.includes(s.name) ||
      bulletText.includes(s.name.toLowerCase())
  )

  const summary =
    pool.summary_variants.find((sv) => sv.id === parsed.selectedSummaryId) ??
    pool.summary_variants[0]

  return {
    selectedBullets,
    selectedSkills,
    summary,
    matchScore: {
      before: parsed.matchScoreBefore,
      after: parsed.matchScoreAfter,
    },
    extractedKeywords: parsed.extractedKeywords,
    injectedKeywords: parsed.injectedKeywords,
    companyName: parsed.companyName ?? '',
  }
}
