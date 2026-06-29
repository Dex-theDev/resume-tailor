# Plan: Company Name in Export Filename

## Context
Exported resumes currently download as `dex-joseph-resume.docx` regardless of the target role. Adding the company name produces filenames like `dex-resume-stripe.docx`, making it easy to manage multiple tailored versions. Claude already reads the full JD, so extracting the company name is one extra field at no added cost — but the JD won't always name the company clearly, so the UI must handle the fallback gracefully.

---

## Approach

Claude extracts `companyName` from the JD. The results view shows an editable company name field in the sticky footer, pre-populated with whatever Claude returned. If Claude returned nothing useful the field is empty. The user can type a name, edit Claude's guess, or leave it blank. A blank field produces `dex-resume.docx`; any value produces `dex-resume-<slug>.docx`.

---

## Changes

### 1. `src/types/index.ts`
Add `companyName: string` to `TailorResponse`.

### 2. `api/tailor.ts`
Add step 8 to the prompt instructions and to the required JSON schema:
```
8. Extract the hiring company name from the job description. If the company is not clearly stated, return an empty string.
```
```json
"companyName": "Stripe"
```

### 3. `api/buildTailorResult.ts`
Pass `companyName: parsed.companyName ?? ''` in the returned object alongside the existing fields.

### 4. `src/lib/tailor.ts` (mock)
Add `companyName: 'Acme Corp'` to the `mockResponse` so dev mode type-checks and the input is pre-populated during local testing.

### 5. `src/components/ResultsView.tsx`
- Add `const [companyName, setCompanyName] = useState(result.companyName)` — initialised from Claude's extraction, editable by the user.
- In the sticky export footer, add a small labeled text input above the button:
  ```
  [ Company (optional) _________________ ]
  [ Export DOCX ↓                        ]
  ```
  Placeholder: `"e.g. Stripe"`. An ✕ button clears the field. No required validation — blank is fine.
- Build the filename on export:
  ```ts
  const slug = companyName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const filename = slug ? `dex-resume-${slug}.docx` : 'dex-resume.docx'
  ```

### 6. Tests — extend `api/__tests__/buildTailorResult.test.ts`
Add two cases to the existing suite:
```
✓ passes companyName through from parsed response
✓ defaults companyName to empty string when absent from parsed response
```

---

## Verification
1. `npm run build` — clean compile
2. `npm test` — all tests pass including the two new ones
3. `npm run dev` → export with mock data → filename is `dex-resume-acme-corp.docx`
4. Clear the company field → export → filename is `dex-resume.docx`
5. In production: paste a JD that clearly names a company (e.g. Stripe) → confirm field is pre-populated → export → correct filename
6. Paste a JD with no company name → confirm field is empty → user can type one or skip
