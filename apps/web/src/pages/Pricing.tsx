import { Button, Card } from '../components/ui'

const tiers = [
  { name: 'Free', price: '$0', desc: 'Join community events occasionally', cta: 'Get started' },
  { name: 'Member', price: '$9/mo', desc: 'Priority matching & badges', cta: 'Join now' },
  { name: 'Host+', price: '$19/mo', desc: 'Boosted hosting & rewards', cta: 'Upgrade' },
]

export default function Pricing() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold text-center">Pricing</h1>
      <p className="text-center text-muted-foreground mt-2">Flexible plans for every neighbour.</p>
      <div className="mt-8 grid md:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <Card key={t.name}>
            <div className="space-y-2 text-center">
              <h3 className="font-semibold">{t.name}</h3>
              <div className="text-3xl font-bold">{t.price}</div>
              <p className="text-sm text-muted-foreground">{t.desc}</p>
              <Button className="w-full mt-4">{t.cta}</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}


