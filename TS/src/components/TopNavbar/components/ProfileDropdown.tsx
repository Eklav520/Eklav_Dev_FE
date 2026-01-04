import { useLayoutContext } from '@/context/useLayoutContext'
import type { LayoutState } from '@/types/context'

import { useEffect, useState, type ReactNode } from 'react'
import {
  Dropdown,
  DropdownDivider,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
} from 'react-bootstrap'
import {
  BsInfoCircle,
  BsPerson,
  BsPower,
  BsStar,
  BsStarFill,
  BsStarHalf,
} from 'react-icons/bs'

import { toSentenceCase } from '@/utils/change-casing'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { useAuthContext } from '@/context/useAuthContext'

const ProfileDropdown = ({ className }: { className: string }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { changeTheme, theme } = useLayoutContext()
  const { user, removeSession } = useAuthContext()
  const token = user?.token

  const [name, setName] = useState('Guest')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [totalRatings, setTotalRatings] = useState(0)

  // ✅ Neutral professional initials avatar
  const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    name || 'User'
  )}`

  type ThemeModeType = {
    theme: LayoutState['theme']
    icon: ReactNode
  }

  const themeModes: ThemeModeType[] = [
    {
      theme: 'light',
      icon: (
        <svg width={16} height={16} fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
        </svg>
      ),
    },
    {
      theme: 'dark',
      icon: (
        <svg width={16} height={16} fill="currentColor" viewBox="0 0 16 16">
          <path d="M6 .278a.768.768 0 0 1 .08.858A7.2 7.2 0 0 0 5.2 4.5c0 4 3.3 7.3 7.3 7.3.5 0 1-.05 1.5-.15a.75.75 0 0 1 .78.31A8.3 8.3 0 0 1 8.3 16C3.7 16 0 12.3 0 7.7 0 4.3 2.1 1.3 5.1.06a.75.75 0 0 1 .9.22z" />
        </svg>
      ),
    },
    {
      theme: 'auto',
      icon: (
        <svg width={16} height={16} fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 0 8 1v14z" />
        </svg>
      ),
    },
  ]

  const calculateAverageRating = (feedback: any[]) => {
    const ratings = feedback
      .filter((f) => typeof f.rating === 'number')
      .map((f) => f.rating)

    if (!ratings.length) return 0
    return Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
  }

  const renderStars = (value: number) => {
    const stars = []
    const full = Math.floor(value)
    const half = value % 1 >= 0.5

    for (let i = 0; i < full; i++)
      stars.push(<BsStarFill key={i} size={12} className="text-warning" />)

    if (half)
      stars.push(<BsStarHalf key="half" size={12} className="text-warning" />)

    while (stars.length < 5)
      stars.push(
        <BsStar key={`e-${stars.length}`} size={12} className="text-warning" />
      )

    return stars
  }

  useEffect(() => {
    if (theme !== 'dark') changeTheme('dark')
    if (!token) return

    fetch(`${baseURL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((profile) => {
        setName(profile.fullName || 'Guest')
        setEmail(profile.email || '')

        if (profile.profileImage) {
          let path = profile.profileImage.replace(/\\/g, '/')
          if (path.startsWith('/')) path = path.substring(1)
          if (!path.startsWith('uploads/')) path = `uploads/${path}`
          setAvatarUrl(`${baseURL}/${path}`)
        } else {
          setAvatarUrl(null)
        }

        if (Array.isArray(profile.feedback)) {
          setRating(calculateAverageRating(profile.feedback))
          setTotalRatings(profile.feedback.filter((f: any) => f.rating).length)
        }
      })
      .catch(console.error)
  }, [token])

  return (
    <Dropdown drop="start" className={className}>
      <DropdownToggle
        as="a"
        className="avatar avatar-sm p-0 arrow-none"
        id="profileDropdown"
        role="button"
      >
        <img
          className="avatar-img rounded-circle"
          src={avatarUrl ?? fallbackUrl}
          alt={`${name} avatar`}
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = fallbackUrl
          }}
        />
      </DropdownToggle>

      <DropdownMenu className="dropdown-menu-end shadow pt-3">
        <li className="px-3 mb-3">
          <div className="d-flex align-items-center">
            <div className="avatar me-3">
              <img
                className="avatar-img rounded-circle shadow"
                src={avatarUrl ?? fallbackUrl}
                alt={`${name} avatar`}
              />
            </div>
            <div>
              <h6 className="mb-0">{name}</h6>
              <small className="text-muted">{email}</small>

              {totalRatings > 0 && (
                <div className="d-flex align-items-center mt-1">
                  {renderStars(rating)}
                  <small className="ms-1 text-muted">{rating}</small>
                </div>
              )}
            </div>
          </div>
        </li>

        <DropdownDivider />

        <DropdownItem as={Link} to="/student/edit-profile">
          <BsPerson className="me-2" /> Edit Profile
        </DropdownItem>

        <DropdownItem as={Link} to="/help/center">
          <BsInfoCircle className="me-2" /> Help
        </DropdownItem>

        <DropdownItem onClick={removeSession} className="text-danger">
          <BsPower className="me-2" /> Sign Out
        </DropdownItem>

        <DropdownDivider />

        <li className="px-2">
          <div className="bg-light dark-mode-switch d-flex p-1 rounded">
            {themeModes.map((m) => (
              <button
                key={m.theme}
                onClick={() => changeTheme(m.theme)}
                className={clsx('btn btn-sm', { active: theme === m.theme })}
              >
                {m.icon} {toSentenceCase(m.theme)}
              </button>
            ))}
          </div>
        </li>
      </DropdownMenu>
    </Dropdown>
  )
}

export default ProfileDropdown
