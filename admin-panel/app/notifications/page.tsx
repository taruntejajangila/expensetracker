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
  userEmail: string
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
  const [form, setForm] = useState<NotificationForm>({
    title: '',
    body: '',
    targetAll: true,
    userEmail: ''
  })

  useEffect(() => {
    loadNotificationStats()
  }, [])

  const loadNotificationHistory = async () => {
    try {
      setIsLoadingHistory(true)
      setError(null)

      const adminToken = localStorage.getItem('adminToken')
      if (!adminToken) {
        setError('No admin token found. Please login again.')
        return
      }

      const response = await fetch('http://localhost:5001/api/notifications/history?days=7&limit=20', {
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

      if (!form.targetAll && !form.userEmail.trim()) {
        setError('User email is required when not targeting all users')
        return
      }

      // Send notification through our test notification server
      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),
        targetAll: form.targetAll,
        ...(form.targetAll ? {} : { userEmail: form.userEmail.trim() }),
        data: {
          type: 'admin_notification',
          from: 'admin_panel'
        }
      }

      // Get the admin token from localStorage
      const adminToken = localStorage.getItem('adminToken')
      if (!adminToken) {
        setError('No admin token found. Please login again.')
        return
      }

      // Send directly to backend API
      const response = await fetch('http://localhost:5001/api/notifications/send', {
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

      setSuccess('Notification sent successfully! It will appear on mobile devices within 5 seconds.')
      setForm({
        title: '',
        body: '',
        targetAll: true,
        userEmail: ''
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
                          onChange={() => setForm({ ...form, targetAll: true, userEmail: '' })}
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
                        <span className="ml-2 text-sm text-gray-700">Specific User</span>
                      </label>
                    </div>
                  </div>

                  {/* User Email (if specific user) */}
                  {!form.targetAll && (
                    <div>
                      <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-2">
                        User Email
                      </label>
                      <input
                        type="email"
                        id="userEmail"
                        value={form.userEmail}
                        onChange={(e) => setForm({ ...form, userEmail: e.target.value })}
                        placeholder="user@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required={!form.targetAll}
                      />
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
                      Message *
                    </label>
                    <textarea
                      id="body"
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                      placeholder="Notification message"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Send Button */}
                  <div className="flex justify-end">
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
                            <span>Created: {new Date(notification.createdAt).toLocaleString()}</span>
                            {notification.targetUser && (
                              <span>To: {notification.targetUser.email}</span>
                            )}
                            {!notification.targetUser && (
                              <span>To: All Users</span>
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
