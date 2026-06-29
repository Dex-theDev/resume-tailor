import { describe, it, expect } from 'vitest'
import { buildTailorResult } from '../buildTailorResult'
import type { ResumePool } from '../../src/types'

const pool: ResumePool = {
  contact: {
    name: 'Test User',
    email: 'test@example.com',
    github: '',
    linkedin: '',
    location: 'New York, NY',
  },
  summary_variants: [
    { id: 'sv-1', tags: ['backend'], text: 'Backend engineer.' },
    { id: 'sv-2', tags: ['frontend'], text: 'Frontend engineer.' },
  ],
  skills: [
    { name: 'Go', category: 'Languages', tags: ['go'] },
    { name: 'Python', category: 'Languages', tags: ['python'] },
    { name: 'Kubernetes', category: 'Infrastructure', tags: ['kubernetes'] },
  ],
  bullets: [
    {
      id: 'b-1',
      company: 'Acme',
      title: 'Engineer',
      dates: '2023 – Present',
      label: 'Backend Work',
      text: 'Built APIs in Go and Python.',
      tags: ['go', 'python'],
      quantified: false,
      priority: 8,
    },
    {
      id: 'b-2',
      company: 'Acme',
      title: 'Engineer',
      dates: '2023 – Present',
      label: 'Infrastructure',
      text: 'Deployed services on Kubernetes.',
      tags: ['kubernetes'],
      quantified: false,
      priority: 7,
    },
    {
      id: 'b-3',
      company: 'Other',
      title: 'Junior',
      dates: '2021 – 2023',
      label: 'Other Work',
      text: 'Did other things.',
      tags: [],
      quantified: false,
      priority: 5,
    },
  ],
  education: [{ institution: 'Test University', degree: 'BS CS', date: 'May 2021' }],
}

describe('buildTailorResult', () => {
  it('applies modifiedBullets text over original bullet text', () => {
    const result = buildTailorResult(pool, {
      selectedBulletIds: ['b-1'],
      selectedSummaryId: 'sv-1',
      selectedSkillNames: ['Go'],
      modifiedBullets: { 'b-1': 'Built APIs in Go, Python, and TypeScript.' },
      matchScoreBefore: 40,
      matchScoreAfter: 80,
      extractedKeywords: ['Go'],
      injectedKeywords: ['TypeScript'],
    })
    expect(result.selectedBullets[0].text).toBe('Built APIs in Go, Python, and TypeScript.')
  })

  it('preserves original bullet text when not in modifiedBullets', () => {
    const result = buildTailorResult(pool, {
      selectedBulletIds: ['b-1'],
      selectedSummaryId: 'sv-1',
      selectedSkillNames: ['Go'],
      matchScoreBefore: 40,
      matchScoreAfter: 75,
      extractedKeywords: ['Go'],
      injectedKeywords: [],
    })
    expect(result.selectedBullets[0].text).toBe('Built APIs in Go and Python.')
  })

  it('drops bullet IDs that do not exist in pool', () => {
    const result = buildTailorResult(pool, {
      selectedBulletIds: ['b-1', 'nonexistent-id'],
      selectedSummaryId: 'sv-1',
      selectedSkillNames: ['Go'],
      matchScoreBefore: 40,
      matchScoreAfter: 75,
      extractedKeywords: ['Go'],
      injectedKeywords: [],
    })
    expect(result.selectedBullets).toHaveLength(1)
    expect(result.selectedBullets[0].id).toBe('b-1')
  })

  it('adds pool skills whose names appear in selected bullet text (consistency rule)', () => {
    const result = buildTailorResult(pool, {
      selectedBulletIds: ['b-2'],
      selectedSummaryId: 'sv-1',
      selectedSkillNames: [],
      matchScoreBefore: 30,
      matchScoreAfter: 60,
      extractedKeywords: ['Kubernetes'],
      injectedKeywords: [],
    })
    expect(result.selectedSkills.map((s) => s.name)).toContain('Kubernetes')
  })

  it('does not add skills whose names are absent from bullet text and not in selectedSkillNames', () => {
    const result = buildTailorResult(pool, {
      selectedBulletIds: ['b-3'],
      selectedSummaryId: 'sv-1',
      selectedSkillNames: [],
      matchScoreBefore: 10,
      matchScoreAfter: 20,
      extractedKeywords: [],
      injectedKeywords: [],
    })
    expect(result.selectedSkills).toHaveLength(0)
  })

  it('falls back to first summary_variant when selectedSummaryId not found in pool', () => {
    const result = buildTailorResult(pool, {
      selectedBulletIds: ['b-1'],
      selectedSummaryId: 'sv-does-not-exist',
      selectedSkillNames: ['Go'],
      matchScoreBefore: 40,
      matchScoreAfter: 75,
      extractedKeywords: ['Go'],
      injectedKeywords: [],
    })
    expect(result.summary.id).toBe('sv-1')
  })

  it('uses correct summary when ID matches', () => {
    const result = buildTailorResult(pool, {
      selectedBulletIds: ['b-1'],
      selectedSummaryId: 'sv-2',
      selectedSkillNames: ['Go'],
      matchScoreBefore: 40,
      matchScoreAfter: 75,
      extractedKeywords: ['Go'],
      injectedKeywords: [],
    })
    expect(result.summary.id).toBe('sv-2')
    expect(result.summary.text).toBe('Frontend engineer.')
  })

  it('passes through matchScore, extractedKeywords, injectedKeywords unchanged', () => {
    const result = buildTailorResult(pool, {
      selectedBulletIds: ['b-1'],
      selectedSummaryId: 'sv-1',
      selectedSkillNames: ['Go'],
      matchScoreBefore: 42,
      matchScoreAfter: 88,
      extractedKeywords: ['Go', 'Python'],
      injectedKeywords: ['TypeScript'],
    })
    expect(result.matchScore).toEqual({ before: 42, after: 88 })
    expect(result.extractedKeywords).toEqual(['Go', 'Python'])
    expect(result.injectedKeywords).toEqual(['TypeScript'])
  })

  it('passes companyName through from parsed response', () => {
    const result = buildTailorResult(pool, {
      selectedBulletIds: ['b-1'],
      selectedSummaryId: 'sv-1',
      selectedSkillNames: ['Go'],
      matchScoreBefore: 40,
      matchScoreAfter: 75,
      extractedKeywords: ['Go'],
      injectedKeywords: [],
      companyName: 'Stripe',
    })
    expect(result.companyName).toBe('Stripe')
  })

  it('defaults companyName to empty string when absent from parsed response', () => {
    const result = buildTailorResult(pool, {
      selectedBulletIds: ['b-1'],
      selectedSummaryId: 'sv-1',
      selectedSkillNames: ['Go'],
      matchScoreBefore: 40,
      matchScoreAfter: 75,
      extractedKeywords: ['Go'],
      injectedKeywords: [],
    })
    expect(result.companyName).toBe('')
  })
})
