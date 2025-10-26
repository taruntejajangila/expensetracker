'use client'

import { useState, useEffect } from 'react'
import { 
  Bell, 
  Send, 
  Users, 
  Smartphone, 
  Monitor, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  BarChart3,
  Trash2
} from 'lucide-react'
import { API_BASE_URL } from '../../config/api.config'

interface NotificationStats {
  totalTokens: number
  activeTokens: number
  usersWithTokens: number
  platformBreakdown: {
    ios: number
    android: number
  }
}

interface NotificationForm {
  title: string
  body: string
  targetAll: boolean
  userEmails: string[]
  userIds: string[]
  // Custom notification fields
  type: 'simple' | 'custom'
  customContent?: {
    id: string
    type: 'announcement' | 'blog_post' | 'update' | 'promotion' | 'general'
    title?: string
    body?: string
    content: string
    author?: string
    imageUrl?: string
    actionButton?: {
      text: string
      url?: string
      action?: string
    }
    tags?: string[]
  }
}

interface AppUser {
  id: string
  name: string
  email: string
  status: string
  createdAt: string
  lastLoginAt?: string
  transactionCount: number
}

interface NotificationHistory {
  id: number
  title: string
  body: string
  type: string
  status: string
  createdAt: string
  sentAt?: string
  deliveredAt?: string
  readAt?: string
  targetUser?: {
    email: string
    firstName: string
    lastName: string
  }
}

interface NotificationHistoryResponse {
  notifications: NotificationHistory[]
  total: number
  page: number
  totalPages: number
}

