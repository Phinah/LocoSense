import { useState } from 'react'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import PredictPage from './pages/PredictPage'
import RegisterPage from './pages/RegisterPage'
import DataPage from './pages/DataPage'
import AdvisorPage from './pages/AdvisorPage'
import InvestorPage from './pages/InvestorPage'
import RecommendPage from './pages/RecommendPage'
import { Lightbulb } from 'lucide-react'
import PrivacyPage from './pages/PrivacyPage'


export default function App() {
  const [page, setPage] = useState('home')

  const pages = {
    home: <HomePage onNavigate={setPage} />,
    register: <RegisterPage onNavigate={setPage} />,
    predict: <PredictPage onNavigate={setPage} />,
    advisor: <AdvisorPage onNavigate={setPage} />,
    investor: <InvestorPage onNavigate={setPage} />,
    register: <RegisterPage onNavigate={setPage} />,
    data: <DataPage onNavigate={setPage} />,
    recommend: <RecommendPage onNavigate={setPage} />,
    privacy:  <PrivacyPage />, 
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
          Rwanda Business Location Intelligence · ALU Capstone 2026
        </p>

        <div className="flex items-center gap-4">
          <p className="text-xs text-gray-300">Powered by Random Forest · Google Places · OpenStreetMap</p>
          <button
            onClick={() => setPage('privacy')}
            className="text-xs text-gray-400 hover:text-brand-600 underline transition-colors">
            Privacy & Legal
          </button>
        </div>

      </div>
    </footer>
    </div>
  )
}