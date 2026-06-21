import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import type { TailorResponse, ResumePool } from '../types'
import ScoreBar from './ScoreBar'
import ResumePDF from './ResumePDF'

interface Props {
  result: TailorResponse
  pool: ResumePool
  onReset: () => void
}

export default function ResultsView({ result, pool, onReset }: Props) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await pdf(<ResumePDF result={result} pool={pool} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${pool.contact.name.toLowerCase().replace(' ', '-')}-resume.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const byCompany = result.selectedBullets.reduce<Record<string, typeof result.selectedBullets>>(
    (acc, bullet) => {
      if (!acc[bullet.company]) acc[bullet.company] = []
      acc[bullet.company].push(bullet)
      return acc
    },
    {}
  )

  const byCategory = result.selectedSkills.reduce<Record<string, string[]>>((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = []
    acc[skill.category].push(skill.name)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 pb-28">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <h1
            className="text-xl font-black"
            style={{ background: 'linear-gradient(to right, #4f46e5, #9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Tailored Resume
          </h1>
          <button
            onClick={onReset}
            className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors font-medium"
          >
            ← New JD
          </button>
        </div>

        <ScoreBar before={result.matchScore.before} after={result.matchScore.after} />

        {/* Injected keywords */}
        {result.injectedKeywords.length > 0 && (
          <div className="rounded-2xl border border-purple-100 p-4" style={{ background: 'linear-gradient(135deg, #f5f3ff, #fdf4ff)' }}>
            <p className="text-xs font-semibold text-purple-500 uppercase tracking-widest mb-2">✦ Keywords injected</p>
            <div className="flex flex-wrap gap-1.5">
              {result.injectedKeywords.map((kw) => (
                <span key={kw} className="text-xs font-medium px-2.5 py-1 rounded-full text-purple-700" style={{ background: 'linear-gradient(135deg, #ede9fe, #fae8ff)' }}>
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-sm">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2">Summary</p>
          <p className="text-sm text-gray-700 leading-relaxed">{result.summary.text}</p>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-sm">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Skills</p>
          <div className="flex flex-col gap-1.5">
            {Object.entries(byCategory).map(([category, skills]) => (
              <div key={category} className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">{category}: </span>
                {skills.join(', ')}
              </div>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-sm">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-4">Experience</p>
          <div className="flex flex-col gap-6">
            {Object.entries(byCompany).map(([company, bullets]) => (
              <div key={company}>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="font-bold text-sm text-gray-900">{company}</span>
                  <span className="text-xs text-gray-400">{bullets[0].dates}</span>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {bullets.map((b) => (
                    <li key={b.id} className="text-sm text-gray-700 leading-relaxed pl-3 border-l-2 border-indigo-200">
                      <span className="font-semibold text-gray-900">{b.label}: </span>
                      {b.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-sm">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2">Education</p>
          {pool.education.map((ed) => (
            <div key={ed.institution} className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-gray-900">{ed.institution}</span>
              <span className="text-xs text-gray-400">{ed.date}</span>
            </div>
          ))}
        </div>

      </div>

      {/* Sticky export */}
      <div className="fixed bottom-0 left-0 right-0 p-4 backdrop-blur-sm border-t border-indigo-100" style={{ background: 'rgba(238, 242, 255, 0.85)' }}>
        <div className="max-w-2xl mx-auto">
          <button
            className="w-full text-white text-sm font-semibold py-4 rounded-2xl active:scale-95 transition-all shadow-lg shadow-purple-200 disabled:opacity-60"
            style={{ background: 'linear-gradient(to right, #4f46e5, #9333ea)' }}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Generating PDF...' : 'Export PDF ↓'}
          </button>
        </div>
      </div>
    </div>
  )
}
