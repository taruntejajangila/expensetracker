import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Navigation will be handled via window.location

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('adminToken')
    const userData = localStorage.getItem('adminUser')
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
      }
    }
    
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 AuthContext: Starting login process')
      const response = await fetch('http://localhost:5001/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log('🔐 AuthContext: API response:', data)

      if (data.success) {
        console.log('🔐 AuthContext: Login successful, storing data')
        const token = data.data.accessToken
        const user = data.data.user
        
        console.log('🔐 AuthContext: Token to store:', token)
        console.log('🔐 AuthContext: User to store:', user)
        
        localStorage.setItem('adminToken', token)
        localStorage.setItem('adminUser', JSON.stringify(user))
        
        // Verify storage
        const storedToken = localStorage.getItem('adminToken')
        const storedUser = localStorage.getItem('adminUser')
        console.log('🔐 AuthContext: Stored token:', storedToken)
        console.log('🔐 AuthContext: Stored user:', storedUser)
        
        setUser(user)
        console.log('🔐 AuthContext: User state updated:', user)
        return true
      } else {
        console.log('🔐 AuthContext: Login failed:', data.message)
        return false
      }
    } catch (error) {
      console.error('🔐 AuthContext: Login error:', error)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    setUser(null)
    window.location.href = '/login'
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
