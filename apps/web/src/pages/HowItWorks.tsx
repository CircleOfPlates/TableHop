import { Card } from '../components/ui'

export default function HowItWorks() {
  return (
    <div className="container py-12 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">How it works</h1>
        <p className="text-muted-foreground">Simple steps to join a dinner and meet neighbours.</p>
      </header>
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { title: 'Opt in', desc: 'Tell us your availability, preferences and dietary needs.' },
          { title: 'Get matched', desc: 'We form small groups balancing hosts, courses and interests.' },
          { title: 'Enjoy dinner', desc: 'Rotate homes for courses or join a hosted table.' },
        ].map((s, i) => (
          <Card key={i}>
            <div className="space-y-2">
              <div className="h-24 bg-muted rounded" />
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Dinner Formats */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Dinner Formats</h2>
        <p className="text-muted-foreground">Choose the experience that fits your style</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔄</span>
              <h3 className="text-lg font-semibold">Rotating Dinners</h3>
            </div>
            <p className="text-muted-foreground">
              Experience three courses across different homes. Each participant hosts one course
              and enjoys all three. Perfect for meeting multiple neighbors!
            </p>
            <ul className="text-sm space-y-1">
              <li>• Starter at first host's home</li>
              <li>• Main course at second host's home</li>
              <li>• Dessert at third host's home</li>
              <li>• Partners required for rotating format</li>
            </ul>
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏠</span>
              <h3 className="text-lg font-semibold">Hosted Dinners</h3>
            </div>
            <p className="text-muted-foreground">
              Traditional dinner party hosted by one neighbor. All courses served at one location
              with everyone contributing to the meal.
            </p>
            <ul className="text-sm space-y-1">
              <li>• One host provides the venue</li>
              <li>• All courses at the same location</li>
              <li>• Guests bring dishes to share</li>
              <li>• Great for larger groups</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}


