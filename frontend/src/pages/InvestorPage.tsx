import { useState } from 'react'
import { predict } from '../utils/api'
import { BUSINESS_TYPES } from '../utils/featureDescriptions'
import { TrendingUp, MapPin, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
type NavigationTarget = 'home' | 'predict' | 'advisor' | 'investor' | 'register' | 'data'

type Sector = typeof SECTORS[number]

type SectorResult = Sector & {
  score: number
  confidence: string
  verdict: string
}
const SECTORS = [
  { name:'CityCenter', province:'Kigali',   lat:-1.9441, lng:30.0619, foot:9.5, income:1100000, comp:28 },
  { name:'Remera',     province:'Kigali',   lat:-1.9480, lng:30.1152, foot:8.1, income:850000,  comp:18 },
  { name:'Kimironko',  province:'Kigali',   lat:-1.9302, lng:30.1074, foot:7.2, income:650000,  comp:12 },
  { name:'Nyamirambo', province:'Kigali',   lat:-1.9820, lng:30.0450, foot:8.8, income:350000,  comp:22 },
  { name:'Kicukiro',   province:'Kigali',   lat:-2.0100, lng:30.0800, foot:6.5, income:580000,  comp:10 },
  { name:'Gisozi',     province:'Kigali',   lat:-1.9100, lng:30.0700, foot:5.5, income:500000,  comp:7  },
  { name:'Kanombe',    province:'Kigali',   lat:-1.9690, lng:30.1380, foot:6.8, income:700000,  comp:8  },
  { name:'Gikondo',    province:'Kigali',   lat:-2.0000, lng:30.0700, foot:5.8, income:420000,  comp:9  },
  { name:'Niboye',     province:'Kigali',   lat:-2.0250, lng:30.0600, foot:4.2, income:480000,  comp:5  },
  { name:'Kibagabaga', province:'Kigali',   lat:-1.9200, lng:30.0900, foot:4.8, income:520000,  comp:6  },
  { name:'Musanze',    province:'Northern', lat:-1.4990, lng:29.6340, foot:6.8, income:350000,  comp:8  },
  { name:'Byumba',     province:'Northern', lat:-1.5760, lng:30.0680, foot:4.0, income:280000,  comp:4  },
  { name:'Rulindo',    province:'Northern', lat:-1.7180, lng:29.9350, foot:3.0, income:250000,  comp:3  },
  { name:'Huye',       province:'Southern', lat:-2.5960, lng:29.7390, foot:5.5, income:320000,  comp:5  },
  { name:'Muhanga',    province:'Southern', lat:-2.0820, lng:29.7540, foot:4.5, income:290000,  comp:4  },
  { name:'Nyanza',     province:'Southern', lat:-2.3510, lng:29.7440, foot:3.5, income:260000,  comp:3  },
  { name:'Ruhango',    province:'Southern', lat:-2.2180, lng:29.7780, foot:3.0, income:240000,  comp:2  },
  { name:'Rwamagana',  province:'Eastern',  lat:-1.9488, lng:30.4350, foot:5.0, income:320000,  comp:5  },
  { name:'Nyagatare',  province:'Eastern',  lat:-1.2980, lng:30.3280, foot:3.0, income:270000,  comp:3  },
  { name:'Rubavu',     province:'Western',  lat:-1.6862, lng:29.2539, foot:6.8, income:400000,  comp:8  },
  { name:'Rusizi',     province:'Western',  lat:-2.4798, lng:28.9072, foot:4.5, income:310000,  comp:4  },
  { name:'Karongi',    province:'Western',  lat:-2.0660, lng:29.3790, foot:3.0, income:260000,  comp:3  },
  { name:'Nyamasheke', province:'Western',  lat:-2.3140, lng:29.1310, foot:2.5, income:230000,  comp:2  },
]

const PROVINCES = ['All', 'Kigali', 'Northern', 'Southern', 'Eastern', 'Western']

/** @typedef {typeof SECTORS[number] & { score: number, confidence: string, verdict: string }} SectorResult */

type InvestorPageProps = {
  onNavigate: (page: NavigationTarget) => void
}

function scoreColor(s: number): string {
  if (s >= 0.70) return 'text-green-600 bg-green-50'
  if (s >= 0.45) return 'text-amber-600 bg-amber-50'
  return 'text-red-500 bg-red-50'
}

function RiskBadge({ score }: { score: number }) {
  if (score >= 0.70) return (
    <span className="flex items-center gap-1 text-xs text-green-600">
      <CheckCircle size={11}/> Low risk
    </span>
  )
  if (score >= 0.45) return (
    <span className="flex items-center gap-1 text-xs text-amber-600">
      <AlertTriangle size={11}/> Medium risk
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs text-red-500">
      <AlertTriangle size={11}/> High risk
    </span>
  )
}

export default function InvestorPage({ onNavigate }: InvestorPageProps) {
  const [bizType,  setBizType]  = useState('restaurant')
  const [province, setProvince] = useState('All')
  const [results, setResults] = useState<SectorResult[]>([])
  const [loading,  setLoading]  = useState(false)
  const [ran,      setRan]      = useState(false)

  const sectorCount = province === 'All'
    ? SECTORS.length
    : SECTORS.filter((s) => s.province === province).length

  const run = async () => {
    setLoading(true)
    setRan(true)

    const filtered = province === 'All'
      ? SECTORS
      : SECTORS.filter((s) => s.province === province)

    const scores = await Promise.all(
      filtered.map((s) =>
        predict({
          business_type:      bizType,
          target_lat:         s.lat,
          target_lng:         s.lng,
          target_sector_name: s.name,
        })
        .then((r) => ({
          ...s,
          score:      r.score,
          confidence: r.confidence,
          verdict:    r.verdict,
        }))
        .catch(() => ({
          ...s,
          score:      0,
          confidence: 'low',
          verdict:    'Error',
        }))
      )
    )

    setResults(scores.sort((a, b) => b.score - a.score))
    setLoading(false)
  }

  const topPick  = results[0]
  const avgScore = results.length
    ? results.reduce((acc, r) => acc + r.score, 0) / results.length
    : 0
  const highOpps = results.filter((r) => r.score >= 0.70).length
  const selectedBizLabel = BUSINESS_TYPES.find((b) => b.value === bizType)?.label

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={20} className="text-brand-600"/>
          <h1 className="text-2xl font-bold text-gray-900">Investor Intelligence</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Find where your capital will work hardest. Score every sector in Rwanda for any business type.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

          {/* Business type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {BUSINESS_TYPES.map((b) => (
                <button key={b.value} type="button" onClick={() => setBizType(b.value)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors text-left ${
                    bizType === b.value
                      ? 'bg-brand-50 border-brand-400 text-brand-700 font-medium'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}>
                  <span>{b.icon}</span>
                  <span className="truncate">{b.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Province */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
            <div className="space-y-1.5">
              {PROVINCES.map((p) => (
                <button key={p} onClick={() => setProvince(p)}
                  className={`block w-full text-left px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    province === p
                      ? 'bg-brand-50 border-brand-400 text-brand-700 font-medium'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}>
                  {p === 'All' ? 'All Rwanda' : `${p} Province`}
                </button>
              ))}
            </div>
          </div>

          {/* Description + Run */}
          <div className="flex flex-col justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">What this shows</label>
              <p className="text-xs text-gray-400 leading-relaxed">
                Runs the Hunch ML model across all {sectorCount}{' '}
                {province !== 'All' ? `${province} ` : ''}
                sectors simultaneously and ranks them by suitability for a{' '}
                <strong>{selectedBizLabel}</strong>.
              </p>
            </div>
            <button onClick={run} disabled={loading}
              className="mt-4 w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {loading
                ? <><Loader2 size={15} className="animate-spin"/> Scanning all sectors…</>
                : `Scan ${sectorCount} sectors →`
              }
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {ran && !loading && results.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Top opportunity</p>
              <p className="text-lg font-bold text-gray-900">{topPick?.name}</p>
              <p className="text-xs text-gray-400">{topPick?.province} Province</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">High-confidence spots</p>
              <p className="text-3xl font-bold text-green-600">{highOpps}</p>
              <p className="text-xs text-gray-400">score ≥ 70%</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Average score</p>
              <p className="text-3xl font-bold text-brand-600">{Math.round(avgScore * 100)}%</p>
              <p className="text-xs text-gray-400">across {results.length} sectors</p>
            </div>
          </div>

          {/* Rankings table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                Rankings — {selectedBizLabel}
              </h3>
              <span className="text-xs text-gray-400">{results.length} sectors</span>
            </div>

            <div className="divide-y divide-gray-50">
              {results.map((r, i) => (
                <div key={r.name}
                  className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">

                  {/* Rank medal */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 ? 'bg-amber-400 text-white'
                    : i === 1 ? 'bg-gray-300 text-white'
                    : i === 2 ? 'bg-orange-300 text-white'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                    {i + 1}
                  </div>

                  {/* Sector info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                      <span className="text-xs text-gray-400">{r.province}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400">
                        Income: RWF {(r.income / 1000).toFixed(0)}K
                      </span>
                      <span className="text-xs text-gray-400">Traffic: {r.foot}/10</span>
                      <span className="text-xs text-gray-400">Competition: {r.comp}</span>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="w-28 hidden sm:block">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          r.score >= 0.70 ? 'bg-green-500'
                          : r.score >= 0.45 ? 'bg-amber-400'
                          : 'bg-red-400'
                        }`}
                        style={{ width: `${r.score * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Score badge */}
                  <div className={`text-sm font-bold px-2.5 py-1 rounded-lg shrink-0 ${scoreColor(r.score)}`}>
                    {Math.round(r.score * 100)}%
                  </div>

                  {/* Risk badge */}
                  <div className="w-24 shrink-0 hidden md:block">
                    <RiskBadge score={r.score}/>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => onNavigate('predict')}
                    className="text-xs text-brand-600 hover:underline shrink-0 flex items-center gap-1">
                    <MapPin size={11}/> Analyse
                  </button>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-300 text-center mt-4">
            Scores from the Hunch Random Forest model · Data from Google Places + OSM Rwanda
          </p>
        </>
      )}

      {ran && !loading && results.length === 0 && (
        <p className="text-center text-gray-400 py-12">
          No results — try a different province or business type.
        </p>
      )}
    </div>
  )
}