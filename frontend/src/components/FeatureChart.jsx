export default function FeatureChart({ features }) {
  if (!features?.length) return null

  const max = Math.max(...features.map((f) => Math.abs(f.impact)))

  return (
    <div className="space-y-3">
      {features.map((f) => {
        const pct = max > 0 ? (Math.abs(f.impact) / max) * 100 : 0
        const positive = f.direction === 'positive'
        return (
          <div key={f.feature}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700 font-medium">{f.feature}</span>
              <span className={positive ? 'text-green-600' : 'text-red-500'}>
                {positive ? '+' : '−'}{Math.abs(f.impact).toFixed(3)}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  positive ? 'bg-green-500' : 'bg-red-400'
                }`}
                style={{ width: `${pct.toFixed(1)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Value: {f.value}</p>
          </div>
        )
      })}
    </div>
  )
}
