import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Route, Switch, Redirect, useLocation } from 'wouter'
import './index.css'
import { LoginForm, SignupForm } from './pages/Auth'
import Layout from './components/Layout'
import Home from './pages/Home'
import Events from './pages/Events'
import Dashboard from './pages/Dashboard'
import AppToaster from './components/Toaster'

const queryClient = new QueryClient()

function App() {
  const [location] = useLocation()
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Switch location={location}>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/events" component={Events} />
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </Layout>
      <ReactQueryDevtools initialIsOpen={false} />
      <AppToaster />
    </QueryClientProvider>
  )
}

function Login() { return <LoginForm /> }
function Signup() { return <SignupForm /> }

export default App
