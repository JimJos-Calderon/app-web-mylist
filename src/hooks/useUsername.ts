import { useState, useEffect } from 'react'
import { supabase } from '@/supabaseClient'

export const useUsername = (userId: string) => {
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsername = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('user_id', userId)
          .maybeSingle()

        if (error) {
          console.error('Error fetching username:', error)
          setUsername(null)
        } else {
          setUsername(data?.username || null)
        }
      } catch (err) {
        console.error('Error:', err)
        setUsername(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUsername()
  }, [userId])

  return { username, loading }
}
