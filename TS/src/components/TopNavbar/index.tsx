import useScrollEvent from '@/hooks/useScrollEvent'
import clsx from 'clsx'
import { useRef } from 'react'

import type { ChildrenType } from '@/types/component-props'

type TopbarProps = {
  className?: string
} & ChildrenType

const TopNavbar = ({ children, className }: TopbarProps) => {
  const { scrollY } = useScrollEvent()
  const headerRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <header ref={headerRef} className={clsx('navbar-light navbar-sticky header-static', className, { 'navbar-sticky-on': scrollY >= 400 })}>
        <nav className="navbar navbar-expand-xl">{children}</nav>
      </header>
      <div style={{ height: scrollY >= 200 ? `${headerRef.current?.offsetHeight}px` : 0 }} />
    </>
  )
}

export default TopNavbar
