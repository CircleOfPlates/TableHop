export function Section({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <section className={`py-16 ${className}`}>{children}</section>
}

export function Container({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`container ${className}`}>{children}</div>
}

export function Heading({ title, subtitle, align = 'center' }: { title: string; subtitle?: string; align?: 'center' | 'left' }) {
  return (
    <div className={`max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''}`}>
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="text-muted-foreground mt-2 text-lg">{subtitle}</p>}
    </div>
  )
}


