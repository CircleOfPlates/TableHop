import { Button, Card } from '../components/ui'

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-b from-orange-50 to-white border-b">
        <div className="container grid md:grid-cols-2 gap-8 py-16 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Share meals. Build community.</h1>
            <p className="mt-4 text-lg text-muted-foreground">Join rotating neighbourhood dinner parties and meet friendly neighbours over delicious food.</p>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => (location.href = '/signup')}>Get started</Button>
              <Button variant="outline" onClick={() => (location.href = '/how-it-works')}>How it works</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card><div className="h-36 bg-muted rounded-md" /></Card>
            <Card><div className="h-36 bg-muted rounded-md" /></Card>
            <Card><div className="h-36 bg-muted rounded-md" /></Card>
            <Card><div className="h-36 bg-muted rounded-md" /></Card>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <h2 className="text-2xl font-semibold">Upcoming events</h2>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <div className="space-y-2">
                <div className="h-28 bg-muted rounded-md" />
                <h3 className="font-medium">Neighbourhood Dinner</h3>
                <p className="text-sm text-muted-foreground">Fri 7:00 PM · Rotating dinner</p>
                <Button className="w-full">View details</Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}


