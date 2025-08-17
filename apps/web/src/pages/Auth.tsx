import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api, tokenManager } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import { toast } from 'sonner'
import { Input, Button } from '../components/ui'

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(8),
})

const signupSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
})

export function LoginForm() {
  const { login } = useAuth()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema)
  })
  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.identifier, values.password)
      location.href = '/dashboard'
    } catch (e: any) {
      toast.error(e?.message || 'Login failed. Please check your credentials.')
    }
  })
  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-sm mx-auto p-6">
      <h2 className="text-xl font-semibold">Log in</h2>
      <div className="space-y-2">
        <Input placeholder="Username or email" {...register('identifier')} />
        {errors.identifier && <p className="text-red-600 text-sm">{errors.identifier.message}</p>}
      </div>
      <div className="space-y-2">
        <Input type="password" placeholder="Password" {...register('password')} />
        {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">Log in</Button>
    </form>
  )
}

export function SignupForm() {
  const { setUser } = useAuth()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema)
  })
  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await api<{ id: number; username: string; email: string; token: string }>('/api/auth/signup', { 
        method: 'POST', 
        body: JSON.stringify(values) 
      })
      
      // Store JWT token
      if (response.token) {
        tokenManager.setToken(response.token);
        console.log('🔑 JWT token stored after signup');
      }
      
      const me = await api<{ id: number; role?: string }>('/api/auth/me')
      setUser(me)
      toast.success('Account created successfully! Please complete your profile.')
      location.href = '/profile?onboarding=true'
    } catch (e: any) {
      toast.error(e?.message || 'Signup failed. Please try again.')
    }
  })
  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-sm mx-auto p-6">
      <h2 className="text-xl font-semibold">Sign up</h2>
      <div className="space-y-2">
        <Input placeholder="Username" {...register('username')} />
        {errors.username && <p className="text-red-600 text-sm">{errors.username.message}</p>}
      </div>
      <div className="space-y-2">
        <Input placeholder="Email" {...register('email')} />
        {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Input type="password" placeholder="Password" {...register('password')} />
        {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">Create account</Button>
    </form>
  )
}


