'use client'

import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../../components/Sidebar'
import Header from '../../components/Header'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname
  
  // If not authenticated, redirect to login page
  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      navigate('/login')
    }
  }, [isAuthenticated, isLoading, pathname, navigate])
  
  // If we're on the login page, don't show sidebar and header
  if (pathname === '/login') {
    return <>{children}</>
  }
  
  // If still loading, show a simple loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  // If authenticated and not on login page, show full layout with sidebar and header
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
