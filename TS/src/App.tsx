import AppProvidersWrapper from './components/wrappers/AppProvidersWrapper'
import AppRouter from './routes/router'
import { useAuthContext } from '@/context/useAuthContext'
import { useEffect, useState } from 'react'
import { setupFetchInterceptor } from '@/utils/setupFetchInterceptor'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useActivityTracker } from '@/hooks/useActivityTracker'
import IdleWarningModal from '@/components/IdleWarningModal'
import logoWhite from '@/assets/images/logo_white.png'

import '@/assets/scss/style.scss'

if (import.meta.env.MODE === 'development') {
  console.log('development')
}

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 600)
    const t2 = setTimeout(() => setPhase('out'), 2400)
    const t3 = setTimeout(() => onDone(), 3000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <>
      <style>{`
        @keyframes sp-logo-in {
          0%   { opacity: 0; transform: translateY(16px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes sp-tag-in {
          0%   { opacity: 0; letter-spacing: 6px; }
          100% { opacity: 1; letter-spacing: 3.5px; }
        }
        @keyframes sp-fade-out {
          0%   { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }
        @keyframes sp-dot-blink {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
          40%            { opacity: 1;    transform: scale(1.1); }
        }
        .sp-wrap {
          position: fixed; inset: 0; z-index: 99999;
          background: #050505;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 1.4rem;
        }
        .sp-wrap.sp-out {
          animation: sp-fade-out 0.65s ease forwards;
        }
        .sp-logo {
          width: 320px;
          opacity: 0;
          animation: sp-logo-in 0.7s cubic-bezier(0.22,1,0.36,1) 0.15s forwards;
        }
        .sp-divider {
          width: 120px; height: 1px;
          background: linear-gradient(90deg, transparent, #2a2a2a, transparent);
          opacity: 0;
          animation: sp-logo-in 0.5s ease 0.6s forwards;
        }
        .sp-tagline {
          font-family: sans-serif;
          font-size: 1rem;
          color: #666;
          letter-spacing: 5px;
          opacity: 0;
          animation: sp-tag-in 0.7s ease 0.75s forwards;
        }
        .sp-dots {
          display: flex; gap: 6px; margin-top: 2.5rem;
          opacity: 0;
          animation: sp-logo-in 0.4s ease 1s forwards;
        }
        .sp-dot {
          width: 5px; height: 5px; border-radius: 50%; background: #333;
          animation: sp-dot-blink 1.2s ease-in-out infinite;
        }
        .sp-dot:nth-child(2) { animation-delay: 0.2s; }
        .sp-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>
      <div className={`sp-wrap${phase === 'out' ? ' sp-out' : ''}`}>
        <img src={logoWhite} alt="Eklav" className="sp-logo" />
        <div className="sp-divider" />
        <span className="sp-tagline" style={{ marginLeft: '-18px' }}>Learn &nbsp;·&nbsp; Grow &nbsp;·&nbsp; Succeed</span>
        <div className="sp-dots">
          <div className="sp-dot" />
          <div className="sp-dot" />
          <div className="sp-dot" />
        </div>
      </div>
    </>
  )
}

function AppInner() {
  const { user, removeSession } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [idleVisible, setIdleVisible] = useState(false)

  const { resumeSession } = useActivityTracker({
    token:    user?.token,
    baseURL,
    onIdle:        () => setIdleVisible(true),
    onAutoLogout:  () => { setIdleVisible(false); removeSession() },
    onResume:      () => setIdleVisible(false),
  })

  useEffect(() => {
    setupFetchInterceptor(removeSession)
  }, [removeSession])

  return (
    <>
      <AppRouter />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        pauseOnHover
        draggable
        closeOnClick
        style={{ position: 'fixed' }}
        toastStyle={{ width: '400px', fontSize: '0.95rem' }}
      />

      <IdleWarningModal
        show={idleVisible}
        onStay={() => resumeSession()}
        onLogout={() => { setIdleVisible(false); removeSession() }}
        autoLogoutSeconds={120}
      />
    </>
  )
}

function App() {
  const [splashDone, setSplashDone] = useState(false)

  return (
    <AppProvidersWrapper>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      <AppInner />
    </AppProvidersWrapper>
  )
}

export default App
