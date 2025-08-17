import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Route, Switch, Redirect, useLocation } from 'wouter'
import './index.css'
import { LoginForm, SignupForm } from './pages/Auth'
import Layout from './components/Layout'
import Home from './pages/Home'
import Events from './pages/Events'
import Dashboard from './pages/Dashboard'
import Rewards from './pages/Rewards'
import HowItWorks from './pages/HowItWorks'
import Pricing from './pages/Pricing'
import Faqs from './pages/Faqs'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import AdminUsers from './pages/admin/Users'
import AdminEvents from './pages/admin/Events'
import AdminAnalytics from './pages/admin/Analytics'
import AdminAdmins from './pages/admin/Admins'
import AuthTest from './pages/AuthTest'
import Health from './pages/Health'
import AppToaster from './components/Toaster'

const queryClient = new QueryClient()

function App() {
  const [location] = useLocation()
  
  return (
    <QueryClientProvider client={queryClient}>
      <Switch location={location}>
        <Route path="/health" component={Health} />
        <Route>
          <Layout>
            <Switch location={location}>
              <Route path="/" component={Home} />
              <Route path="/login" component={Login} />
              <Route path="/signup" component={Signup} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/events" component={Events} />
              <Route path="/rewards" component={Rewards} />
              <Route path="/how-it-works" component={HowItWorks} />
              <Route path="/pricing" component={Pricing} />
              <Route path="/faqs" component={Faqs} />
              <Route path="/profile" component={Profile} />
              <Route path="/admin" component={Admin} />
              <Route path="/admin/users" component={AdminUsers} />
              <Route path="/admin/events" component={AdminEvents} />
              <Route path="/admin/analytics" component={AdminAnalytics} />
              <Route path="/admin/admins" component={AdminAdmins} />
              <Route path="/auth-test" component={AuthTest} />
              <Route>
                <Redirect to="/" />
              </Route>
            </Switch>
          </Layout>
        </Route>
      </Switch>
      <ReactQueryDevtools initialIsOpen={false} />
      <AppToaster />
    </QueryClientProvider>
  )
}

function Login() { return <LoginForm /> }
function Signup() { return <SignupForm /> }

export default App
