interface Props {
  before: number
  after: number
}

export default function ScoreBar({ before, after }: Props) {
  return (
    <div className="rounded-2xl border border-indigo-100 p-5 shadow-sm" style={{ background: 'linear-gradient(135deg, #eef2ff, #faf5ff)' }}>
      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-4">Keyword Match Score</p>
      <div className="flex items-center gap-5">

        <div className="flex-1">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-xs text-gray-400">Before</span>
            <span className="text-lg font-black text-red-400">{before}%</span>
          </div>
          <div className="w-full h-2.5 bg-white rounded-full shadow-inner">
            <div className="h-2.5 rounded-full" style={{ width: `${before}%`, background: '#fca5a5' }} />
          </div>
        </div>

        <span className="text-indigo-300 text-xl font-light">→</span>

        <div className="flex-1">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-xs text-gray-400">After</span>
            <span className="text-lg font-black text-indigo-600">{after}%</span>
          </div>
          <div className="w-full h-2.5 bg-white rounded-full shadow-inner">
            <div className="h-2.5 rounded-full" style={{ width: `${after}%`, background: 'linear-gradient(to right, #4f46e5, #9333ea)' }} />
          </div>
        </div>

      </div>
    </div>
  )
}
