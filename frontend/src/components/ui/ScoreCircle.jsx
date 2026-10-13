export default function ScoreCircle({ score, size = 'md' }) {
  const sizes = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-lg',
    lg: 'w-20 h-20 text-2xl',
  }

  const getColor = (s) => {
    if (s >= 80) return 'text-red-600 bg-red-50 border-red-200'
    if (s >= 60) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  return (
    <div className={`${sizes[size]} rounded-full border-2 flex items-center justify-center font-bold ${getColor(score)}`}>
      {score}
    </div>
  )
}
