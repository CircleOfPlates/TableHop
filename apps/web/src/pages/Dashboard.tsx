import { Card, Button, Progress } from '../components/ui'

export default function Dashboard() {
  return (
    <div className="container py-10 space-y-8">
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <div className="space-y-2">
            <h3 className="font-semibold">Next event</h3>
            <p className="text-sm text-muted-foreground">You’re registered for the rotating dinner on Sep 20</p>
            <Button className="w-full">View details</Button>
          </div>
        </Card>
        <Card>
          <div className="space-y-2">
            <h3 className="font-semibold">Points</h3>
            <p className="text-sm text-muted-foreground">Balance: 120</p>
            <div className="h-2 rounded bg-muted"><div className="h-2 bg-primary rounded w-2/3" /></div>
          </div>
        </Card>
        <Card>
          <div className="space-y-2">
            <h3 className="font-semibold">Badges</h3>
            <p className="text-sm text-muted-foreground">Warm Host · Connector</p>
            <div className="flex gap-2"><div className="h-8 w-8 bg-muted rounded" /><div className="h-8 w-8 bg-muted rounded" /></div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="space-y-4">
          <h3 className="font-semibold">Profile completion</h3>
          <p className="text-sm text-muted-foreground">Complete your profile to improve matching.</p>
          <Progress.Root className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <Progress.Indicator className="h-full w-2/3 flex-1 bg-primary transition-transform" style={{ transform: 'translateX(0%)' }} />
          </Progress.Root>
          <div className="flex gap-2">
            <Button variant="outline">Edit profile</Button>
            <Button>Manage preferences</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}


