import { useEffect, useMemo, useState } from 'react'

import { INSTITUTEADMIN_MENU_ITEMS, FACULTY_ADMIN_MENU_ITEMS } from '@/assets/data/menu-items'
import { useAuthContext } from '@/context/useAuthContext'
import { ChildrenType } from '@/types/component-props'
import AdminShell, { type MenuItemTypeLocal } from './AdminShell'

// Keys that are controlled by admin nav config — items NOT in this set always show
const KNOWN_ADMIN_KEYS = new Set([
  'dashboard', 'courses', 'students', 'onlineClasses', 'freelencing',
  'jobOpenings', 'placements', 'collegeAssessment', 'finalAssessment',
  'instituteAnnouncements', 'facultyAdmin', 'profile',
])

// Backward compat: map old/wrong keys to correct menu item keys
const LEGACY_KEY_MAP: Record<string, string> = {
  'achievements': 'instituteAnnouncements',
  'editProfile':  'profile',
}

/* Institute + faculty admin layout: the shared AdminShell with the institute menu,
   filtered by the tenant's nav config on institute subdomains. */
const InstituteAdminLayout = ({ children }: ChildrenType) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const isFaculty = user?.role === 'facultyAdmin'

  const [allowedAdminKeys, setAllowedAdminKeys] = useState<string[] | null>(null)

  useEffect(() => {
    const hostname = window.location.hostname.split(':')[0].toLowerCase()
    const isMainDomain = hostname === 'localhost' || hostname === 'eklav.in' || hostname === 'www.eklav.in'
    if (isMainDomain) return
    fetch(`${baseURL}/api/institute/nav-config-by-domain`, {
      headers: { 'x-tenant-domain': hostname },
      cache: 'no-store',
    })
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.adminNavSections) && d.adminNavSections.length > 0) {
          setAllowedAdminKeys(d.adminNavSections)
        }
      })
      .catch(() => {})
  }, [baseURL])

  const items: MenuItemTypeLocal[] = useMemo(() => {
    const all = (isFaculty ? FACULTY_ADMIN_MENU_ITEMS : INSTITUTEADMIN_MENU_ITEMS) as unknown as MenuItemTypeLocal[]
    if (!allowedAdminKeys) return all
    // Normalize saved keys (handle legacy key names)
    const normalizedKeys = allowedAdminKeys.map(k => LEGACY_KEY_MAP[k] ?? k)
    // Always include 'dashboard' and 'profile' even if missing from config
    if (!normalizedKeys.includes('dashboard')) normalizedKeys.push('dashboard')
    if (!normalizedKeys.includes('profile')) normalizedKeys.push('profile')
    return all.filter(item => !KNOWN_ADMIN_KEYS.has(item.key) || normalizedKeys.includes(item.key))
  }, [isFaculty, allowedAdminKeys])

  return (
    <AdminShell
      items={items}
      portalLabel={isFaculty ? 'Faculty Admin' : 'Institute Admin'}
      homeUrl={isFaculty ? '/faculty-admin/dashboard' : '/institute/dashboard'}
      profileUrl={isFaculty ? undefined : '/institute/edit-profile'}
      showPoweredBy
    >
      {children}
    </AdminShell>
  )
}

export default InstituteAdminLayout
