import { Tabs, Card, Input, Label, Button } from '../components/ui'
import PageHeader from '../components/PageHeader'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '../lib/api'
import { toast } from 'sonner'

const detailsSchema = z.object({
  name: z.string().min(2).max(200),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
})
const prefsSchema = z.object({
  dietaryRestrictions: z.string().optional(),
  interests: z.string().optional(),
  personalityType: z.enum(['extrovert', 'introvert', 'ambivert']).optional(),
  preferredGroupSize: z.enum(['small', 'medium', 'large']).optional(),
})

export default function Profile() {
  const detailsForm = useForm<z.infer<typeof detailsSchema>>({ resolver: zodResolver(detailsSchema) })
  const prefsForm = useForm<z.infer<typeof prefsSchema>>({ resolver: zodResolver(prefsSchema) })

  async function load() {
    try {
      const data = await api<any>('/api/profile')
      detailsForm.reset({ name: data.name ?? '', phone: data.phone ?? '', address: data.address ?? '', bio: data.bio ?? '' })
      prefsForm.reset({
        dietaryRestrictions: data.dietaryRestrictions ?? '',
        interests: (data.interests ?? []).join(', '),
        personalityType: data.personalityType ?? undefined,
        preferredGroupSize: data.preferredGroupSize ?? undefined,
      })
    } catch {}
  }

  load()

  const saveDetails = detailsForm.handleSubmit(async (values) => {
    try {
      await api('/api/profile', { method: 'PUT', body: JSON.stringify(values) })
      toast.success('Profile saved')
    } catch (e: any) {
      toast.error(e?.message || 'Save failed')
    }
  })
  const savePrefs = prefsForm.handleSubmit(async (values) => {
    try {
      await api('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          dietaryRestrictions: values.dietaryRestrictions,
          interests: values.interests ? values.interests.split(',').map(s => s.trim()).filter(Boolean) : [],
          personalityType: values.personalityType,
          preferredGroupSize: values.preferredGroupSize,
        })
      })
      toast.success('Preferences saved')
    } catch (e: any) {
      toast.error(e?.message || 'Save failed')
    }
  })

  return (
    <div>
      <PageHeader title="Your profile" subtitle="Manage your details and preferences" />
      <div className="container pb-10">
      <Tabs.Root defaultValue="details" className="space-y-4">
        <Tabs.List className="flex gap-2">
          <Tabs.Trigger className="btn btn-outline" value="details">Details</Tabs.Trigger>
          <Tabs.Trigger className="btn btn-outline" value="preferences">Preferences</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="details">
          <Card>
            <form onSubmit={saveDetails} className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input placeholder="Your name" {...detailsForm.register('name')} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input placeholder="Your phone" {...detailsForm.register('phone')} />
              </div>
              <div className="md:col-span-2">
                <Label>Address</Label>
                <Input placeholder="Street, City" {...detailsForm.register('address')} />
              </div>
              <div className="md:col-span-2">
                <Label>Bio</Label>
                <Input placeholder="A few words about you" {...detailsForm.register('bio')} />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit">Save</Button>
              </div>
            </form>
          </Card>
        </Tabs.Content>
        <Tabs.Content value="preferences">
          <Card>
            <form onSubmit={savePrefs} className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Dietary restrictions</Label>
                <Input placeholder="e.g. vegetarian, nut allergy" {...prefsForm.register('dietaryRestrictions')} />
              </div>
              <div>
                <Label>Interests</Label>
                <Input placeholder="comma-separated interests" {...prefsForm.register('interests')} />
              </div>
              <div>
                <Label>Personality</Label>
                <Input placeholder="extrovert / introvert / ambivert" {...prefsForm.register('personalityType')} />
              </div>
              <div>
                <Label>Preferred group size</Label>
                <Input placeholder="small / medium / large" {...prefsForm.register('preferredGroupSize')} />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit">Save preferences</Button>
              </div>
            </form>
          </Card>
        </Tabs.Content>
      </Tabs.Root>
      </div>
    </div>
  )
}


