import Header from './Header'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="container py-6 text-sm text-muted-foreground">© {new Date().getFullYear()} TableHop</div>
      </footer>
    </div>
  )
}