export default function NotificationsPage() {
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [history, setHistory] = useState<NotificationHistoryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send')
  const [showStylingGuide, setShowStylingGuide] = useState(false)
  const [form, setForm] = useState<NotificationForm>({
    title: '',
    body: '',
    targetAll: true,
    userEmails: [],
    userIds: [],
    type: 'simple',
    customContent: undefined
  })

  const [users, setUsers] = useState<AppUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userPage, setUserPage] = useState(1)
  const [usersPerPage] = useState(20)

  // Filter and paginate users
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  )
  
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const paginatedUsers = filteredUsers.slice(
    (userPage - 1) * usersPerPage,
    userPage * usersPerPage
  )

  useEffect(() => {
    loadNotificationStats()
    loadUsers()
  }, [])

  // Reset to first page when search term changes
  useEffect(() => {
    setUserPage(1)
  }, [userSearchTerm])

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No admin token found')
      }

      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load users')
      }

      const result = await response.json()
      if (result.success && result.data) {
        setUsers(result.data)
      } else {
        throw new Error('Invalid users response format')
      }
    } catch (error) {
      console.error('Error loading users:', error)
      setError('Failed to load users list')
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadNotificationHistory = async () => {
    try {
      setIsLoadingHistory(true)
      setError(null)

      const adminToken = localStorage.getItem('adminToken')
      if (!adminToken) {
        setError('No admin token found. Please login again.')
        return
      }

      const response = await fetch(`${API_BASE_URL}/notifications/history?days=7&limit=20`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load notification history')
      }

      const result = await response.json()
      if (result.success) {
        setHistory(result.data)
      } else {
        throw new Error(result.message || 'Failed to load notification history')
      }
    } catch (err) {
      console.error('Error loading notification history:', err)
      setError(err instanceof Error ? err.message : 'Failed to load notification history')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const loadNotificationStats = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // For testing, we'll show mock stats since we're using test tokens
      const mockStats: NotificationStats = {
        totalTokens: 1,
        activeTokens: 1,
        usersWithTokens: 1,
        platformBreakdown: {
          ios: 0,
          android: 1
        }
      }

      setStats(mockStats)
    } catch (err) {
      console.error('Error loading notification stats:', err)
      setError('Failed to load notification statistics')
    } finally {
      setIsLoading(false)
    }
  }

  const sendNotification = async () => {
    try {
      setIsSending(true)
      setError(null)
      setSuccess(null)

      if (!form.title.trim() || !form.body.trim()) {
        setError('Title and message are required')
        return
      }

      if (!form.targetAll && form.userIds.length === 0) {
        setError('Please select at least one user when not targeting all users')
        return
      }

      if (form.type === 'custom' && (!form.customContent || !form.customContent.content.trim())) {
        setError('Full content is required for custom notifications')
        return
      }

      // Send notification through our test notification server
      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),
        targetAll: form.targetAll,
        ...(form.targetAll ? {} : { userEmails: form.userEmails }),
        ...(form.type === 'custom' && form.customContent ? {
          type: 'custom',
          customContent: {
            ...form.customContent,
            title: form.title.trim(),
            body: form.body.trim()
          }
        } : {
          type: 'simple'
        }),
        ...(form.type === 'custom' ? {} : {
        data: {
          type: 'admin_notification',
          from: 'admin_panel'
        }
        })
      }

      console.log('📤 Sending notification payload:', payload)
      console.log('📤 Form state:', form)
      console.log('📤 Custom content:', form.customContent)

      // Get the admin token from localStorage
      const adminToken = localStorage.getItem('adminToken')
      if (!adminToken) {
        setError('No admin token found. Please login again.')
        return
      }

      // Send directly to backend API
      const response = await fetch(`${API_BASE_URL}/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to send notification to test server')
      }

      const result = await response.json()
      console.log('Test notification sent:', result)

      if (result.success) {
        if (form.targetAll) {
          setSuccess('Notification sent to all users successfully! It will appear on mobile devices within 5 seconds.')
        } else {
          setSuccess(`Notification sent to ${result.data?.successCount || form.userIds.length} user(s) successfully! It will appear on mobile devices within 5 seconds.`)
        }
      } else {
        setError(result.message || 'Failed to send notification')
      }
      setForm({
        title: '',
        body: '',
        targetAll: true,
        userEmails: [],
        userIds: [],
        type: 'simple',
        customContent: undefined
      })
    } catch (err) {
      console.error('Error sending notification:', err)
      setError(err instanceof Error ? err.message : 'Failed to send notification')
    } finally {
      setIsSending(false)
    }
  }

  const cleanupTokens = async () => {
    try {
      // For testing, we'll just show a success message
      setSuccess('Token cleanup completed (test mode)')
      loadNotificationStats() // Refresh stats
    } catch (err) {
      console.error('Error cleaning up tokens:', err)
      setError(err instanceof Error ? err.message : 'Failed to cleanup tokens')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-600">Loading notification statistics...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Bell className="h-8 w-8 mr-3 text-blue-600" />
            Push Notifications
          </h1>
          <p className="text-gray-600 mt-2">Send push notifications to mobile app users</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('send')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'send'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Send Notifications
              </button>
              <button
                onClick={() => {
                  setActiveTab('history')
                  if (!history) loadNotificationHistory()
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Notification History
              </button>
            </nav>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <XCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {activeTab === 'send' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Statistics Cards */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Statistics
                </h3>
                
                {stats ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Tokens</span>
                      <span className="font-semibold text-gray-900">{stats.totalTokens}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Active Tokens</span>
                      <span className="font-semibold text-green-600">{stats.activeTokens}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Users with Tokens</span>
                      <span className="font-semibold text-blue-600">{stats.usersWithTokens}</span>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Platform Breakdown</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Smartphone className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm text-gray-600">Android</span>
                          </div>
                          <span className="text-sm font-medium">{stats.platformBreakdown.android}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Monitor className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm text-gray-600">iOS</span>
                          </div>
                          <span className="text-sm font-medium">{stats.platformBreakdown.ios}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No statistics available
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={loadNotificationStats}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Stats
                  </button>
                  <button
                    onClick={cleanupTokens}
                    className="w-full flex items-center justify-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cleanup Inactive Tokens
                  </button>
                </div>
              </div>
            </div>

            {/* Send Notification Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Send className="h-5 w-5 mr-2 text-blue-600" />
                  Send Notification
                </h3>

                <form onSubmit={(e) => { e.preventDefault(); sendNotification(); }} className="space-y-6">
                  {/* Notification Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Notification Type
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="notificationType"
                          checked={form.type === 'simple'}
                          onChange={() => setForm({ ...form, type: 'simple' })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Simple Notification</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="notificationType"
                          checked={form.type === 'custom'}
                          onChange={() => setForm({ 
                            ...form, 
                            type: 'custom',
                            customContent: form.customContent || {
                              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                              type: 'general',
                              content: '',
                              author: '',
                              actionButton: undefined,
                              tags: []
                            }
                          })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Custom Content (Blog Post, Announcement, etc.)</span>
                      </label>
                    </div>
                  </div>

                  {/* Target Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Target Audience
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="target"
                          checked={form.targetAll}
                          onChange={() => setForm({ ...form, targetAll: true, userEmails: [], userIds: [] })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700 flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          All Users ({stats?.activeTokens || 0} active tokens)
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="target"
                          checked={!form.targetAll}
                          onChange={() => setForm({ ...form, targetAll: false })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                         <span className="ml-2 text-sm text-gray-700">Specific Users</span>
                      </label>
                    </div>
                  </div>

                  {/* Multi-User Selection (if specific users) */}
                  {!form.targetAll && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Select Users ({form.userIds.length} selected)
                      </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const newUserIds = Array.from(new Set([...form.userIds, ...paginatedUsers.map(u => u.id)]))
                              const newUserEmails = Array.from(new Set([...form.userEmails, ...paginatedUsers.map(u => u.email)]))
                              setForm({
                                ...form,
                                userIds: newUserIds,
                                userEmails: newUserEmails
                              })
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                            title="Select all users on current page"
                          >
                            Select Page
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const activeUsers = filteredUsers.filter(u => u.status === 'active')
                              const newUserIds = Array.from(new Set([...form.userIds, ...activeUsers.map(u => u.id)]))
                              const newUserEmails = Array.from(new Set([...form.userEmails, ...activeUsers.map(u => u.email)]))
                              setForm({
                                ...form,
                                userIds: newUserIds,
                                userEmails: newUserEmails
                              })
                            }}
                            className="text-xs text-green-600 hover:text-green-800"
                            title="Add all active users to selection"
                          >
                            Select Active
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setForm({ ...form, userIds: [], userEmails: [] })
                            }}
                            className="text-xs text-red-600 hover:text-red-800"
                            title="Clear all selections"
                          >
                            Clear All
                          </button>
                          <button
                            type="button"
                            onClick={loadUsers}
                            disabled={loadingUsers}
                            className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 flex items-center"
                          >
                            <RefreshCw className={`h-3 w-3 mr-1 ${loadingUsers ? 'animate-spin' : ''}`} />
                            Refresh
                          </button>
                        </div>
                      </div>
                      
                      {/* Search Input */}
                      <div className="mb-3">
                        <input
                          type="text"
                          placeholder="Search users by name or email..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="mt-1 text-xs text-gray-500">
                          {userSearchTerm ? (
                            <>Showing {filteredUsers.length} of {users.length} users</>
                          ) : (
                            <>{users.length} total users • {form.userIds.length} selected</>
                          )}
                        </div>
                      </div>
                      
                      {loadingUsers ? (
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Loading users...
                        </div>
                      ) : (
                        <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto">
                          {paginatedUsers.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              {userSearchTerm ? 'No users match your search' : 'No users found'}
                            </div>
                          ) : (
                            <>
                              {paginatedUsers.map((user) => (
                                <label key={user.id} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                      <input
                                    type="checkbox"
                                    checked={form.userIds.includes(user.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setForm({
                                          ...form,
                                          userIds: [...form.userIds, user.id],
                                          userEmails: [...form.userEmails, user.email]
                                        })
                                      } else {
                                        setForm({
                                          ...form,
                                          userIds: form.userIds.filter(id => id !== user.id),
                                          userEmails: form.userEmails.filter(email => email !== user.email)
                                        })
                                      }
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <div className="ml-3 flex-1">
                                    <div className="text-sm font-medium text-gray-900">
                                      {user.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {user.email} • {user.status} • {user.transactionCount} transactions
                                    </div>
                                  </div>
                                </label>
                              ))}
                              
                              {/* Pagination */}
                              {totalPages > 1 && (
                                <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                                  <div className="text-xs text-gray-500">
                                    Page {userPage} of {totalPages} ({filteredUsers.length} users)
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setUserPage(Math.max(1, userPage - 1))}
                                      disabled={userPage === 1}
                                      className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Previous
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setUserPage(Math.min(totalPages, userPage + 1))}
                                      disabled={userPage === totalPages}
                                      className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Next
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                      
                      {form.userIds.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-600 mb-1">
                            Selected users ({form.userIds.length}):
                          </div>
                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                            {form.userIds.slice(0, 10).map((userId) => {
                              const user = users.find(u => u.id === userId)
                              return (
                                <span
                                  key={userId}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {user?.name}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setForm({
                                        ...form,
                                        userIds: form.userIds.filter(id => id !== userId),
                                        userEmails: form.userEmails.filter(email => email !== user?.email)
                                      })
                                    }}
                                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </button>
                                </span>
                              )
                            })}
                            {form.userIds.length > 10 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                +{form.userIds.length - 10} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Notification title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
                      {form.type === 'simple' ? 'Message *' : 'Preview Message *'}
                    </label>
                    <textarea
                      id="body"
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                      placeholder={form.type === 'simple' ? 'Notification message' : 'Brief preview message shown in notification'}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Custom Content Fields */}
                  {form.type === 'custom' && (
                    <div className="space-y-4 border-t pt-6">
                      <div className="flex items-center justify-between">
                      <h4 className="text-md font-semibold text-gray-900">Custom Content Details</h4>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          💡 Use **bold**, *italic*, # headers, - lists, &gt; quotes, `code`, [links](url)
                        </div>
                      </div>
                      
                      {/* Content Type */}
                      <div>
                        <label htmlFor="contentType" className="block text-sm font-medium text-gray-700 mb-2">
                          Content Type
                        </label>
                        <select
                          id="contentType"
                          value={form.customContent?.type || 'general'}
                          onChange={(e) => setForm({
                            ...form,
                            customContent: {
                              ...form.customContent,
                              type: e.target.value as any,
                              content: form.customContent?.content || '',
                              author: form.customContent?.author || '',
                              actionButton: form.customContent?.actionButton,
                              tags: form.customContent?.tags || [],
                              id: form.customContent?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="announcement">Announcement</option>
                          <option value="blog_post">Blog Post</option>
                          <option value="update">App Update</option>
                          <option value="promotion">Promotion</option>
                          <option value="general">General</option>
                        </select>
                      </div>

                      {/* Author */}
                      <div>
                        <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                          Author (Optional)
                        </label>
                        <input
                          type="text"
                          id="author"
                          value={form.customContent?.author || ''}
                          onChange={(e) => setForm({
                            ...form,
                            customContent: {
                              ...form.customContent,
                              author: e.target.value,
                              type: form.customContent?.type || 'general',
                              content: form.customContent?.content || '',
                              actionButton: form.customContent?.actionButton,
                              tags: form.customContent?.tags || [],
                              id: form.customContent?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                            }
                          })}
                          placeholder="e.g., Expense Tracker Team"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Full Content */}
                      <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="fullContent" className="block text-sm font-medium text-gray-700">
                          Full Content *
                        </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const examples = `# Quick Examples

**Bold text** and *italic text* work great!

- Use lists for features
- Add **bold** items for emphasis
- Include *italic* notes

> This is a blockquote for important info

\`inline code\` and links: [Visit our site](https://example.com)

---

🚀 **Don't forget emojis!** They make content engaging.`;
                            setForm({
                              ...form,
                              customContent: {
                                ...form.customContent,
                                content: examples,
                                type: form.customContent?.type || 'general',
                                author: form.customContent?.author || '',
                                actionButton: form.customContent?.actionButton,
                                tags: form.customContent?.tags || [],
                                id: form.customContent?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                              }
                            });
                          }}
                          className="text-xs text-green-600 hover:text-green-800 flex items-center"
                        >
                          <span className="mr-1">⚡</span>
                          Try Examples
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowStylingGuide(!showStylingGuide)}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <span className="mr-1">❓</span>
                          {showStylingGuide ? 'Hide' : 'Show'} Full Guide
                        </button>
                      </div>
                    </div>
                    
                    {/* Styling Guide */}
                    {showStylingGuide && (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-900 mb-3">📝 Markdown Styling Guide</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <h5 className="font-medium text-blue-800 mb-2">Text Formatting</h5>
                            <div className="space-y-1 text-gray-700">
                              <div><code className="bg-white px-1 rounded">**Bold text**</code> → <strong>Bold text</strong></div>
                              <div><code className="bg-white px-1 rounded">*Italic text*</code> → <em>Italic text</em></div>
                              <div><code className="bg-white px-1 rounded">***Bold italic***</code> → <strong><em>Bold italic</em></strong></div>
                              <div><code className="bg-white px-1 rounded">~~Strikethrough~~</code> → <span className="line-through">Strikethrough</span></div>
                              <div><code className="bg-white px-1 rounded">==Highlight==</code> → <span className="bg-yellow-200 px-1 rounded">Highlight</span></div>
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium text-blue-800 mb-2">Headers & Lists</h5>
                            <div className="space-y-1 text-gray-700">
                              <div><code className="bg-white px-1 rounded"># Header 1</code> → <span className="text-lg font-bold">Header 1</span></div>
                              <div><code className="bg-white px-1 rounded">## Header 2</code> → <span className="text-base font-bold">Header 2</span></div>
                              <div><code className="bg-white px-1 rounded">- Bullet item</code> → • Bullet item</div>
                              <div><code className="bg-white px-1 rounded">1. Numbered item</code> → 1. Numbered item</div>
                              <div><code className="bg-white px-1 rounded">&gt; Quote</code> → <span className="italic text-gray-600">Quote</span></div>
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium text-blue-800 mb-2">Code & Links</h5>
                            <div className="space-y-1 text-gray-700">
                              <div><code className="bg-white px-1 rounded">`inline code`</code> → <code className="bg-gray-100 px-1 rounded text-xs">inline code</code></div>
                              <div><code className="bg-white px-1 rounded">```code block```</code> → Code block</div>
                              <div><code className="bg-white px-1 rounded">[Link](url)</code> → <a href="#" className="text-blue-600 underline">Link</a></div>
                              <div><code className="bg-white px-1 rounded">https://example.com</code> → <a href="#" className="text-blue-600 underline">https://example.com</a></div>
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium text-blue-800 mb-2">Special Elements</h5>
                            <div className="space-y-1 text-gray-700">
                              <div><code className="bg-white px-1 rounded">---</code> → Horizontal line</div>
                              <div><code className="bg-white px-1 rounded">***</code> → Horizontal line</div>
                              <div><code className="bg-white px-1 rounded">🚀 Emojis work!</code> → 🚀 Emojis work!</div>
                              <div><code className="bg-white px-1 rounded">Line breaks</code> → Line breaks</div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 p-2 bg-white rounded border">
                          <h6 className="font-medium text-blue-800 mb-1">💡 Pro Tips:</h6>
                          <ul className="text-xs text-gray-700 space-y-1">
                            <li>• Use <code className="bg-gray-100 px-1 rounded">**bold**</code> for important information</li>
                            <li>• Use <code className="bg-gray-100 px-1 rounded">- lists</code> for features and benefits</li>
                            <li>• Use <code className="bg-gray-100 px-1 rounded"># headers</code> to organize content sections</li>
                            <li>• Use <code className="bg-gray-100 px-1 rounded">&gt; quotes</code> for testimonials or important notes</li>
                            <li>• Use emojis 🎉 to make content more engaging!</li>
                          </ul>
                        </div>
                      </div>
                    )}
                    
                        <textarea
                          id="fullContent"
                          value={form.customContent?.content || ''}
                          onChange={(e) => setForm({
                            ...form,
                            customContent: {
                              ...form.customContent,
                              content: e.target.value,
                              type: form.customContent?.type || 'general',
                              author: form.customContent?.author || '',
                              actionButton: form.customContent?.actionButton,
                              tags: form.customContent?.tags || [],
                              id: form.customContent?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                            }
                          })}
                      placeholder="Enter the full content for your blog post, announcement, or update...

