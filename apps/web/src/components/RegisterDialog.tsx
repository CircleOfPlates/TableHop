import { Dialog, Button, Label } from './ui'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '../lib/api'
import { toast } from 'sonner'
import type { EventItem } from './EventCard'
import { useState } from 'react'
import { Search } from 'lucide-react'

interface User {
  id: number
  username: string
  name: string
  email: string
}

const schema = z.object({
  coursePreference: z.enum(['starter', 'main', 'dessert']).optional(),
  isHost: z.boolean(),
  partnerId: z.number().optional(),
})

export default function RegisterDialog({ open, onOpenChange, event }: { open: boolean; onOpenChange: (v: boolean) => void; event: EventItem }) {
  const [partnerSearch, setPartnerSearch] = useState('')
  const [showPartnerDropdown, setShowPartnerDropdown] = useState(false)
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  
  const { register, handleSubmit, reset, formState: { isSubmitting }, setValue } = useForm<z.infer<typeof schema>>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      isHost: false,
    }
  })
  
  const handlePartnerSearch = async (searchTerm: string) => {
    setPartnerSearch(searchTerm)
    
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      setFilteredUsers([])
      setShowPartnerDropdown(false)
      return
    }

    try {
      const response = await api<User[]>(`/api/events/partners/search?q=${encodeURIComponent(searchTerm.trim())}`)
      setFilteredUsers(response)
      setShowPartnerDropdown(response.length > 0)
    } catch (error) {
      console.error('Partner search error:', error)
      setFilteredUsers([])
      setShowPartnerDropdown(false)
    }
  }

  const selectPartner = (user: User) => {
    setValue('partnerId', user.id)
    setPartnerSearch(user.name)
    setShowPartnerDropdown(false)
  }
  
  const onSubmit = handleSubmit(async (values) => {
    try {
      // Validate partner requirements for rotating dinners
      if (event.format === 'rotating') {
        if (!values.coursePreference) {
          toast.error('Course preference is required for rotating dinners')
          return
        }
        if (!values.partnerId) {
          toast.error('Partner is required for rotating dinners')
          return
        }
      }
      
      await api(`/api/events/${event.id}/join`, {
        method: 'POST',
        body: JSON.stringify({
          eventId: event.id,
          coursePreference: values.coursePreference,
          isHost: values.isHost,
          partnerId: values.partnerId,
        })
      })
      toast.success('Registered! We will email you details.')
      onOpenChange(false)
      reset()
      setPartnerSearch('')
      setFilteredUsers([])
    } catch (e: any) {
      toast.error(e?.message || 'Registration failed')
    }
  })
  
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="card p-4 sm:p-6 max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <Dialog.Title className="text-lg font-semibold break-words">Register for {event.title}</Dialog.Title>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          
          {/* Course Preference - Only for rotating dinners */}
          {event.format === 'rotating' && (
            <div>
              <Label>
                Course Preference (Required)
              </Label>
              <select className="input w-full" {...register('coursePreference')}>
                <option value="">Select course preference</option>
                <option value="starter">Starter</option>
                <option value="main">Main</option>
                <option value="dessert">Dessert</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Note: Course preference is not guaranteed and will be assigned by the system
              </p>
            </div>
          )}
          
          {/* Partner Registration */}
          <div>
            <Label>
              Partner {event.format === 'rotating' ? '(Required)' : '(Optional)'}
            </Label>
            
            <div className="relative mt-2">
              <div className="flex items-center border rounded-md">
                <Search className="w-4 h-4 text-muted-foreground ml-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Search for a partner by name..."
                  value={partnerSearch}
                  onChange={(e) => handlePartnerSearch(e.target.value)}
                  onFocus={() => setShowPartnerDropdown(true)}
                  className="flex-1 px-3 py-2 outline-none min-w-0"
                />
              </div>
              
              {/* Partner Dropdown */}
              {showPartnerDropdown && filteredUsers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => selectPartner(user)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100"
                    >
                      <div className="font-medium truncate">{user.name}</div>
                      <div className="text-sm text-muted-foreground truncate">@{user.username}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {event.format === 'hosted' && (
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Bring a partner to share the experience
              </p>
            )}
          </div>
          
          {/* Host Registration */}
          <div>
            <Label className="flex items-center gap-2">
              <input type="checkbox" {...register('isHost')} />
              <span>Register as host</span>
            </Label>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                onOpenChange(false)
                setPartnerSearch('')
                setFilteredUsers([])
              }}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit" className="flex-1 sm:flex-none">Confirm</Button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  )
}


