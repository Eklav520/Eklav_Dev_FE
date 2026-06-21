export type UserType = {
  id?: string
  userId?: string
  fullName?: string
  firstName?: string
  lastName?: string
  username?: string

  email: string
  phoneNo?: string

  profileImage?: string

  joiningYear?: string
  department?: string
  branch?: string
  college?: string

  role: string
  status?: 'pending' | 'approved' | 'rejected'

  instituteId?: string | null

  token: string
}
