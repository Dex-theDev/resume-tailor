# Plan: DOCX Export + ATS Compliance

## Context
The current PDF export (`@react-pdf/renderer`) produces a broken text layer — ATS parsers extract the entire resume as one long sentence because react-pdf positions text objects absolutely in the PDF content stream with no newlines between them. Even after refactoring bullets to single `<Text>` elements, the extracted text is still unstructured. DOCX is the correct format: it is semantically structured XML that ATS vendors test against natively. This plan replaces the PDF export with a DOCX export that replicates the visual structure of the user's original reference resume, and adds a test layer for the two pieces of logic most likely to cause silent ATS failures (post-processing and document generation).

---

## 1. Dependencies

```bash
npm install docx
npm install --save-dev vitest @vitest/coverage-v8 jsdom
npm uninstall @react-pdf/renderer
```

---

## 2. New file: `src/lib/generateDocx.ts`

Pure function signature:
```ts
export async function generateDocx(result: TailorResponse, pool: ResumePool): Promise<Blob>
```

Uses the `docx` npm package to build a `Document` and call `Packer.toBlob()`.

**Document structure** (matching block 3 of `resume-examples.rtf`):

| Section | DOCX approach |
|---|---|
| Name | 24pt bold, centered `Paragraph` with `TextRun` |
| Contact | 10pt centered, `email \| linkedin \| github` joined — single `Paragraph` |
| Section labels | 11pt bold allCaps, bottom border (`BorderStyle.SINGLE`), `spacing.after: 80` |
| Summary | 10.5pt paragraph |
| Skills | One `Paragraph` per category: `TextRun({bold}) + TextRun(values)` — NO table |
| Company header | Tab stop right-aligned at 6.5in: `COMPANY  •  Title \t dates` |
| Job title | 10pt italic `Paragraph` (omit if same as previous entry for same company) |
| Bullets | One `Paragraph` per bullet: `>  ` + `TextRun({bold: label + ': '})` + `TextRun(text)`, `indent.left: 200` |
| Education | Two paragraphs: institution+date (tab-right), then degree italic |

**ATS rules enforced in the generated document:**
- No tables, no text boxes, no images
- Single column
- Each bullet is its own `Paragraph` (not a run inside a shared paragraph)
- Standard font: Calibri 10.5pt body, no decorative fonts
- No headers/footers
- No color on text (black only — the `>` prefix is plain, not gold)

**Also export for testing:**
```ts
export function groupBulletsByCompany(bullets: Bullet[]): Record<string, Bullet[]>
export function groupSkillsByCategory(skills: Skill[]): Record<string, string[]>
export function buildContactLine(contact: ResumePool['contact']): string
```

These are the pure data helpers `generateDocx` uses internally; exporting them makes them unit-testable without needing to parse DOCX output.

---

## 3. Extract testable function from `api/tailor.ts`

The current handler embeds its post-processing logic inline. Extract it:

```ts
// api/tailor.ts
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
  }
): TailorResponse { ... }
```

The handler becomes: `return res.status(200).json(buildTailorResult(pool, parsed))`.

This function contains the two invariants most critical for ATS correctness:
- Modified bullet text overrides original text
- Any skill named in a selected bullet's text is included in `selectedSkills` even if the model omitted it

---

## 4. Modify `src/components/ResultsView.tsx`

- Remove `import { pdf } from '@react-pdf/renderer'` and `import ResumePDF`
- Import `generateDocx` from `'../lib/generateDocx'`
- `handleExport`: call `generateDocx(result, pool)` → Blob → download as `name-resume.docx`
- Button label: `Export DOCX ↓`

---

## 5. Delete `src/components/ResumePDF.tsx`

No longer needed once `@react-pdf/renderer` is removed.

---

## 6. Test infrastructure

**`vitest.config.ts`** (project root):
```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

**`package.json` scripts** additions:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

---

## 7. Tests

### `src/lib/__tests__/generateDocx.test.ts`

```
describe('generateDocx')
  ✓ returns a Blob
  ✓ Blob is non-empty

describe('groupBulletsByCompany')
  ✓ groups bullets by company field
  ✓ preserves insertion order of companies

describe('groupSkillsByCategory')
  ✓ groups skills by category field
  ✓ handles multiple categories

describe('buildContactLine')
  ✓ joins non-empty contact fields with |
  ✓ omits empty github/linkedin
```

### `api/__tests__/buildTailorResult.test.ts`

```
describe('buildTailorResult')
  ✓ applies modifiedBullets text over original bullet text
  ✓ preserves original bullet text when not in modifiedBullets
  ✓ drops bullet IDs that do not exist in pool
  ✓ adds pool skills whose names appear in selected bullet text (consistency rule)
  ✓ does not add skills whose names are absent from bullet text and not in selectedSkillNames
  ✓ falls back to first summary_variant when selectedSummaryId not found in pool
  ✓ uses correct summary when ID matches
  ✓ passes through matchScore, extractedKeywords, injectedKeywords unchanged
```

These 8 tests cover the exact invariants that cause silent ATS failures when the model returns inconsistent output.

---

## Verification

1. `npm run build` — TypeScript must compile clean
2. `npm test` — all tests pass
3. `npm run dev` → submit any JD in the UI → click "Export DOCX ↓"
4. Open the downloaded `.docx` in Word or Google Docs — verify visual layout matches reference (name, section headers with borders, bold skill categories, `> Bold Label: text` bullets)
5. Copy all text from the DOCX and paste into a plain text editor — verify bullets and sections appear on separate lines with no run-on text
