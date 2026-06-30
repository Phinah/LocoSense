import { MapPin, TrendingUp, Database, Cpu, Globe, ArrowRight, Star } from 'lucide-react'

const features = [
  {
    icon: <MapPin size={20} className="text-blue-600" />,
    bg:   'bg-blue-50',
    title: 'Location scoring',
    desc:  'Get a suitability score for any location across Rwanda based on 11 real-world indicators.',
  },
  {
    icon: <Cpu size={20} className="text-violet-600" />,
    bg:   'bg-violet-50',
    title: 'ML-powered',
    desc:  'Random Forest model trained on 4,470+ records — blending real Google Places data with synthetic Rwanda data.',
  },
  {
    icon: <TrendingUp size={20} className="text-green-600" />,
    bg:   'bg-green-50',
    title: 'Explainable AI',
    desc:  'See exactly which factors — foot traffic, competitors, income level — drove your score.',
  },
  {
    icon: <Globe size={20} className="text-amber-600" />,
    bg:   'bg-amber-50',
    title: 'Rwanda-wide',
    desc:  'Covers 23 sectors across all 5 provinces: Kigali, Northern, Southern, Eastern and Western.',
  },
]

const testimonial = {
  quote: "This would have saved me choosing the wrong street for my first restaurant. Data over guesswork.",
  author: "Business Owner at Kimironko",
}

export default function HomePage({ onNavigate }) {
  return (
    <div className="max-w-5xl mx-auto px-4">

      {/* ── Hero ── */}
      <div className="text-center py-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-brand-100">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Rwanda · {new Date().getFullYear()} · v2.0
        </div>

        <h1 className="text-5xl font-extrabold text-gray-900 mb-5 leading-tight tracking-tight">
          Stop guessing.<br />
          <span className="text-brand-600">Start knowing.</span>
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          Hunch helps entrepreneurs across Rwanda find the right location
          for their restaurant — before signing a lease — using machine learning
          trained on real Google Places data.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => onNavigate('predict')}
            className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-sm">
            Check a location <ArrowRight size={16} />
          </button>
          <button onClick={() => onNavigate('data')}
            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
            View dataset
          </button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-4 mb-16">
        {[
          { value: '4,470+', label: 'Training records', sub: '470 real · 4,000 synthetic' },
          { value: '82.7%',  label: 'AUC-ROC accuracy', sub: 'Exceeds 80% target' },
          { value: '23',     label: 'Rwanda sectors',   sub: 'All 5 provinces covered' },
        ].map((s) => (
          <div key={s.label}
            className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
            <p className="text-3xl font-extrabold text-brand-600 mb-0.5">{s.value}</p>
            <p className="text-sm font-semibold text-gray-700">{s.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Feature grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-16">
        {features.map((f) => (
          <div key={f.title}
            className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
              {f.icon}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1.5">{f.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* ── How it works ── */}
      <div className="bg-brand-50 rounded-2xl p-8 mb-16">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-8">How Hunch works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Pick a location', desc: 'Select a sector and pin a spot on the map anywhere in Rwanda.' },
            { step: '02', title: 'Run the analysis', desc: 'Hunch scores 11 location features using a model trained on real restaurant data.' },
            { step: '03', title: 'Understand the result', desc: 'Get a 0–100 score, verdict, and a breakdown of exactly what drove it.' },
          ].map((h) => (
            <div key={h.step} className="text-center">
              <div className="w-10 h-10 bg-brand-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3">
                {h.step}
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{h.title}</h4>
              <p className="text-sm text-gray-500">{h.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Testimonial ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-16 text-center shadow-sm">
        <div className="flex justify-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
          ))}
        </div>
        <p className="text-gray-700 italic text-lg mb-4 max-w-xl mx-auto">
          "{testimonial.quote}"
        </p>
        <p className="text-sm text-gray-400">— {testimonial.author}</p>
      </div>

      {/* ── CTA footer ── */}
      <div className="text-center pb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to find your spot?</h2>
        <p className="text-gray-500 mb-6">No account needed. Free to use.</p>
        <button onClick={() => onNavigate('predict')}
          className="inline-flex items-center gap-2 px-8 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-sm">
          Check a location now <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
