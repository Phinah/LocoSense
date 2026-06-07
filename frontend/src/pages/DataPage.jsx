import { useState, useEffect } from 'react'
import { getRecordStats, getRecords } from '../utils/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Loader2, RefreshCw } from 'lucide-react'

export default function DataPage() {
  const [stats,   setStats]   = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [s, r] = await Promise.all([getRecordStats(), getRecords({ limit: 20 })])
      setStats(s); setRecords(r)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const chartData = stats ? [
    { name: 'Successful',   value: stats.successful,   fill: '#22c55e' },
    { name: 'Unsuccessful', value: stats.unsuccessful, fill: '#ef4444' },
    { name: 'Unlabeled',    value: stats.unlabeled,    fill: '#d1d5db' },
  ] : []

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dataset overview</h1>
          <p className="text-gray-500 text-sm">Live view of the LocoSense training dataset</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-brand-500" /></div>
      ) : (
        <>
          {/* Stat cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total records',    value: stats.total },
                { label: 'Labeled',          value: stats.labeled },
                { label: 'Successful',       value: stats.successful,   color: 'text-green-600' },
                { label: 'Success rate',     value: `${(stats.success_rate * 100).toFixed(1)}%`, color: 'text-brand-600' },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">{c.label}</p>
                  <p className={`text-2xl font-bold ${c.color || 'text-gray-800'}`}>{c.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Chart */}
          {stats && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Label distribution</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Records table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Recent registrations</h3>
            </div>
            {records.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-10">No records yet. Be the first to register!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Category</th>
                      <th className="px-4 py-2">Rating</th>
                      <th className="px-4 py-2">Label</th>
                      <th className="px-4 py-2">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2 font-medium text-gray-900">{r.name || '—'}</td>
                        <td className="px-4 py-2 text-gray-500 capitalize">{r.category}</td>
                        <td className="px-4 py-2">
                          {r.google_rating != null
                            ? <span className="font-medium text-amber-600">{r.google_rating.toFixed(1)}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2">
                          {r.label === 1
                            ? <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">Success</span>
                            : r.label === 0
                            ? <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-200">Unsuccessful</span>
                            : <span className="text-xs text-gray-300">Unlabeled</span>}
                        </td>
                        <td className="px-4 py-2 text-gray-400 capitalize">{r.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
