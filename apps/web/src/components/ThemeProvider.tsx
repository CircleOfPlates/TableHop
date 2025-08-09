import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
type Contrast = 'normal' | 'high'

const Ctx = createContext<{ theme: Theme; setTheme: (t: Theme) => void; contrast: Contrast; setContrast: (c: Contrast) => void }>({ theme: 'light', setTheme: () => {}, contrast: 'normal', setContrast: () => {} })

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>((localStorage.getItem('theme') as Theme) || 'light')
  const [contrast, setContrast] = useState<Contrast>((localStorage.getItem('contrast') as Contrast) || 'normal')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])
  useEffect(() => {
    document.documentElement.classList.toggle('contrast-more', contrast === 'high')
    localStorage.setItem('contrast', contrast)
  }, [contrast])

  return <Ctx.Provider value={{ theme, setTheme, contrast, setContrast }}>{children}</Ctx.Provider>
}

export function useTheme() { return useContext(Ctx) }


