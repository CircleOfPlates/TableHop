export default function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2">
            {it.href ? <a className="hover:text-foreground" href={it.href}>{it.label}</a> : <span className="text-foreground">{it.label}</span>}
            {i < items.length - 1 && <span>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}


