import { useState, useEffect } from 'react'
import { predict, getSectorsGrouped } from '../utils/api'
import { validatePredictForm } from '../utils/validation'
import { BUSINESS_TYPES } from '../utils/featureDescriptions'
import KigaliMap from '../components/KigaliMap'
import ScoreRing from '../components/ScoreRing'
import FeatureChart from '../components/FeatureChart'
import AreaAnalysis from '../components/AreaAnalysis'
import { Loader2, AlertCircle, MapPin, Info, Crosshair } from 'lucide-react'
import { useMap } from 'react-leaflet'

const verdictStyles = {
  'Recommended':     'bg-green-50 text-green-700 border-green-200',
  'Moderate':        'bg-amber-50 text-amber-700 border-amber-200',
  'Not recommended': 'bg-red-50 text-red-600 border-red-200',
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function nearestSector(lat, lng, grouped) {
  let best = null, bestDist = Infinity
  for (const sectors of Object.values(grouped)) {
    for (const s of sectors) {
      const d = haversine(lat, lng, s.lat, s.lng)
      if (d < bestDist) { bestDist = d; best = s }
    }
  }
  return best
}

const FieldError = ({ msg }) =>
  msg ? (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
      <AlertCircle size={11}/>{msg}
    </p>
  ) : null

export default function PredictPage() {
  const [groupedSectors,  setGroupedSectors]  = useState({})
  const [sector,          setSector]          = useState('Kimironko')
  const [lat,             setLat]             = useState(-1.9302)
  const [lng,             setLng]             = useState(30.1074)
  const [businessType,    setBusinessType]    = useState('restaurant')
  const [detectedSector,  setDetectedSector]  = useState(null)
  const [result,          setResult]          = useState(null)
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState(null)
  const [fieldErrors,     setFieldErrors]     = useState({})
  const [showAdv,         setShowAdv]         = useState(false)
  const [competitors,     setCompetitors]     = useState('')
  const [footTraffic,     setFootTraffic]     = useState('')
  const [flyTrigger, setFlyTrigger] = useState(0)
  const [infraScore,     setInfraScore]     = useState('')
  const [competitorDens, setCompetitorDens] = useState('')
  const [googleRating,   setGoogleRating]  = useState('')
  const [reviewCount,    setReviewCount]   = useState('')
  useEffect(() => {
    getSectorsGrouped().then(setGroupedSectors).catch(() => {})
  }, [])

  const handleSectorChange = (name) => {
    setSector(name); setDetectedSector(null)
    for (const sectors of Object.values(groupedSectors)) {
      const found = sectors.find((s) => s.name === name)
      if (found) { setLat(found.lat); setLng(found.lng); break }
    }
  }

  const handleMapClick = ({ lat: clickLat, lng: clickLng }) => {
    const newLat = parseFloat(clickLat.toFixed(4))
    const newLng = parseFloat(clickLng.toFixed(4))
    setLat(newLat); setLng(newLng)
    setFieldErrors((p) => ({ ...p, lat: undefined, lng: undefined }))
    if (Object.keys(groupedSectors).length > 0) {
      const nearest = nearestSector(newLat, newLng, groupedSectors)
      if (nearest) { setSector(nearest.name); setDetectedSector(nearest.name) }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null)
    const { valid, errors } = validatePredictForm({ lat, lng, footTraffic, infraScore, competitors })
    if (!valid) { setFieldErrors(errors); return }
    setFieldErrors({}); setLoading(true); setResult(null)
    try {
      const data = await predict({
        business_type:        businessType,
        target_lat:           lat,
        target_lng:           lng,
        target_sector_name:   sector,
        competitor_density:   competitors !== '' ? parseInt(competitors)   : null,
        foot_traffic_score:   footTraffic !== '' ? parseFloat(footTraffic) : null,
        infrastructure_score: infraScore  !== '' ? parseFloat(infraScore)  : null,
        google_rating:        googleRating !== '' ? parseFloat(googleRating) : null,
        review_count:         reviewCount  !== '' ? parseInt(reviewCount)   : null,
        infra_score:          infraScore  !== '' ? parseFloat(infraScore)  : null,
      })
      setResult(data)
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        const fe = {}
        detail.forEach((d) => { const f = d.loc?.[d.loc.length-1]; if (f) fe[f] = d.msg })
        setFieldErrors(fe)
      } else {
        setError(detail || 'Something went wrong. Is the backend running?')
      }
    } finally { setLoading(false) }
  }


const [searchQuery, setSearchQuery] = useState('')
const [searching, setSearching] = useState(false)

const [searchedPlace, setSearchedPlace] = useState(null)

const handleSearch = async () => {
  if (!searchQuery.trim()) return
  setSearching(true)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&countrycodes=rw&format=json&limit=1&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    if (data.length > 0) {
      const newLat = parseFloat(parseFloat(data[0].lat).toFixed(4))
      const newLng  = parseFloat(parseFloat(data[0].lon).toFixed(4))
      const addr    = data[0].address || {}

      const placeName = data[0].name || searchQuery
      const village   = addr.suburb || addr.neighbourhood ||
                        addr.village || addr.hamlet || addr.quarter || null

      setLat(newLat)
      setLng(newLng)
      setSearchedPlace({ name: placeName, village })
      setFieldErrors(p => ({ ...p, lat: undefined, lng: undefined }))
      setFlyTrigger(t => t + 1)   // ← add this line
      if (Object.keys(groupedSectors).length > 0) {
        const nearest = nearestSector(newLat, newLng, groupedSectors)
        if (nearest) { setSector(nearest.name); setDetectedSector(nearest.name) }
      }
    } else {
      setSearchedPlace(null)
      setFieldErrors(p => ({ ...p, lat: 'Location not found in Rwanda — try a different name' }))
    }
  } catch {
    setFieldErrors(p => ({ ...p, lat: 'Search failed — check your connection' }))
  } finally { setSearching(false) }
}
  const selectedBizType = BUSINESS_TYPES.find((b) => b.value === businessType)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Check a location</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Select your business type, pick a sector or click the map, then run the analysis.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT ── */}
        <div className="space-y-4">
          <form onSubmit={handleSubmit}
            className="bg-white rounded-xl border border-gray-100 p-5 space-y-4" noValidate>
{/* Place search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search a place in Rwanda
          </label>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()   // ← this is the fix, stops it reaching the outer form
                  handleSearch()
                }
              }}
              placeholder="e.g. Kimironko, Remera market, KG 123 St..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              {searching ? <Loader2 size={14} className="animate-spin" /> : '🔍'}
              {searching ? '' : 'Search'}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-1">
            Powered by OpenStreetMap · Rwanda only
          </p>
        </div>
          {/* Map */}
          <div style={{ height: 300 }} className="rounded-xl overflow-hidden border border-gray-100">
        <KigaliMap
          selectedLat={lat}
          selectedLng={lng}
          flyTrigger={flyTrigger}
          onMapClick={handleMapClick}
          score={result?.score}
        />          </div>

            {/* Business type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What type of business are you planning to open?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_TYPES.map((b) => (
                  <button key={b.value} type="button" onClick={() => setBusinessType(b.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors text-left ${
                      businessType === b.value
                        ? 'bg-brand-50 border-brand-400 text-brand-700 font-medium'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>
                    <span>{b.icon}</span>
                    <span className="truncate">{b.label}</span>
                  </button>
                ))}
              </div>
              {selectedBizType && (
                <p className="mt-2 text-xs text-gray-400 flex items-start gap-1">
                  <Info size={11} className="mt-0.5 shrink-0"/>
                  {selectedBizType.tips}
                </p>
              )}
            </div>

            {/* Sector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
              <select value={sector} onChange={(e) => handleSectorChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {Object.keys(groupedSectors).length === 0
                  ? <option>Loading sectors…</option>
                  : Object.entries(groupedSectors).map(([province, sectors]) => (
                    <optgroup key={province} label={`── ${province} Province`}>
                      {sectors.map((s) => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </optgroup>
                  ))
                }
              </select>
              {detectedSector && (
                <p className="mt-1 text-xs text-brand-600 flex items-center gap-1">
                  <Crosshair size={11}/>
                  Auto-detected from map: <strong>{detectedSector}</strong>
                </p>
              )}
            </div>
        
            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude *</label>
                <input type="number" step="0.0001" value={lat}
                  onChange={(e) => { setLat(parseFloat(e.target.value)); setFieldErrors((p) => ({ ...p, lat: undefined })) }}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${fieldErrors.lat ? 'border-red-400' : 'border-gray-200'}`}
                />
                <FieldError msg={fieldErrors.lat}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude *</label>
                <input type="number" step="0.0001" value={lng}
                  onChange={(e) => { setLng(parseFloat(e.target.value)); setFieldErrors((p) => ({ ...p, lng: undefined })) }}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${fieldErrors.lng ? 'border-red-400' : 'border-gray-200'}`}
                />
                <FieldError msg={fieldErrors.lng}/>
              </div>
            </div>

            {/* Advanced */}
            <div>
              <button type="button" onClick={() => setShowAdv(!showAdv)}
                className="text-sm text-brand-600 hover:underline">
                {showAdv ? '− Hide' : '+ Show'} advanced overrides
              </button>
              {showAdv && (
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Info size={11}/> Leave blank to use sector defaults
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Nearby competitors', key: 'competitors', val: competitors, set: setCompetitors, step: '1',   min: '0', max: '100' },
                      { label: 'Foot traffic (0–10)', key: 'footTraffic', val: footTraffic, set: setFootTraffic, step: '0.1', min: '0', max: '10'  },
                      { label: 'Infrastructure (0–10)',key: 'infraScore',  val: infraScore,  set: setInfraScore,  step: '0.1', min: '0', max: '10'  },
                    ].map(({ label, key, val, set, ...rest }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                        <input type="number" {...rest} placeholder="auto" value={val}
                          onChange={(e) => { set(e.target.value); setFieldErrors((p) => ({ ...p, [key]: undefined })) }}
                          className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${fieldErrors[key] ? 'border-red-400' : 'border-gray-200'}`}
                        />
                        <FieldError msg={fieldErrors[key]}/>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 border border-red-200">
                <AlertCircle size={15}/> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={16} className="animate-spin"/> Analysing…</> : 'Run analysis →'}
            </button>
          </form>


          {/* Area composition — shows after a sector is set */}
          <AreaAnalysis sector={sector}/>
        </div>

        {/* ── RIGHT ── */}
        <div>
          {!result && !loading && (
            <div className="bg-white rounded-xl border border-gray-100 p-8 h-64 flex flex-col items-center justify-center text-center">
              <MapPin size={40} className="text-gray-200 mb-3"/>
              <p className="text-gray-500 text-sm font-medium mb-1">No analysis yet</p>
              <p className="text-gray-400 text-xs">Select your business type, pick a location, and click Run analysis.</p>
            </div>
          )}
          {loading && (
            <div className="bg-white rounded-xl border border-gray-100 p-8 h-64 flex flex-col items-center justify-center">
              <Loader2 size={32} className="animate-spin text-brand-500 mb-3"/>
              <p className="text-sm text-gray-400">Running ML model…</p>
            </div>
          )}
          {result && !loading && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
              <div className="flex items-center gap-5">
                <ScoreRing score={result.score}/>
                <div>
                  <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full border ${verdictStyles[result.verdict] || ''}`}>
                    {result.verdict}
                  </span>
                  <p className="text-sm text-gray-500 mt-1.5">Confidence: <span className="font-medium capitalize">{result.confidence}</span></p>
                  {/* Place context — shown after a search */}
                  {searchedPlace && (
                    <div className="flex flex-wrap items-center gap-2 mb-4 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm">
                      <span className="text-blue-700 font-semibold">📍 {searchedPlace.name}</span>
                      {searchedPlace.village && (
                        <span className="text-gray-500">· {searchedPlace.village}</span>
                      )}
                      {sector && (
                        <span className="text-gray-500">· {sector} sector</span>
                      )}
                    </div>
                  )}                  
                  <p className="text-sm text-gray-500">Business: <span className="font-medium capitalize">{businessType.replace('_', ' ')}</span></p>
                  <p className="text-xs text-gray-300 mt-1">Model: {result.model_version}</p>
                </div>
              </div>

              {selectedBizType && result.score < 0.50 && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">💡 Tip for {selectedBizType.label}</p>
                  <p className="text-xs text-amber-600">{selectedBizType.tips}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">What drove this score</p>
                <FeatureChart features={result.top_features}/>
              </div>

              {/* <p className="text-xs text-gray-300 border-t border-gray-50 pt-3">
                Query ID: {result.query_id}
              </p> */}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}