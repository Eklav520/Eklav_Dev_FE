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
  college?: string

  role: string
  status?: 'pending' | 'approved' | 'rejected'

  token: string
}
