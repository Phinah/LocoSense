import { useState } from 'react'
import { isAxiosError } from 'axios'
import { Loader2, MapPin, TrendingUp, ChevronRight, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react'
import { BUSINESS_TYPES } from '../utils/featureDescriptions'
import api from '../utils/api'

const PROVINCES = ['All', 'Kigali', 'Northern', 'Southern', 'Eastern', 'Western'] as const

const BUDGETS = [
    { value: 'low', label: 'Below RWF 3M', sub: 'Low start-up cost', icon: '💰' },
    { value: 'medium', label: 'RWF 3M – 10M', sub: 'Mid-range investment', icon: '💰💰' },
    { value: 'high', label: 'Above RWF 10M', sub: 'High-capital venture', icon: '💰💰💰' },
] as const

const RISKS = [
    { value: 'low', label: 'Play it safe', sub: 'Only high-confidence spots' },
    { value: 'medium', label: 'Balanced', sub: 'Good odds, some uncertainty' },
    { value: 'high', label: 'Go bold', sub: 'Willing to take a chance' },
] as const

type NavigationTarget = 'home' | 'predict' | 'advisor' | 'investor' | 'register' | 'data' | 'recommend'
type Province = typeof PROVINCES[number]
type BudgetValue = typeof BUDGETS[number]['value']
type RiskValue = typeof RISKS[number]['value']

type TopFeature = {
    feature: string
    direction: 'positive' | 'negative' | string
    impact: number
}

type Recommendation = {
    sector: string
    business_type: string
    score: number
    income_proxy: number
    foot_traffic: number
    competition: number
    top_features: TopFeature[]
}

type RecommendationResponse = {
    total_evaluated: number
    province: string
    budget: string
    risk: string
    recommendations: Recommendation[]
}

type RecommendPageProps = {
    onNavigate: (page: NavigationTarget) => void
}

const scoreColor = (s: number): string =>
    s >= 0.70 ? 'text-green-600' : s >= 0.45 ? 'text-amber-600' : 'text-red-500'

const scoreBg = (s: number): string =>
    s >= 0.70 ? 'bg-green-50 border-green-200' : s >= 0.45 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

function RiskBadge({ score }: { score: number }) {
    if (score >= 0.70) return <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle size={11} />Low risk</span>
    if (score >= 0.45) return <span className="flex items-center gap-1 text-xs text-amber-600"><AlertTriangle size={11} />Medium risk</span>
    return <span className="flex items-center gap-1 text-xs text-red-500"><AlertTriangle size={11} />High risk</span>
}

const STEPS = ['Business type', 'Your preferences', 'Results']

export default function RecommendPage({ onNavigate }: RecommendPageProps) {
    const [step, setStep] = useState(0)
    const [bizTypes, setBizTypes] = useState<string[]>([])
    const [province, setProvince] = useState<Province>('All')
    const [budget, setBudget] = useState<BudgetValue>('medium')
    const [risk, setRisk] = useState<RiskValue>('medium')
    const [results, setResults] = useState<RecommendationResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const toggleBiz = (v: string) =>
        setBizTypes((prev) =>
            prev.includes(v) ? prev.filter((b) => b !== v) : [...prev, v]
        )

    const run = async () => {
        setLoading(true); setError(null)
        try {
            const r = await api.post('/api/v1/recommend', {
                business_types: bizTypes,
                budget_range: budget,
                preferred_province: province,
                risk_tolerance: risk,
            })
            setResults(r.data as RecommendationResponse)
            setStep(2)
        } catch (e: unknown) {
            if (isAxiosError<{ detail?: string }>(e)) {
                setError(e.response?.data?.detail || 'Could not connect. Is the backend running?')
            } else {
                setError('Could not connect. Is the backend running?')
            }
        } finally { setLoading(false) }
    }

    const reset = () => {
        setStep(0); setBizTypes([]); setProvince('All')
        setBudget('medium'); setRisk('medium')
        setResults(null); setError(null)
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Find my business location</h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Answer three questions — our ML model scores every matching sector and returns your top picks.
                    </p>
                </div>
                {step > 0 && (
                    <button onClick={reset}
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
                        <RotateCcw size={13} /> Start over
                    </button>
                )}
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8">
                {STEPS.map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i < step ? 'bg-brand-600 text-white'
                                : i === step ? 'bg-brand-100 text-brand-700 border-2 border-brand-400'
                                    : 'bg-gray-100 text-gray-400'
                            }`}>
                            {i < step ? '✓' : i + 1}
                        </div>
                        <span className={`text-sm ${i === step ? 'text-brand-700 font-medium' : 'text-gray-400'}`}>{s}</span>
                        {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200" />}
                    </div>
                ))}
            </div>

            {/* STEP 0 — Business type */}
            {step === 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-1">What type of business are you planning to open?</h2>
                        <p className="text-sm text-gray-400">Select one or more — the model will find the best location for each.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {BUSINESS_TYPES.map((b) => (
                            <button key={b.value} type="button" onClick={() => toggleBiz(b.value)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${bizTypes.includes(b.value)
                                        ? 'bg-brand-50 border-brand-400 text-brand-700 shadow-sm'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}>
                                <span className="text-2xl">{b.icon}</span>
                                <div>
                                    <p className="text-sm font-medium">{b.label}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{b.tips.split('.')[0]}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setStep(1)}
                        disabled={bizTypes.length === 0}
                        className="w-full bg-brand-600 text-white py-3 rounded-xl font-medium hover:bg-brand-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
                        Next — set preferences <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* STEP 1 — Preferences */}
            {step === 1 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">

                    {/* Province */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-800 mb-1">Where in Rwanda?</h2>
                        <p className="text-xs text-gray-400 mb-3">Select a province or scan all of Rwanda.</p>
                        <div className="flex flex-wrap gap-2">
                            {PROVINCES.map((p) => (
                                <button key={p} onClick={() => setProvince(p)}
                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${province === p
                                            ? 'bg-brand-600 text-white border-brand-600'
                                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}>
                                    {p === 'All' ? 'All Rwanda' : p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Budget */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-800 mb-1">What is your budget range?</h2>
                        <p className="text-xs text-gray-400 mb-3">We use this to match you with areas where the income level suits your pricing.</p>
                        <div className="grid grid-cols-3 gap-3">
                            {BUDGETS.map((b) => (
                                <button key={b.value} onClick={() => setBudget(b.value)}
                                    className={`flex flex-col items-center px-3 py-4 rounded-xl border text-center transition-all ${budget === b.value
                                            ? 'bg-brand-50 border-brand-400 text-brand-700'
                                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}>
                                    <span className="text-xl mb-1">{b.icon}</span>
                                    <span className="text-sm font-medium">{b.label}</span>
                                    <span className="text-xs text-gray-400 mt-0.5">{b.sub}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Risk */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-800 mb-1">How much risk can you handle?</h2>
                        <p className="text-xs text-gray-400 mb-3">This filters out locations below your confidence threshold.</p>
                        <div className="grid grid-cols-3 gap-3">
                            {RISKS.map((r) => (
                                <button key={r.value} onClick={() => setRisk(r.value)}
                                    className={`flex flex-col items-center px-3 py-4 rounded-xl border text-center transition-all ${risk === r.value
                                            ? 'bg-brand-50 border-brand-400 text-brand-700'
                                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}>
                                    <span className="text-sm font-semibold">{r.label}</span>
                                    <span className="text-xs text-gray-400 mt-1">{r.sub}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <div className="flex gap-3">
                        <button onClick={() => setStep(0)}
                            className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                            ← Back
                        </button>
                        <button onClick={run} disabled={loading}
                            className="flex-1 bg-brand-600 text-white py-3 rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                            {loading
                                ? <><Loader2 size={16} className="animate-spin" />Running ML model across {province === 'All' ? 23 : ''} sectors…</>
                                : <><TrendingUp size={16} />Get my top recommendations</>
                            }
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2 — Results */}
            {step === 2 && results && (
                <div className="space-y-5">

                    {/* Summary */}
                    <div className="bg-brand-50 border border-brand-100 rounded-xl px-5 py-4">
                        <p className="text-sm text-brand-700">
                            <span className="font-semibold">Hunch ML model</span> evaluated{' '}
                            <span className="font-semibold">{results.total_evaluated}</span> sector-business combinations
                            in <span className="font-semibold">{results.province}</span> matching your budget ({results.budget})
                            and risk preference ({results.risk}).
                        </p>
                    </div>

                    {results.recommendations.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                            <p className="text-gray-500 font-medium mb-2">No matches found</p>
                            <p className="text-gray-400 text-sm mb-4">
                                Try widening your province to "All Rwanda", raising your risk tolerance, or adding more business types.
                            </p>
                            <button onClick={() => setStep(1)}
                                className="text-brand-600 text-sm hover:underline">← Adjust preferences</button>
                        </div>
                    ) : (
                        results.recommendations.map((rec, i) => {
                            const topFeatures = Array.isArray(rec.top_features) ? rec.top_features : []

                            return (
                                <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">

                                    {/* Card header */}
                                    <div className={`px-5 py-3 border-b border-gray-100 flex items-center justify-between ${scoreBg(rec.score)}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-amber-400 text-white'
                                                    : i === 1 ? 'bg-gray-300 text-white'
                                                        : 'bg-orange-300 text-white'
                                                }`}>{i + 1}</div>
                                            <div>
                                                <p className="font-bold text-gray-900">
                                                    {rec.sector}
                                                    <span className="ml-2 text-sm font-normal text-gray-500 capitalize">
                                                        — {rec.business_type.replace('_', ' ')}
                                                    </span>
                                                </p>
                                                <RiskBadge score={rec.score} />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-2xl font-extrabold ${scoreColor(rec.score)}`}>
                                                {Math.round(rec.score * 100)}%
                                            </p>
                                            <p className="text-xs text-gray-400">suitability</p>
                                        </div>
                                    </div>

                                    {/* Card body */}
                                    <div className="px-5 py-4">

                                        {/* Quick stats */}
                                        <div className="grid grid-cols-3 gap-3 mb-4">
                                            <div className="text-center bg-gray-50 rounded-lg py-2">
                                                <p className="text-xs text-gray-400">Area income</p>
                                                <p className="text-sm font-semibold text-gray-700">
                                                    RWF {Math.round(rec.income_proxy / 1000)}K
                                                </p>
                                            </div>
                                            <div className="text-center bg-gray-50 rounded-lg py-2">
                                                <p className="text-xs text-gray-400">Foot traffic</p>
                                                <p className="text-sm font-semibold text-gray-700">{rec.foot_traffic}/10</p>
                                            </div>
                                            <div className="text-center bg-gray-50 rounded-lg py-2">
                                                <p className="text-xs text-gray-400">Competition</p>
                                                <p className="text-sm font-semibold text-gray-700">{rec.competition} nearby</p>
                                            </div>
                                        </div>

                                        {/* Top 3 features */}
                                        <div className="space-y-2 mb-4">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Top factors driving this score
                                            </p>
                                            {topFeatures.length > 0 ? (
                                                topFeatures.map((f, fi) => (
                                                    <div key={fi} className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-600">{f.feature}</span>
                                                        <span className={`text-sm font-semibold ${f.direction === 'positive' ? 'text-green-600' : 'text-red-500'}`}>
                                                            {f.direction === 'positive' ? '+' : ''}{Number(f.impact || 0).toFixed(3)}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-400">Feature breakdown unavailable for this recommendation.</p>
                                            )}
                                        </div>

                                        {/* CTA */}
                                        <button
                                            onClick={() => onNavigate('predict')}
                                            className="w-full flex items-center justify-center gap-2 border border-brand-300 text-brand-700 bg-brand-50 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-100 transition-colors">
                                            <MapPin size={14} /> Run full analysis for {rec.sector}
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    )}

                    <p className="text-xs text-gray-300 text-center">
                        Recommendations generated by Hunch Random Forest model · {results.total_evaluated} sectors evaluated
                    </p>
                </div>
            )}
        </div>
    )
}