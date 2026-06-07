import { MapPin, TrendingUp, Database, Cpu } from 'lucide-react'

const features = [
  {
    icon: <MapPin size={24} className="text-brand-500" />,
    title: 'Location scoring',
    desc: 'Get a 0–100 suitability score for any location in Kigali based on 7 real-world indicators.',
  },
  {
    icon: <Cpu size={24} className="text-brand-500" />,
    title: 'ML-powered',
    desc: 'XGBoost model trained on 1,500 Kigali restaurant records with 80%+ AUC-ROC accuracy.',
  },
  {
    icon: <TrendingUp size={24} className="text-brand-500" />,
    title: 'Explainable AI',
    desc: 'See exactly which factors — foot traffic, competitors, income level — drove your score.',
  },
  {
    icon: <Database size={24} className="text-brand-500" />,
    title: 'Growing dataset',
    desc: 'Register your business to contribute to the dataset and improve recommendations for everyone.',
  },
]

export default function HomePage({ onNavigate }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-600 text-sm font-medium px-3 py-1 rounded-full mb-6">
          <MapPin size={14} /> Kigali, Rwanda · MVP v0.1
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Stop guessing. Start knowing.
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
          LocoSense AI tells entrepreneurs in Kigali which locations are most likely
          to support a successful restaurant — before they sign a lease.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => onNavigate('predict')}
            className="px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            Check a location →
          </button>
          <button
            onClick={() => onNavigate('register')}
            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Register my business
          </button>
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
        {features.map((f) => (
          <div key={f.title} className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="mb-3">{f.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Stats strip */}
      <div className="bg-brand-50 rounded-xl p-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-brand-600">1,500+</p>
          <p className="text-sm text-gray-500">Training records</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-brand-600">7</p>
          <p className="text-sm text-gray-500">Location features</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-brand-600">≥80%</p>
          <p className="text-sm text-gray-500">Target AUC-ROC</p>
        </div>
      </div>
    </div>
  )
}
