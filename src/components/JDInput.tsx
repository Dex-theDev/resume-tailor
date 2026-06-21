interface Props {
  onSubmit: (jd: string) => void
}

export default function JDInput({ onSubmit }: Props) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const jd = (e.currentTarget.elements.namedItem('jd') as HTMLTextAreaElement).value.trim()
    if (jd) onSubmit(jd)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <h1
            className="text-4xl font-black mb-2 tracking-tight"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 50%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Resume Tailor
          </h1>
          <p className="text-gray-400 text-sm">Drop a JD. Get a resume that actually matches it.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            name="jd"
            rows={14}
            placeholder="Paste the full job description here..."
            className="w-full rounded-2xl border border-indigo-100 bg-white p-4 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            required
          />
          <button
            type="submit"
            className="w-full text-white text-sm font-semibold py-4 rounded-2xl active:scale-95 transition-all shadow-lg shadow-indigo-200"
            style={{ background: 'linear-gradient(to right, #4f46e5, #9333ea)' }}
          >
            Tailor My Resume →
          </button>
        </form>
      </div>
    </div>
  )
}
