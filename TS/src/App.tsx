import AppProvidersWrapper from './components/wrappers/AppProvidersWrapper'
import AppRouter from './routes/router'
import { useAuthContext } from '@/context/useAuthContext'
import { useEffect, useState } from 'react'
import { setupFetchInterceptor } from '@/utils/setupFetchInterceptor'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useActivityTracker } from '@/hooks/useActivityTracker'
import IdleWarningModal from '@/components/IdleWarningModal'
import SessionExpiredModal from '@/components/SessionExpiredModal'

import '@/assets/scss/style.scss'

if (import.meta.env.MODE === 'development') {
  console.log('development')
}

const SPLASH_LETTERS = [
  { char: 'E', delay: 0.0,  orange: true  },
  { char: 'K', delay: 0.18, orange: true  },
  { char: 'L', delay: 0.36, orange: false },
  { char: 'A', delay: 0.54, orange: false },
  { char: 'V', delay: 0.72, orange: false },
]

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [out, setOut] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setOut(true), 3200)
    const t2 = setTimeout(() => onDone(), 3800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap');

        @keyframes sp-jump {
          0%   { transform: translateY(-300px) scaleX(1)    scaleY(1);
                 opacity: 0; animation-timing-function: ease-in; }
          5%   { opacity: 1; }
          28%  { transform: translateY(0)      scaleX(1.4)  scaleY(0.62);
                 animation-timing-function: ease-out; }
          40%  { transform: translateY(-100px) scaleX(0.86) scaleY(1.14);
                 animation-timing-function: ease-in; }
          54%  { transform: translateY(0)      scaleX(1.2)  scaleY(0.82);
                 animation-timing-function: ease-out; }
          63%  { transform: translateY(-40px)  scaleX(0.93) scaleY(1.07);
                 animation-timing-function: ease-in; }
          73%  { transform: translateY(0)      scaleX(1.09) scaleY(0.92);
                 animation-timing-function: ease-out; }
          80%  { transform: translateY(-14px)  scaleX(0.97) scaleY(1.03);
                 animation-timing-function: ease-in; }
          88%  { transform: translateY(0)      scaleX(1.03) scaleY(0.97); }
          94%  { transform: translateY(-4px); }
          100% { transform: translateY(0)      scaleX(1)    scaleY(1);    opacity: 1; }
        }

        @keyframes sp-line {
          0%   { width: 0; opacity: 0; }
          100% { width: 160px; opacity: 1; }
        }
        @keyframes sp-tag {
          0%   { opacity: 0; letter-spacing: 10px; }
          100% { opacity: 1; letter-spacing: 5px; }
        }
        @keyframes sp-out {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }

        .sp-wrap {
          position: fixed; inset: 0; z-index: 99999;
          background: #04040e;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
        }
        .sp-wrap.sp-out { animation: sp-out 0.6s ease forwards; }

        .sp-letters { display: flex; align-items: baseline; gap: 0.05em; }

        .sp-letter {
          font-size: clamp(42px, 7vw, 70px);
          font-weight: 900;
          font-family: 'Orbitron', sans-serif;
          display: inline-block;
          opacity: 0;
          animation: sp-jump 1.1s linear both;
        }
        .sp-letter.sp-orange {
          color: #ff6b00;
          text-shadow: 0 0 36px rgba(255,107,0,0.55), 0 0 80px rgba(255,107,0,0.18);
        }
        .sp-letter.sp-white { color: #ffffff; }

        .sp-line {
          height: 1px; width: 0; margin-top: 16px;
          background: linear-gradient(90deg, transparent, rgba(255,107,0,0.65), transparent);
          animation: sp-line 0.5s ease 1.55s forwards;
        }
        .sp-tagline {
          font-size: 0.58rem;
          font-family: 'Orbitron', sans-serif;
          color: rgba(255,255,255,0.32);
          text-transform: uppercase;
          letter-spacing: 10px;
          margin-top: 12px;
          opacity: 0;
          animation: sp-tag 0.65s ease 1.75s forwards;
        }
      `}</style>

      <div className={`sp-wrap${out ? ' sp-out' : ''}`}>
        <div className="sp-letters">
          {SPLASH_LETTERS.map(({ char, delay, orange }) => (
            <span
              key={char}
              className={`sp-letter ${orange ? 'sp-orange' : 'sp-white'}`}
              style={{ animationDelay: `${delay}s` }}
            >
              {char}
            </span>
          ))}
        </div>
        <div className="sp-line" />
        <div className="sp-tagline">Learn &nbsp;·&nbsp; Grow &nbsp;·&nbsp; Succeed</div>
      </div>
    </>
  )
}

function AppInner() {
  const { user, removeSession } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [idleVisible, setIdleVisible] = useState(false)
  const [sessionExpired, setSessionExpired] = useState<{ show: boolean; message: string }>({ show: false, message: '' })

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

  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent<{ message: string }>).detail?.message || 'Your session has expired. Please log in again.'
      setSessionExpired({ show: true, message: msg })
    }
    window.addEventListener('session-expired', handler)
    return () => window.removeEventListener('session-expired', handler)
  }, [])

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

      <SessionExpiredModal
        show={sessionExpired.show}
        message={sessionExpired.message}
        onOk={() => { setSessionExpired({ show: false, message: '' }); removeSession() }}
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
