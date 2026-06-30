import { useState, useEffect } from 'react'
import { getDatasetStats, getDataset } from '../utils/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Loader2, RefreshCw, Database, Globe, FlaskConical } from 'lucide-react'

const LABEL_STYLES = {
  1:    'bg-green-50 text-green-700 border border-green-200',
  0:    'bg-red-50 text-red-600 border border-red-200',
  null: 'text-gray-300',
}

export default function DataPage() {
  const [stats,    setStats]    = useState(null)
  const [records,  setRecords]  = useState([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [sector,   setSector]   = useState('')
  const [label,    setLabel]    = useState('')
  const [source,   setSource]   = useState('')
  const [page,     setPage]     = useState(0)
  const LIMIT = 50

  const load = async () => {
    setLoading(true)
    try {
      const params = {
        limit:  LIMIT,
        offset: page * LIMIT,
        ...(sector && { sector }),
        ...(label  !== '' && { label: parseInt(label) }),
        ...(source && { source }),
      }
      const [s, d] = await Promise.all([getDatasetStats(), getDataset(params)])
      setStats(s)
      setRecords(d.records)
      setTotal(d.total)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, sector, label, source])

  // Top 10 sectors for chart
  const sectorChart = stats
    ? Object.entries(stats.by_sector)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }))
    : []

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Dataset</h1>
          <p className="text-gray-500 text-sm">All records used to train the Hunch ML model</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading && !stats ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-brand-500" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total records',    value: stats.total,              icon: <Database size={16} />,     color: 'text-gray-800' },
                { label: 'Real (Google)',     value: stats.real_records,       icon: <Globe size={16} />,        color: 'text-blue-600' },
                { label: 'Synthetic',         value: stats.synthetic_records,  icon: <FlaskConical size={16} />, color: 'text-purple-600' },
                { label: 'Success rate',      value: `${(stats.success_rate * 100).toFixed(1)}%`, icon: null, color: 'text-green-600' },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1">{c.icon}{c.label}</p>
                  <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Sector distribution chart */}
          {sectorChart.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Records by sector (top 10)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sectorChart} margin={{ top: 0, right: 0, bottom: 30, left: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap gap-3 items-center">
              <h3 className="text-sm font-semibold text-gray-700 flex-1">
                Records {total > 0 && <span className="text-gray-400 font-normal">({total} matching)</span>}
              </h3>

              {/* Sector filter */}
              {stats && (
                <select value={sector} onChange={(e) => { setSector(e.target.value); setPage(0) }}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none">
                  <option value="">All sectors</option>
                  {Object.keys(stats.by_sector).sort().map((s) => (
                    <option key={s} value={s}>{s} ({stats.by_sector[s]})</option>
                  ))}
                </select>
              )}

              {/* Label filter */}
              <select value={label} onChange={(e) => { setLabel(e.target.value); setPage(0) }}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none">
                <option value="">All labels</option>
                <option value="1">Successful</option>
                <option value="0">Unsuccessful</option>
              </select>

              {/* Source filter */}
              <select value={source} onChange={(e) => { setSource(e.target.value); setPage(0) }}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none">
                <option value="">All sources</option>
                <option value="real">Real (Google)</option>
                <option value="synthetic">Synthetic</option>
              </select>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={22} className="animate-spin text-brand-400" />
              </div>
            ) : records.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-10">No records match the current filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Sector</th>
                      <th className="px-4 py-2">Rating</th>
                      <th className="px-4 py-2">Reviews</th>
                      <th className="px-4 py-2">Competitors</th>
                      <th className="px-4 py-2">Label</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map((r, i) => (
                      <tr key={r.place_id || i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2 font-medium text-gray-900 max-w-[180px] truncate">
                          {r.name || '—'}
                        </td>
                        <td className="px-4 py-2 text-gray-500">{r.sector_name || '—'}</td>
                        <td className="px-4 py-2">
                          {r.google_rating != null
                            ? <span className="font-medium text-amber-600">{Number(r.google_rating).toFixed(1)}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2 text-gray-500">{r.review_count ?? '—'}</td>
                        <td className="px-4 py-2 text-gray-500">{r.competitor_density ?? '—'}</td>
                        <td className="px-4 py-2">
                          {r.label === 1
                            ? <span className={`text-xs px-2 py-0.5 rounded-full ${LABEL_STYLES[1]}`}>Success</span>
                            : r.label === 0
                            ? <span className={`text-xs px-2 py-0.5 rounded-full ${LABEL_STYLES[0]}`}>Unsuccessful</span>
                            : <span className="text-xs text-gray-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <span>Page {page + 1} of {totalPages}</span>
                <div className="flex gap-2">
                  <button disabled={page === 0} onClick={() => setPage(page - 1)}
                    className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                    ← Prev
                  </button>
                  <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}
                    className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
