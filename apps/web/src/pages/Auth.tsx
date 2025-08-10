import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import { toast } from 'sonner'

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
  const { setUser } = useAuth()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema)
  })
  const onSubmit = handleSubmit(async (values) => {
    try {
      await api('/api/auth/login', { method: 'POST', body: JSON.stringify(values) })
      const me = await api<{ id: number }>('/api/auth/me')
      setUser(me)
      toast.success('Logged in successfully')
      location.href = '/dashboard'
    } catch (e: any) {
      toast.error(e?.message || 'Login failed. Please check your credentials.')
    }
  })
  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-sm mx-auto p-6">
      <h2 className="text-xl font-semibold">Log in</h2>
      <input className="border rounded p-2 w-full" placeholder="Username or email" {...register('identifier')} />
      {errors.identifier && <p className="text-red-600 text-sm">{errors.identifier.message}</p>}
      <input type="password" className="border rounded p-2 w-full" placeholder="Password" {...register('password')} />
      {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
      <button disabled={isSubmitting} className="w-full bg-black text-white rounded py-2">Log in</button>
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
      await api('/api/auth/signup', { method: 'POST', body: JSON.stringify(values) })
      const me = await api<{ id: number }>('/api/auth/me')
      setUser(me)
      toast.success('Account created successfully')
      location.href = '/dashboard'
    } catch (e: any) {
      toast.error(e?.message || 'Signup failed. Please try again.')
    }
  })
  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-sm mx-auto p-6">
      <h2 className="text-xl font-semibold">Sign up</h2>
      <input className="border rounded p-2 w-full" placeholder="Username" {...register('username')} />
      {errors.username && <p className="text-red-600 text-sm">{errors.username.message}</p>}
      <input className="border rounded p-2 w-full" placeholder="Email" {...register('email')} />
      {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
      <input type="password" className="border rounded p-2 w-full" placeholder="Password" {...register('password')} />
      {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
      <button disabled={isSubmitting} className="w-full bg-black text-white rounded py-2">Create account</button>
    </form>
  )
}


