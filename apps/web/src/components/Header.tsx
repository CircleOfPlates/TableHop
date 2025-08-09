import { useAuth } from '../auth/AuthContext'
import { Avatar, Button, DropdownMenu } from './ui'

export default function Header() {
  const { user } = useAuth()
  const displayName = user ? `User ${user.id}` : 'Guest'
  return (
    <header className="border-b bg-background">
      <div className="container flex h-14 items-center justify-between">
        <a href="/" className="font-semibold">TableHop</a>
        <nav className="flex items-center gap-4">
          <a href="/events" className="text-sm text-muted-foreground hover:text-foreground">Events</a>
          <a href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
          <a href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground">How it works</a>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2">
                  <Avatar name={displayName} />
                  <span className="hidden sm:inline text-sm">{displayName}</span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content className="card p-2" align="end">
                <DropdownMenu.Label className="px-2 py-1 text-xs text-muted-foreground">Account</DropdownMenu.Label>
                <DropdownMenu.Item asChild>
                  <a className="px-2 py-1.5 rounded hover:bg-muted text-sm" href="/dashboard">Dashboard</a>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <a className="px-2 py-1.5 rounded hover:bg-muted text-sm" href="/profile">Profile</a>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownMenu.Item asChild>
                  <a className="px-2 py-1.5 rounded hover:bg-muted text-sm" href="/admin">Admin</a>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          ) : (
            <div className="flex items-center gap-2">
              <a className="text-sm" href="/login">Log in</a>
              <Button as-child="true" className="btn btn-primary"><a href="/signup">Sign up</a></Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}


