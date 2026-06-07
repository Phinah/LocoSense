import { useState } from 'react'
import { createRecord } from '../utils/api'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', category: 'restaurant',
    lat: '-1.9302', lng: '30.1074',
    google_rating: '', review_count: '',
    months_operational: '',
    competitor_density: '', foot_traffic_score: '',
    infrastructure_score: '', income_proxy: '',
    transit_stops_nearby: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError]     = useState(null)

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null); setSuccess(null)
    try {
      const payload = {
        ...form,
        lat:                  parseFloat(form.lat),
        lng:                  parseFloat(form.lng),
        google_rating:        form.google_rating        ? parseFloat(form.google_rating) : null,
        review_count:         form.review_count         ? parseInt(form.review_count) : 0,
        months_operational:   form.months_operational   ? parseInt(form.months_operational) : 0,
        competitor_density:   form.competitor_density   ? parseInt(form.competitor_density) : 0,
        foot_traffic_score:   form.foot_traffic_score   ? parseFloat(form.foot_traffic_score) : 0,
        infrastructure_score: form.infrastructure_score ? parseFloat(form.infrastructure_score) : 0,
        income_proxy:         form.income_proxy         ? parseFloat(form.income_proxy) : 0,
        transit_stops_nearby: form.transit_stops_nearby ? parseInt(form.transit_stops_nearby) : 0,
      }
      const rec = await createRecord(payload)
      setSuccess(rec)
      setForm((p) => ({ ...p, name: '', google_rating: '', review_count: '', months_operational: '' }))
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const F = ({ label, id, type = 'text', step, min, max, placeholder, required }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      <input
        id={id} type={type} step={step} min={min} max={max}
        placeholder={placeholder} required={required}
        value={form[id]} onChange={set(id)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Register your business</h1>
      <p className="text-gray-500 text-sm mb-6">
        Your data contributes to the LocoSense dataset and improves recommendations for all entrepreneurs.
        All fields are stored securely. Business name is optional.
      </p>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 mb-6 text-sm">
          <CheckCircle size={16} />
          Business registered successfully! ID: {success.id}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <F label="Business name" id="name" placeholder="e.g. Sunset Restaurant" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={set('category')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="restaurant">Restaurant</option>
              <option value="cafe">Café / Coffee shop</option>
              <option value="bar">Bar / Lounge</option>
              <option value="food_stall">Food stall</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <F label="Latitude *"  id="lat"  type="number" step="0.0001" required placeholder="-1.9302" />
          <F label="Longitude *" id="lng"  type="number" step="0.0001" required placeholder="30.1074" />
        </div>

        <hr className="border-gray-100" />
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Business performance</p>

        <div className="grid grid-cols-3 gap-4">
          <F label="Google rating (0–5)"   id="google_rating"      type="number" step="0.1" min="0" max="5"   placeholder="4.2" />
          <F label="No. of reviews"        id="review_count"       type="number" min="0"                       placeholder="45" />
          <F label="Months operational"    id="months_operational" type="number" min="0"                       placeholder="18" />
        </div>

        <hr className="border-gray-100" />
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Location context (optional)</p>

        <div className="grid grid-cols-2 gap-4">
          <F label="Nearby competitors"      id="competitor_density"   type="number" min="0"          placeholder="8" />
          <F label="Foot traffic score (0–10)" id="foot_traffic_score" type="number" step="0.1" min="0" max="10" placeholder="7.0" />
          <F label="Infrastructure score (0–10)" id="infrastructure_score" type="number" step="0.1" min="0" max="10" placeholder="7.5" />
          <F label="Transit stops nearby"    id="transit_stops_nearby" type="number" min="0"          placeholder="5" />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">{error}</p>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : 'Submit registration'}
        </button>
      </form>
    </div>
  )
}
