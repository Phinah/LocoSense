import { useState, useRef, useEffect } from 'react'
import { Send, Lightbulb, RotateCcw } from 'lucide-react'
import { advisorChat } from '../utils/api'

const STARTERS = [
  "I have RWF 5 million and want to start a business in Kigali — what should I open?",
  "I own land in Musanze. What business would work best there?",
  "I want to open a pharmacy somewhere in Rwanda — where has the biggest gap?",
  "I'm an investor with capital. Where in Rwanda gives the best business return?",
]

function Message({ role, content }) {
  const isUser = role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
        ${isUser ? 'bg-brand-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
        {isUser ? 'You' : <Lightbulb size={14}/>}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
        ${isUser
          ? 'bg-brand-600 text-white rounded-tr-sm'
          : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm shadow-sm'
        }`}>
        {content.split('\n').map((line, i) => (
          <p key={i} className={line === '' ? 'h-2' : ''}>{line}</p>
        ))}
      </div>
    </div>
  )
}

export default function AdvisorPage({ onNavigate }) {
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [started,  setStarted]  = useState(false)
  const [error,    setError]    = useState(null)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const userMsg = text || input.trim()
    if (!userMsg || loading) return
    setInput(''); setStarted(true); setError(null)
    const newMessages = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const data = await advisorChat(newMessages)
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch (e) {
      const msg = e.response?.data?.detail || 'Connection issue — is the backend running?'
      setError(msg)
      setMessages([...newMessages, { role: 'assistant', content: `Sorry — ${msg}` }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const reset = () => { setMessages([]); setStarted(false); setInput(''); setError(null) }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Lightbulb size={22} className="text-amber-500"/> Hunch AI Advisor
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Tell me your situation — I'll tell you what to open and where.
          </p>
        </div>
        {started && (
          <button onClick={reset}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg">
            <RotateCcw size={13}/> Start over
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {!started ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-6">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center">
              <Lightbulb size={32} className="text-amber-600"/>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">What business should you start?</h2>
              <p className="text-gray-500 text-sm max-w-md">
                Tell me your budget, skills, or location preference — I'll recommend the right business,
                sector, and give you an honest risk assessment.
              </p>
            </div>
            <div className="w-full max-w-lg space-y-2">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Common questions</p>
              {STARTERS.map((s, i) => (
                <button key={i} onClick={() => send(s)}
                  className="w-full text-left text-sm bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-brand-300 hover:bg-brand-50 transition-colors text-gray-600">
                  "{s}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => <Message key={i} role={m.role} content={m.content}/>)}
            {loading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Lightbulb size={14}/>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center h-5">
                    {[0,1,2].map((j) => (
                      <div key={j} className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"
                        style={{ animationDelay: `${j*150}ms` }}/>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </>
        )}
      </div>

      {started && (
        <div className="shrink-0 pt-3 border-t border-gray-100">
          {error && (
            <p className="text-xs text-red-500 mb-2 px-1">⚠ {error}</p>
          )}
          <div className="flex gap-2">
            <input ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask about any business opportunity in Rwanda…"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              className="bg-brand-600 text-white px-4 py-2.5 rounded-xl hover:bg-brand-700 disabled:opacity-40 transition-colors">
              <Send size={16}/>
            </button>
          </div>
          <p className="text-xs text-gray-300 text-center mt-2">Business advice only · Powered by Claude AI</p>
        </div>
      )}
    </div>
  )
}