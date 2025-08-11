import { Button } from './ui'
import { useAuth } from '../auth/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export default function ProfileCompletionBanner() {
  const { user } = useAuth()
  
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api<any>('/api/profile'),
    enabled: !!user,
  })

  if (!user || !profile) return null

  // Check if profile is incomplete (missing key fields)
  const isIncomplete = !profile.name || !profile.interests?.length || !profile.personalityType

  if (!isIncomplete) return null

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-primary">Complete your profile</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Add your details to get better matches and improve your experience.
          </p>
        </div>
        <Button onClick={() => location.href = '/profile'}>
          Complete Profile
        </Button>
      </div>
    </div>
  )
}
