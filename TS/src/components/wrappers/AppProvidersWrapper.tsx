import type { ChildrenType } from '@/types/component-props'
import { Suspense, useEffect } from 'react'
import FallbackLoading from '../FallbackLoading'
import Aos from 'aos'
import { NotificationProvider } from '@/context/useNotificationContext'
import { LayoutProvider } from '@/context/useLayoutContext'
import { AuthProvider } from '@/context/useAuthContext'
// import { HelmetProvider } from 'react-helmet-async'

const AppProvidersWrapper = ({ children }: ChildrenType) => {
  useEffect(() => {
    Aos.init()
    if (document) {
      const e = document.querySelector<HTMLDivElement>('#__next_splash')
      if (e?.hasChildNodes()) {
        document.querySelector('#splash-screen')?.classList.add('remove')
      }
      e?.addEventListener('DOMNodeInserted', () => {
        document.querySelector('#splash-screen')?.classList.add('remove')
      })
    }
  }, [])

  return (
    // <HelmetProvider>
      <LayoutProvider>
        <AuthProvider>
          <NotificationProvider>
            <Suspense fallback={<FallbackLoading />}>{children}</Suspense>
          </NotificationProvider>
        </AuthProvider>
      </LayoutProvider>
    // </HelmetProvider>
  )
}
export default AppProvidersWrapper
