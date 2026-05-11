import AppProvidersWrapper from './components/wrappers/AppProvidersWrapper'
import AppRouter from './routes/router'
import { useAuthContext } from '@/context/useAuthContext'
import { useEffect, useState } from 'react'
import { setupFetchInterceptor } from '@/utils/setupFetchInterceptor'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useActivityTracker } from '@/hooks/useActivityTracker'
import IdleWarningModal from '@/components/IdleWarningModal'

import '@/assets/scss/style.scss'

if (import.meta.env.MODE === 'development') {
  console.log('development')
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
  return (
    <AppProvidersWrapper>
      <AppInner />
    </AppProvidersWrapper>
  )
}

export default App
