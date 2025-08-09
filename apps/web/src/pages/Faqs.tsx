export default function Faqs() {
  const faqs = [
    { q: 'Do I have to host?', a: 'No, you can join hosted dinners or opt to host a course.' },
    { q: 'Can I bring a partner?', a: 'Rotating dinners require a partner; hosted dinners are optional.' },
    { q: 'How are matches made?', a: 'We consider interests, personality, dietary needs and group balance.' },
  ]
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="text-3xl font-bold">FAQs</h1>
      <div className="mt-6 space-y-4">
        {faqs.map((f, i) => (
          <div key={i} className="card">
            <div className="card-body">
              <h3 className="font-semibold">{f.q}</h3>
              <p className="text-sm text-muted-foreground">{f.a}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


