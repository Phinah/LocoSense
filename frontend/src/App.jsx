import { useState } from 'react'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import PredictPage from './pages/PredictPage'
import RegisterPage from './pages/RegisterPage'
import DataPage from './pages/DataPage'

export default function App() {
  const [page, setPage] = useState('home')

  const pages = {
    home:     <HomePage     onNavigate={setPage} />,
    predict:  <PredictPage  onNavigate={setPage} />,
    register: <RegisterPage onNavigate={setPage} />,
    data:     <DataPage     onNavigate={setPage} />,
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar current={page} onNavigate={setPage} />
      <main className="flex-1">
        {pages[page] || pages.home}
      </main>
      <footer className="border-t border-gray-200 py-4 text-center text-sm text-gray-400">
        LocoSense AI · Kigali Business Location Intelligence 
      </footer>
    </div>
  )
}
