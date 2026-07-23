import { useState } from 'react'
import { describeFeature } from '../utils/featureDescriptions'

const BAR_MAX = 0.15

export default function FeatureChart({ features }) {
  const [tooltip, setTooltip] = useState(null)
  if (!features?.length) return null

  return (
    <div className="space-y-4">
      {features.map((f, i) => {
        const { display, level, tip } = describeFeature(f.feature, f.value)
        const isPos  = f.direction === 'positive'
        const width  = Math.min(Math.abs(f.impact) / BAR_MAX * 100, 100)
        const impact = (f.impact >= 0 ? '+' : '') + f.impact.toFixed(3)

        return (
          <div key={i} className="cursor-pointer group"
            onClick={() => setTooltip(tooltip === i ? null : i)}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">{f.feature}</span>
                <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{display}</span>
              </div>
              <span className={`text-sm font-bold ${isPos ? 'text-green-600' : 'text-red-500'}`}>
                {impact}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
              <div className={`h-full rounded-full transition-all duration-700 ${isPos ? 'bg-green-500' : 'bg-red-400'}`}
                style={{ width: `${width}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${isPos ? 'text-green-600' : 'text-red-500'}`}>{level}</span>
              <span className="text-xs text-gray-300 group-hover:text-gray-400 transition-colors">tap to explain ↓</span>
            </div>
            {tooltip === i && tip && (
              <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <p className="text-xs text-blue-700 leading-relaxed">{tip}</p>
              </div>
            )}
          </div>
        )
      })}
      <p className="text-xs text-gray-300 pt-1">Tap any feature to see what the value means.</p>
    </div>
  )
}