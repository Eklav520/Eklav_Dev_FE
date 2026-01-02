import { useLayoutContext } from '@/context/useLayoutContext'

type Props = {
  onToggleSidebar?: () => void
}

const TopbarMenuToggler = ({ onToggleSidebar }: Props) => {
  const { appMenuControl } = useLayoutContext()

  const handleClick = () => {
    // existing behavior (top app menu)
    appMenuControl.toggle()

    // NEW: sidebar offcanvas (mobile)
    if (onToggleSidebar) {
      onToggleSidebar()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="navbar-toggler ms-auto"
      aria-expanded={appMenuControl.open}
      aria-label="Toggle navigation"
    >
      <span className="navbar-toggler-animation">
        <span />
        <span />
        <span />
      </span>
    </button>
  )
}

export default TopbarMenuToggler