💡 Quick formatting tips:
• Use **bold** for important text
• Use *italic* for emphasis  
• Use # for headers
• Use - for bullet lists
• Use &gt; for quotes
• Use `code` for inline code
• Use [text](url) for links
• Use 🎉 emojis to make it engaging!"
                          rows={8}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required={form.type === 'custom'}
                        />
                      </div>

                      {/* Action Button */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="actionButtonText" className="block text-sm font-medium text-gray-700 mb-2">
                            Action Button Text (Optional)
                          </label>
                          <input
                            type="text"
                            id="actionButtonText"
                            value={form.customContent?.actionButton?.text || ''}
                            onChange={(e) => setForm({
                              ...form,
                              customContent: {
                                ...form.customContent,
                                actionButton: {
                                  ...form.customContent?.actionButton,
                                  text: e.target.value,
                                  url: form.customContent?.actionButton?.url || '',
                                  action: form.customContent?.actionButton?.action || ''
                                },
                                type: form.customContent?.type || 'general',
                                content: form.customContent?.content || '',
                                author: form.customContent?.author || '',
                                tags: form.customContent?.tags || [],
                                id: form.customContent?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                              }
                            })}
                            placeholder="e.g., Learn More, Update Now"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="actionButtonUrl" className="block text-sm font-medium text-gray-700 mb-2">
                            Action URL (Optional)
                          </label>
                          <input
                            type="url"
                            id="actionButtonUrl"
                            value={form.customContent?.actionButton?.url || ''}
                            onChange={(e) => setForm({
                              ...form,
                              customContent: {
                                ...form.customContent,
                                actionButton: {
                                  ...form.customContent?.actionButton,
                                  text: form.customContent?.actionButton?.text || '',
                                  url: e.target.value,
                                  action: form.customContent?.actionButton?.action || ''
                                },
                                type: form.customContent?.type || 'general',
                                content: form.customContent?.content || '',
                                author: form.customContent?.author || '',
                                tags: form.customContent?.tags || [],
                                id: form.customContent?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                              }
                            })}
                            placeholder="https://example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Tags */}
                      <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                          Tags (Optional)
                        </label>
                        <input
                          type="text"
                          id="tags"
                          value={form.customContent?.tags?.join(', ') || ''}
                          onChange={(e) => setForm({
                            ...form,
                            customContent: {
                              ...form.customContent,
                              tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
                              type: form.customContent?.type || 'general',
                              content: form.customContent?.content || '',
                              author: form.customContent?.author || '',
                              actionButton: form.customContent?.actionButton,
                              id: form.customContent?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                            }
                          })}
                          placeholder="update, features, improvements (comma separated)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        const sampleData = {
                          title: "🚀 New Feature Update Available!",
                          body: "Check out our latest features and improvements. Tap to learn more!",
                          type: 'custom' as const,
                          targetAll: true,
                          userEmails: [],
                          userIds: [],
                          customContent: {
                            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            type: 'announcement' as const,
                            title: "🚀 New Feature Update Available!",
                            body: "Check out our latest features and improvements. Tap to learn more!",
                            content: `# 🚀 New Feature Update Available!

We're excited to announce several new features and improvements in our latest update!

## ✨ What's New

### 📊 Enhanced Analytics Dashboard
- **Real-time spending insights** with interactive charts
- **Category-wise breakdown** with visual progress bars  
- **Monthly/Weekly comparisons** to track your financial trends
- **Export functionality** to download your data as CSV

### 💰 Smart Budget Management
- **Automatic budget suggestions** based on your spending patterns
- **Smart alerts** when you're approaching budget limits
- **Flexible budget categories** with custom limits
- **Budget vs actual** spending comparisons

### 🔔 Improved Notifications
- **Customizable reminder settings** for bill payments
- **Spending threshold alerts** to help you stay on track
- **Weekly spending summaries** delivered to your inbox
- **Smart categorization** suggestions for better organization

### 🎨 Better User Experience
- **Dark mode support** for comfortable viewing
- **Improved navigation** with intuitive menu structure
- **Faster performance** with optimized loading times
- **Enhanced security** with biometric authentication

## 🎯 How to Get Started

1. **Update your app** to the latest version
2. **Explore the new analytics** section in your dashboard
3. **Set up smart budgets** for your spending categories
4. **Customize notifications** to match your preferences

## 📱 System Requirements

- iOS 12.0+ or Android 8.0+
- 50MB free storage space
- Internet connection for sync

---

## 🎨 Rich Text Formatting Examples

### Text Styling
- **Bold text** using \`**bold**\`
- *Italic text* using \`*italic*\`
- ***Bold and italic*** using \`***bolditalic***\`
- ~~Strikethrough text~~ using \`~~strike~~\`
- ==Highlighted text== using \`==highlight==\`

### Code Examples
- Inline code: \`console.log('Hello World')\`
- Code blocks:

\`\`\`
function calculateTotal(expenses) {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}
\`\`\`

### Links and URLs
- [Visit our website](https://www.expensetracker.com)
- Direct URL: https://www.github.com/expensetracker

### Lists and Quotes
> This is a blockquote example. Perfect for highlighting important information or testimonials.

#### Numbered Lists
1. First item with **bold text**
2. Second item with *italic text*
3. Third item with \`inline code\`

#### Bullet Points
- Feature one with ==highlighting==
- Feature two with ~~old feature~~
- Feature three with [link](https://example.com)

---

*Thank you for being a valued user! We're committed to making your financial management experience better with each update.*

**Questions?** Contact our support team at support@expensetracker.com`,
                            author: "Expense Tracker Team",
                            actionButton: {
                              text: "Update Now",
                              url: "https://apps.apple.com/app/expense-tracker",
                              action: "open_url"
                            },
                            tags: ["update", "features", "announcement", "new"]
                          }
                        };
                        setForm(sampleData);
                        setSuccess("Form auto-filled with sample data! You can modify any fields before sending.");
                      }}
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Auto Fill Sample Data
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isSending}
                      className="flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Notification
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* Notification History Tab */
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Notification History
                </h3>
                <button
                  onClick={loadNotificationHistory}
                  disabled={isLoadingHistory}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="p-6">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="text-gray-600">Loading notification history...</span>
                  </div>
                </div>
              ) : history && history.notifications.length > 0 ? (
                <div className="space-y-4">
                  {history.notifications.map((notification) => (
                    <div key={notification.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              notification.status === 'sent' ? 'bg-green-100 text-green-800' :
                              notification.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                              notification.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {notification.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.body}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Sent: {new Date(notification.createdAt).toLocaleString()}</span>
                            {notification.recipientCount && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                {notification.recipientCount} recipient{notification.recipientCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                  <p className="text-gray-600">No notifications have been sent yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
