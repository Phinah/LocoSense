import { useState } from 'react'
import { predict } from '../utils/api'
import KigaliMap from '../components/KigaliMap'
import ScoreRing from '../components/ScoreRing'
import FeatureChart from '../components/FeatureChart'
import { Loader2, AlertCircle, MapPin } from 'lucide-react'

const SECTORS = ['Kimironko', 'Remera', 'Nyabugogo', 'Gisozi', 'Kacyiru']

const DEFAULT_COORDS = {
  Kimironko: { lat: -1.9302, lng: 30.1074 },
  Remera: { lat: -1.9577, lng: 30.1080 },
  Nyabugogo: { lat: -1.9386, lng: 30.0480 },
  Gisozi: { lat: -1.9100, lng: 30.0800 },
  Kacyiru: { lat: -1.9320, lng: 30.0880 },
}

const verdictStyles = {
  'Recommended': 'bg-green-50 text-green-700 border-green-200',
  'Moderate': 'bg-amber-50 text-amber-700 border-amber-200',
  'Not recommended': 'bg-red-50 text-red-600 border-red-200',
}

export default function PredictPage() {
  const [sector, setSector] = useState('Kimironko')
  const [lat, setLat] = useState(DEFAULT_COORDS.Kimironko.lat)
  const [lng, setLng] = useState(DEFAULT_COORDS.Kimironko.lng)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Advanced overrides
  const [showAdv, setShowAdv] = useState(false)
  const [competitors, setCompetitors] = useState('')
  const [footTraffic, setFootTraffic] = useState('')
  const [infraScore, setInfraScore] = useState('')

  const handleSectorChange = (s) => {
    setSector(s)
    const c = DEFAULT_COORDS[s]
    if (c) { setLat(c.lat); setLng(c.lng) }
  }

  const handleMapClick = ({ lat: clickLat, lng: clickLng }) => {
    setLat(parseFloat(clickLat.toFixed(4)))
    setLng(parseFloat(clickLng.toFixed(4)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const payload = {
        business_type: 'restaurant',
        target_lat: lat,
        target_lng: lng,
        target_sector_name: sector,
        competitor_density: competitors ? parseInt(competitors) : null,
        foot_traffic_score: footTraffic ? parseFloat(footTraffic) : null,
        infrastructure_score: infraScore ? parseFloat(infraScore) : null,
      }
      const data = await predict(payload)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Check a location</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Select a sector, click the map to pin a spot, then run the analysis.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT: form + map ── */}
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            {/* Sector selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
              <select
                value={sector}
                onChange={(e) => handleSectorChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {SECTORS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Coordinates display */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number" step="0.0001" value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number" step="0.0001" value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Advanced overrides */}
            <div>
              <button type="button" onClick={() => setShowAdv(!showAdv)}
                className="text-sm text-brand-600 hover:underline">
                {showAdv ? '− Hide' : '+ Show'} advanced overrides
              </button>
              {showAdv && (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nearby competitors</label>
                    <input type="number" min="0" placeholder="auto"
                      value={competitors} onChange={(e) => setCompetitors(e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Foot traffic (0–10)</label>
                    <input type="number" min="0" max="10" step="0.1" placeholder="auto"
                      value={footTraffic} onChange={(e) => setFootTraffic(e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Infrastructure (0–10)</label>
                    <input type="number" min="0" max="10" step="0.1" placeholder="auto"
                      value={infraScore} onChange={(e) => setInfraScore(e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 border border-red-200">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Analysing…</> : 'Run analysis →'}
            </button>
          </form>

          {/* Map */}
          <div style={{ height: 340 }} className="rounded-xl overflow-hidden border border-gray-100">
            <KigaliMap
              selectedLat={lat} selectedLng={lng}
              onMapClick={handleMapClick}
              score={result?.score ?? null}
            />
          </div>
          <p className="text-xs text-gray-400 text-center">Click the map to update coordinates</p>
        </div>

        {/* ── RIGHT: results ── */}
        <div>
          {!result && !loading && (
            <div className="bg-white rounded-xl border border-gray-100 p-8 h-full flex flex-col items-center justify-center text-center">
              <MapPin size={40} className="text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">Select a location and run analysis to see results here.</p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-xl border border-gray-100 p-8 h-full flex flex-col items-center justify-center">
              <Loader2 size={32} className="animate-spin text-brand-500 mb-3" />
              <p className="text-sm text-gray-400">Running ML model…</p>
            </div>
          )}

          {result && !loading && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
              {/* Score + verdict */}
              <div className="flex items-center gap-6">
                <ScoreRing score={result.score} />
                <div>
                  <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full border ${verdictStyles[result.verdict] || ''}`}>
                    {result.verdict}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    Confidence: <span className="font-medium capitalize">{result.confidence}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Sector: <span className="font-medium">{result.sector_name || '—'}</span>
                  </p>
                  <p className="text-xs text-gray-300 mt-1">Model: {result.model_version}</p>
                </div>
              </div>

              {/* Feature explanations */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">What drove this score</h3>
                <FeatureChart features={result.top_features} />
              </div>

              <p className="text-xs text-gray-300 border-t border-gray-50 pt-3">
                Query ID: {result.query_id}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
