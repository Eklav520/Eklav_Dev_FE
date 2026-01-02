// hooks/useProfile.ts
import { useEffect, useState } from "react"
import axios from "axios"
import { useAuthContext } from "@/context/useAuthContext"

export const useProfile = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.token) return

    axios
      .get(`${baseURL}/profile`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      .then((res) => setProfile(res.data))
      .finally(() => setLoading(false))
  }, [user])

  return { profile, loading }
}
