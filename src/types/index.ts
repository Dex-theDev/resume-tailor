export interface Bullet {
  id: string
  company: string
  title: string
  dates: string
  label: string
  text: string
  tags: string[]
  quantified: boolean
  priority: number
}

export interface Skill {
  name: string
  category: string
  tags: string[]
}

export interface SummaryVariant {
  id: string
  tags: string[]
  text: string
}

export interface ResumePool {
  contact: {
    name: string
    email: string
    github: string
    linkedin: string
    location: string
  }
  summary_variants: SummaryVariant[]
  skills: Skill[]
  bullets: Bullet[]
  education: Array<{
    institution: string
    degree: string
    date: string
  }>
}

export interface TailorResponse {
  selectedBullets: Bullet[]
  selectedSkills: Skill[]
  summary: SummaryVariant
  matchScore: { before: number; after: number }
  extractedKeywords: string[]
  injectedKeywords: string[]
}

export type AppState = 'idle' | 'loading' | 'results'
