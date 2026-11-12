// InstructorLayout.tsx — Eklav admin (and tutor) area
import { useMemo } from 'react'

import { EKLAVADMIN_MENU_ITEMS } from '@/assets/data/menu-items'
import { useAuthContext } from '@/context/useAuthContext'
import { ChildrenType } from '@/types/component-props'
import AdminShell, { type MenuItemTypeLocal } from './AdminShell'

const COLLEGE_ADMIN_KEYS = ['dashboard', 'students', 'ticketManagement']

/* Same shell as the institute admin layout (sidebar + top bar), with the Eklav admin menu. */
const InstructorLayout = ({ children }: ChildrenType) => {
  const { user } = useAuthContext()
  const role = user?.role

  const items: MenuItemTypeLocal[] = useMemo(() => {
    const all = EKLAVADMIN_MENU_ITEMS as unknown as MenuItemTypeLocal[]
    if (role !== 'collegeAdmin') return all
    // College admins only get these pages, pulled out of their groups as plain links
    const flat = all.flatMap((item) => [item, ...((item as any).children || [])]) as MenuItemTypeLocal[]
    return COLLEGE_ADMIN_KEYS.map((key) => flat.find((item) => item.key === key)).filter(Boolean) as MenuItemTypeLocal[]
  }, [role])

  return (
    <AdminShell
      items={items}
      portalLabel={role === 'tutor' ? 'Tutor' : 'Eklav Admin'}
      homeUrl="/eklavadmin/dashboard"
      // profileUrl="/eklavadmin/edit-profile"  (Edit Profile is parked for later)
    >
      {children}
    </AdminShell>
  )
}

export default InstructorLayout
