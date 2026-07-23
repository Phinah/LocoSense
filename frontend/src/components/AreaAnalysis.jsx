import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, RefreshCw, Info } from 'lucide-react'
import api from '../utils/api'

const SIGNAL_STYLE = {
  positive: 'bg-green-50 border-green-200 text-green-700',
  neutral:  'bg-gray-50 border-gray-200 text-gray-600',
  negative: 'bg-red-50 border-red-200 text-red-600',
}

const COVERAGE_WIDTH = {
  'High':       'w-full',
  'Moderate':   'w-2/3',
  'Low':        'w-1/4',
  'None found': 'w-0',
}

const COVERAGE_COLOR = {
  'High':       'bg-green-500',
  'Moderate':   'bg-amber-400',
  'Low':        'bg-orange-400',
  'None found': 'bg-gray-200',
}

export default function AreaAnalysis({ sector }) {
  const [allTypes,  setAllTypes]  = useState([])
  const [selected,  setSelected]  = useState([
    'residential', 'commercial', 'construction', 'education', 'healthcare', 'religious',
  ])
  const [results,   setResults]   = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [district,  setDistrict]  = useState(null)

  useEffect(() => {
    api.get('/api/v1/area-analysis/landuse-types')
      .then((r) => setAllTypes(r.data))
      .catch(() => {})
  }, [])

  const toggle = (key) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )

  const run = async () => {
    if (!selected.length) return
    setLoading(true); setError(null); setResults(null)
    try {
      const r = await api.get('/api/v1/area-analysis', {
        params: { district: 'Gasabo', types: selected.join(','), ...(sector && { sector }) },
      })
      setResults(r.data)
      setDistrict(r.data.district)
    } catch (e) {
      setError(e.response?.data?.detail || 'OpenStreetMap query failed. Try fewer types or try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Area Composition</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            What types of land use exist in {district || 'this district'}? Data from OpenStreetMap.
          </p>
        </div>
        {results && (
          <button onClick={run} disabled={loading}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <RefreshCw size={11}/> Refresh
          </button>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Select what to check:</p>
        <div className="grid grid-cols-2 gap-1.5">
          {allTypes.map((t) => (
            <label key={t.key}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                selected.includes(t.key)
                  ? 'bg-brand-50 border-brand-300 text-brand-700'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}>
              <input type="checkbox" className="hidden"
                checked={selected.includes(t.key)}
                onChange={() => toggle(t.key)} />
              <span>{t.icon}</span>
              <span className="truncate font-medium">{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button onClick={run} disabled={loading || !selected.length}
        className="w-full bg-gray-800 text-white text-sm py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
        {loading
          ? <><Loader2 size={14} className="animate-spin"/> Querying OpenStreetMap…</>
          : `Analyse ${selected.length} type${selected.length !== 1 ? 's' : ''} in ${district || sector || 'district'} →`
        }
      </button>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-600 text-xs rounded-lg px-3 py-2 border border-red-200">
          <AlertCircle size={13} className="mt-0.5 shrink-0"/>{error}
        </div>
      )}

      {results && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Info size={11}/> {results.data_note}
          </p>
          {results.results.map((r) => (
            <div key={r.type} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{r.icon}</span>
                  <span className="text-xs font-semibold text-gray-700">{r.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${SIGNAL_STYLE[r.business_signal]}`}>
                    {r.business_signal}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{r.count} mapped</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${COVERAGE_WIDTH[r.coverage]} ${COVERAGE_COLOR[r.coverage]}`}/>
              </div>
              <p className="text-xs text-gray-400">{r.description}</p>
              {r.good_for.length > 0 && r.count > 0 && (
                <p className="text-xs text-brand-600">
                  Good signal for: {r.good_for.map((b) => b.replace('_', ' ')).join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}