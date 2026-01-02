import AppProvidersWrapper from './components/wrappers/AppProvidersWrapper'
import AppRouter from './routes/router'
import { useAuthContext } from '@/context/useAuthContext'
import { useEffect } from 'react'
import { setupFetchInterceptor } from '@/utils/setupFetchInterceptor'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import '@/assets/scss/style.scss'

// ✅ Only mock in development
if (import.meta.env.MODE === 'development') {
  console.log('development')
}

function App() {
  const { removeSession } = useAuthContext()

  useEffect(() => {
    setupFetchInterceptor(removeSession)
  }, [removeSession])

  return (
    <AppProvidersWrapper>
      <AppRouter />

      {/* ✅ Global Toast container (won’t push content down) */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        pauseOnHover
        draggable
        closeOnClick
        style={{ position: 'fixed' }} // 👈 container itself fixed, no extra space
        toastStyle={{
          width: '400px',
          fontSize: '0.95rem',
        }}
      />
    </AppProvidersWrapper>
  )
}

export default App
