import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Route, Switch, Redirect, useLocation } from 'wouter'
import './index.css'

const queryClient = new QueryClient()

function App() {
  const [location] = useLocation()
  return (
    <QueryClientProvider client={queryClient}>
      <Switch location={location}>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/events" component={Events} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">TableHop</h1>
        <p className="text-gray-600 mb-6">Neighbourhood dinner parties that build real community.</p>
        <a href="/signup" className="px-4 py-2 bg-black text-white rounded">Get started</a>
      </div>
    </div>
  )
}

function Login() {
  return <div className="p-6">Login</div>
}
function Signup() {
  return <div className="p-6">Signup</div>
}
function Dashboard() {
  return <div className="p-6">Dashboard</div>
}
function Events() {
  return <div className="p-6">Events</div>
}

export default App
