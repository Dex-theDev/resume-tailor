import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Tab,
  AlignmentType,
  TabStopType,
  BorderStyle,
} from 'docx'
import type { TailorResponse, ResumePool, Bullet, Skill } from '../types'

// US Letter: 8.5" × 11" in twips (1 twip = 1/20 pt, 1" = 1440 twips)
const PAGE_WIDTH = 12240
const PAGE_HEIGHT = 15840
const MARGIN = 1080 // 0.75"
const TEXT_WIDTH = PAGE_WIDTH - 2 * MARGIN // 10080 twips = 7"

const PAGE_PROPS = {
  page: {
    size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
    margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
  },
}

export function groupBulletsByCompany(bullets: Bullet[]): Record<string, Bullet[]> {
  const result: Record<string, Bullet[]> = {}
  for (const bullet of bullets) {
    if (!result[bullet.company]) result[bullet.company] = []
    result[bullet.company].push(bullet)
  }
  return result
}

export function groupSkillsByCategory(skills: Skill[]): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const skill of skills) {
    if (!result[skill.category]) result[skill.category] = []
    result[skill.category].push(skill.name)
  }
  return result
}

export function buildContactLine(contact: ResumePool['contact']): string {
  return [contact.email, contact.linkedin, contact.github].filter(Boolean).join(' | ')
}

function sectionLabel(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, allCaps: true, size: 22, font: 'Calibri' })],
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' },
    },
    spacing: { before: 480, after: 160 },
  })
}

// A tab stop at the right edge of the text area, used for flushing dates to the right margin.
const RIGHT_TAB = [{ type: TabStopType.RIGHT, position: TEXT_WIDTH }]

export async function generateDocx(result: TailorResponse, pool: ResumePool): Promise<Blob> {
  const { contact, education } = pool
  const byCompany = groupBulletsByCompany(result.selectedBullets)
  const byCategory = groupSkillsByCategory(result.selectedSkills)
  const contactLine = buildContactLine(contact)

  const companies = Object.entries(byCompany)

  const children: Paragraph[] = [
    // ── Header ──────────────────────────────────────────────────────────────
    new Paragraph({
      children: [new TextRun({ text: contact.name, bold: true, size: 56, font: 'Calibri' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: contactLine, size: 20, font: 'Calibri' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
    }),

    // ── Summary ──────────────────────────────────────────────────────────────
    sectionLabel('Summary'),
    new Paragraph({
      children: [new TextRun({ text: result.summary.text, size: 21, font: 'Calibri' })],
      spacing: { after: 80 },
    }),

    // ── Skills ───────────────────────────────────────────────────────────────
    sectionLabel('Skills'),
    ...Object.entries(byCategory).map(
      ([category, skills]) =>
        new Paragraph({
          children: [
            new TextRun({ text: `${category}: `, bold: true, size: 21, font: 'Calibri' }),
            new TextRun({ text: skills.join(', '), size: 21, font: 'Calibri' }),
          ],
          spacing: { after: 80 },
        })
    ),

    // ── Experience ───────────────────────────────────────────────────────────
    sectionLabel('Experience'),
    ...companies.flatMap(([company, bullets], idx) => [
      new Paragraph({
        tabStops: RIGHT_TAB,
        children: [
          new TextRun({ text: `${company}  •  ${bullets[0].title}`, bold: true, size: 22, font: 'Calibri' }),
          new TextRun({ children: [new Tab()] }),
          new TextRun({ text: bullets[0].dates, size: 20, font: 'Calibri' }),
        ],
        spacing: { before: idx > 0 ? 200 : 0, after: 100 },
      }),
      ...bullets.map(
        (b) =>
          new Paragraph({
            children: [
              new TextRun({ text: '>  ', size: 21, font: 'Calibri' }),
              new TextRun({ text: `${b.label}: `, bold: true, size: 21, font: 'Calibri' }),
              new TextRun({ text: b.text, size: 21, font: 'Calibri' }),
            ],
            spacing: { after: 80 },
          })
      ),
    ]),

    // ── Education ────────────────────────────────────────────────────────────
    ...(education.length > 0
      ? [
          sectionLabel('Education'),
          ...education.flatMap((ed) => [
            new Paragraph({
              tabStops: RIGHT_TAB,
              children: [
                new TextRun({ text: ed.institution, bold: true, size: 21, font: 'Calibri' }),
                new TextRun({ children: [new Tab()] }),
                new TextRun({ text: ed.date, size: 20, font: 'Calibri' }),
              ],
              spacing: { after: 60 },
            }),
            new Paragraph({
              children: [new TextRun({ text: ed.degree, italics: true, size: 21, font: 'Calibri' })],
              spacing: { after: 80 },
            }),
          ]),
        ]
      : []),
  ]

  const doc = new Document({ sections: [{ properties: PAGE_PROPS, children }] })
  return Packer.toBlob(doc)
}
