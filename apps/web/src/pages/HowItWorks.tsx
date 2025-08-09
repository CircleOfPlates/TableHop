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
    </div>
  )
}


