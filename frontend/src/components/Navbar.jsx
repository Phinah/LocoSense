import { MapPin } from 'lucide-react'

const links = [
  { id: 'home',     label: 'Home'      },
  { id: 'predict',  label: 'Check a location' },
  { id: 'register', label: 'Register business' },
  { id: 'data',     label: 'Dataset'   },
]

export default function Navbar({ current, onNavigate }) {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 font-semibold text-brand-600 text-lg"
        >
          <MapPin size={20} />
          LocoSense AI
        </button>
        <div className="flex gap-1">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => onNavigate(l.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                current === l.id
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
