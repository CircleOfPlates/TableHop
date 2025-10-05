import { Button, Card } from '../components/ui'
import { Section, Container, Heading } from '../components/home/Section'

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <Section className="bg-[hsl(30_100%_97%)]">
        <Container className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-5xl font-bold leading-tight tracking-tight">Share meals. Build community.</h1>
            <p className="mt-5 text-xl text-muted-foreground max-w-xl">Join weekly rotating dinner parties and hosted tables. Meet neighbours, make friends, and enjoy good food together.</p>
            <div className="mt-8 flex gap-4">
              <Button onClick={() => (location.href = '/auth?form=signup&returnTo=/events')}>Get started</Button>
              <Button variant="outline" onClick={() => (location.href = '/how-it-works')}>How it works</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <Card><div className="h-40 bg-muted rounded-md" /></Card>
            <Card><div className="h-40 bg-muted rounded-md" /></Card>
            <Card><div className="h-40 bg-muted rounded-md" /></Card>
            <Card><div className="h-40 bg-muted rounded-md" /></Card>
          </div>
        </Container>
      </Section>

      {/* How it works */}
      <Section>
        <Container>
          <Heading title="How it works" subtitle="Simple steps to join and enjoy neighbourhood dinners" />
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              { title: 'Opt in', desc: 'Choose availability, add your preferences and dietary needs.' },
              { title: 'Get matched', desc: 'We balance groups by interests, personality and hosting roles.' },
              { title: 'Enjoy dinner', desc: 'Rotate homes for each course or join a hosted table.' },
            ].map((s, i) => (
              <Card key={i}><div className="space-y-2"><div className="h-28 bg-muted rounded" /><h3 className="text-lg font-semibold">{s.title}</h3><p className="text-muted-foreground">{s.desc}</p></div></Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Formats */}
      <Section className="bg-[hsl(38_100%_97%)]">
        <Container>
          <Heading title="Two ways to dine" subtitle="Choose rotating dinners or hosted tables" />
          <div className="mt-10 grid md:grid-cols-2 gap-6">
            <Card><div className="space-y-3"><div className="h-40 bg-muted rounded" /><h3 className="text-xl font-semibold">Rotating dinner</h3><p className="text-muted-foreground">Starter, main and dessert at three homes. Everyone hosts a course.</p></div></Card>
            <Card><div className="space-y-3"><div className="h-40 bg-muted rounded" /><h3 className="text-xl font-semibold">Hosted table</h3><p className="text-muted-foreground">One host provides all courses. Guests can bring sides or drinks.</p></div></Card>
          </div>
        </Container>
      </Section>

      {/* Community stats */}
      <Section>
        <Container>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            {[
              { num: '1,200+', label: 'Neighbours connected' },
              { num: '350+', label: 'Dinners hosted' },
              { num: '97%', label: 'Would recommend' },
            ].map((item) => (
              <div key={item.label} className="card">
                <div className="card-body">
                  <div className="text-4xl font-bold text-foreground">{item.num}</div>
                  <div className="text-muted-foreground mt-1">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Testimonials */}
      <Section className="bg-[hsl(30_100%_97%)]">
        <Container>
          <Heading title="What neighbours say" />
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              'The most welcoming way to meet people on my street. The rotating dinner was so much fun!',
              'Loved the hosted table format. As an introvert, it felt easy and comfortable.',
              'Great food and even better company. We’ve kept in touch and already planned another dinner.',
            ].map((quote, i) => (
              <Card key={i}><p className="text-lg">“{quote}”</p></Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Pricing teaser */}
      <Section>
        <Container>
          <Heading title="Flexible pricing" subtitle="Join for free or unlock perks with membership" />
          <div className="mt-8 flex justify-center">
            <Button onClick={() => (location.href = '/pricing')}>View plans</Button>
          </div>
        </Container>
      </Section>

      {/* FAQs teaser */}
      <Section className="bg-[hsl(38_100%_97%)]">
        <Container>
          <Heading title="Questions?" subtitle="Find answers to hosting, guests, allergies and more" />
          <div className="mt-8 flex justify-center">
            <Button variant="outline" onClick={() => (location.href = '/faqs')}>Read FAQs</Button>
          </div>
        </Container>
      </Section>

      {/* Final CTA */}
      <Section>
        <Container className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to pull up a chair?</h2>
          <p className="text-lg text-muted-foreground mt-2">Opt in, get matched, and enjoy a great night with neighbours.</p>
          <div className="mt-8"><Button onClick={() => (location.href = '/auth?form=signup&returnTo=/events')}>Get started</Button></div>
        </Container>
      </Section>
    </div>
  )
}


