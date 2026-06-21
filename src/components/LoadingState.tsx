export default function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-4 gap-5">
      <div
        className="w-10 h-10 rounded-full animate-spin"
        style={{ background: 'conic-gradient(from 0deg, #4f46e5, #9333ea, transparent)' }}
      />
      <div className="text-center">
        <p className="text-sm font-medium text-indigo-700">Analyzing job description</p>
        <p className="text-xs text-gray-400 mt-1">Extracting keywords and matching your experience...</p>
      </div>
    </div>
  )
}
