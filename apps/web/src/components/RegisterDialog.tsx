import { Dialog, Button, Label, Input } from './ui'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '../lib/api'
import { toast } from 'sonner'
import type { EventItem } from './EventCard'

const schema = z.object({
  partnerId: z.string().optional(),
  coursePreference: z.enum(['starter', 'main', 'dessert']).optional(),
})

export default function RegisterDialog({ open, onOpenChange, event }: { open: boolean; onOpenChange: (v: boolean) => void; event: EventItem }) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
  const onSubmit = handleSubmit(async (values) => {
    try {
      await api('/api/events/register', {
        method: 'POST',
        body: JSON.stringify({
          eventId: event.id,
          partnerId: values.partnerId ? Number(values.partnerId) : undefined,
          coursePreference: values.coursePreference,
        })
      })
      toast.success('Registered! We will email you details.')
      onOpenChange(false)
      reset()
    } catch (e: any) {
      toast.error(e?.message || 'Registration failed')
    }
  })
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="card p-6">
        <Dialog.Title className="text-lg font-semibold">Register for {event.title}</Dialog.Title>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <Label>Partner user ID (optional)</Label>
            <Input placeholder="Enter partner's user ID" {...register('partnerId')} />
          </div>
          <div>
            <Label>Course preference</Label>
            <select className="input" {...register('coursePreference')}>
              <option value="">No preference</option>
              <option value="starter">Starter</option>
              <option value="main">Main</option>
              <option value="dessert">Dessert</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={isSubmitting} type="submit">Confirm</Button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  )
}


