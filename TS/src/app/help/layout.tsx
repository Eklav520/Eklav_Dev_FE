import { ChildrenType } from '@/types/component-props'
import Footer from './components/Footer'
import TopNavigationBar from './components/TopNavigationBar'

const layout = ({ children }: ChildrenType) => {
  return (
    <>
      <TopNavigationBar />
      {children}
      <Footer className="pt-5 bg-light" />
    </>
  )
}

export default layout
