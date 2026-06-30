import { useState } from 'react'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import PredictPage from './pages/PredictPage'
import RegisterPage from './pages/RegisterPage'
import DataPage from './pages/DataPage'
import { Lightbulb } from 'lucide-react'

export default function App() {
  const [page, setPage] = useState('home')

  const pages = {
    home:     <HomePage     onNavigate={setPage} />,
    predict:  <PredictPage  onNavigate={setPage} />,
    register: <RegisterPage onNavigate={setPage} />,
    data:     <DataPage     onNavigate={setPage} />,
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar current={page} onNavigate={setPage} />
      <main className="flex-1">
        {pages[page] || pages.home}
      </main>
      <footer className="border-t border-gray-100 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-gray-700 font-semibold">
            <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
              <Lightbulb size={13} className="text-white" />
            </div>
            Hunch
          </div>
          <p className="text-sm text-gray-400 text-center">
            Rwanda Business Location Intelligence · ALU Capstone {new Date().getFullYear()}
          </p>
          <p className="text-xs text-gray-300">Powered by Random Forest + Google Places</p>
        </div>
      </footer>
    </div>
  )
}
