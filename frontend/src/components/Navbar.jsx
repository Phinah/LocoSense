import { Lightbulb, Menu, X } from 'lucide-react'
import { useState } from 'react'

const links = [
  { id: 'home',     label: 'Home'           },
  { id: 'predict',  label: 'Check location' },
  { id: 'register', label: 'Register'       },
  { id: 'recommend', label: 'Find location'  }, // ← was advisor
  { id: 'investor', label: 'Investor'       },
  { id: 'data',     label: 'Dataset'        },
]

export default function Navbar({ current, onNavigate }) {
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <button onClick={() => onNavigate('home')}
          className="flex items-center gap-2 font-bold text-gray-900 text-lg">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Lightbulb size={18} className="text-white" />
          </div>
          Hunch
          <span className="text-xs font-normal text-gray-400 hidden sm:inline ml-1">Rwanda</span>
        </button>

        <div className="hidden sm:flex gap-1">
          {links.map((l) => (
            <button key={l.id} onClick={() => onNavigate(l.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                current === l.id
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}>
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate('recommend')}
          className="hidden sm:block text-sm font-medium bg-brand-600 text-white px-4 py-1.5 rounded-lg hover:bg-brand-700 transition-colors">
          Find my location →
        </button>
          <button className="sm:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {links.map((l) => (
            <button key={l.id} onClick={() => { onNavigate(l.id); setOpen(false) }}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                current === l.id ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  )
}