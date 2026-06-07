export default function ScoreRing({ score }) {
  const pct    = Math.round(score * 100)
  const radius = 45
  const circ   = 2 * Math.PI * radius  // ≈ 283
  const offset = circ - (pct / 100) * circ

  const color =
    pct >= 70 ? '#22c55e' :
    pct >= 45 ? '#f59e0b' :
                '#ef4444'

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {/* Track */}
        <circle cx="60" cy="60" r={radius} fill="none"
          stroke="#e5e7eb" strokeWidth="10" />
        {/* Fill */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{
            transition: 'stroke-dashoffset 1s ease-out',
          }}
        />
        <text x="60" y="60" textAnchor="middle" dominantBaseline="central"
          fontSize="22" fontWeight="700" fill={color}>{pct}</text>
        <text x="60" y="76" textAnchor="middle"
          fontSize="10" fill="#9ca3af">/ 100</text>
      </svg>
    </div>
  )
}
