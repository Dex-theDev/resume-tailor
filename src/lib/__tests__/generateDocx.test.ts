import { describe, it, expect } from 'vitest'
import { generateDocx, groupBulletsByCompany, groupSkillsByCategory, buildContactLine } from '../generateDocx'
import type { TailorResponse, ResumePool, Bullet, Skill } from '../../types'

const mockContact: ResumePool['contact'] = {
  name: 'Test User',
  email: 'test@example.com',
  github: 'github.com/test',
  linkedin: 'linkedin.com/in/test',
  location: 'New York, NY',
}

const mockBullet1: Bullet = {
  id: 'bullet-1',
  company: 'Acme Corp',
  title: 'Engineer',
  dates: '2023 – Present',
  label: 'Feature Work',
  text: 'Built something cool with Go.',
  tags: ['go'],
  quantified: false,
  priority: 8,
}

const mockBullet2: Bullet = {
  id: 'bullet-2',
  company: 'Acme Corp',
  title: 'Engineer',
  dates: '2023 – Present',
  label: 'Infrastructure',
  text: 'Deployed services on Kubernetes.',
  tags: ['kubernetes'],
  quantified: false,
  priority: 7,
}

const mockBullet3: Bullet = {
  id: 'bullet-3',
  company: 'Other Co',
  title: 'Junior Engineer',
  dates: '2021 – 2023',
  label: 'API Work',
  text: 'Built REST APIs in Python.',
  tags: ['python'],
  quantified: false,
  priority: 6,
}

const mockSkill1: Skill = { name: 'Go', category: 'Languages', tags: ['go'] }
const mockSkill2: Skill = { name: 'Python', category: 'Languages', tags: ['python'] }
const mockSkill3: Skill = { name: 'Kubernetes', category: 'Infrastructure', tags: ['kubernetes'] }

const mockPool: ResumePool = {
  contact: mockContact,
  summary_variants: [{ id: 'sv-1', tags: ['backend'], text: 'Backend engineer with Go experience.' }],
  skills: [mockSkill1, mockSkill2, mockSkill3],
  bullets: [mockBullet1, mockBullet2, mockBullet3],
  education: [{ institution: 'Test University', degree: 'BS Computer Science', date: 'May 2021' }],
}

const mockResult: TailorResponse = {
  selectedBullets: [mockBullet1, mockBullet2, mockBullet3],
  selectedSkills: [mockSkill1, mockSkill2, mockSkill3],
  summary: { id: 'sv-1', tags: ['backend'], text: 'Backend engineer with Go experience.' },
  matchScore: { before: 50, after: 80 },
  extractedKeywords: ['Go', 'Kubernetes'],
  injectedKeywords: [],
  companyName: '',
}

describe('generateDocx', () => {
  it('returns a Blob', async () => {
    const blob = await generateDocx(mockResult, mockPool)
    expect(blob).toBeInstanceOf(Blob)
  })

  it('Blob is non-empty', async () => {
    const blob = await generateDocx(mockResult, mockPool)
    expect(blob.size).toBeGreaterThan(0)
  })
})

describe('groupBulletsByCompany', () => {
  it('groups bullets by company field', () => {
    const grouped = groupBulletsByCompany([mockBullet1, mockBullet2, mockBullet3])
    expect(grouped['Acme Corp']).toHaveLength(2)
    expect(grouped['Other Co']).toHaveLength(1)
  })

  it('preserves insertion order of companies', () => {
    const grouped = groupBulletsByCompany([mockBullet1, mockBullet2, mockBullet3])
    expect(Object.keys(grouped)).toEqual(['Acme Corp', 'Other Co'])
  })
})

describe('groupSkillsByCategory', () => {
  it('groups skills by category field', () => {
    const grouped = groupSkillsByCategory([mockSkill1, mockSkill2, mockSkill3])
    expect(grouped['Languages']).toContain('Go')
    expect(grouped['Languages']).toContain('Python')
    expect(grouped['Infrastructure']).toContain('Kubernetes')
  })

  it('handles multiple categories', () => {
    const grouped = groupSkillsByCategory([mockSkill1, mockSkill2, mockSkill3])
    expect(Object.keys(grouped)).toHaveLength(2)
  })
})

describe('buildContactLine', () => {
  it('joins non-empty contact fields with |', () => {
    const line = buildContactLine(mockContact)
    expect(line).toBe('test@example.com | linkedin.com/in/test | github.com/test')
  })

  it('omits empty github/linkedin', () => {
    const contact = { ...mockContact, github: '', linkedin: '' }
    const line = buildContactLine(contact)
    expect(line).toBe('test@example.com')
  })
})
