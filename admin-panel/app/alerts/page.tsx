'use client'

import { useState, useEffect } from 'react'
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  Settings,
  RefreshCw,
  Eye,
  EyeOff,
  Mail,
  Smartphone,
  Monitor
} from 'lucide-react'
import adminAPI, {
  AlertSystem,
  AlertConfigurations,
  NotificationSystem,
  EscalationRules
} from '../services/api'
import { formatCurrency } from '@/utils/numberFormatter'

export default function AlertsPage() {
  const [alertSystem, setAlertSystem] = useState<AlertSystem | null>(null)
  const [alertConfigs, setAlertConfigs] = useState<AlertConfigurations | null>(null)
  const [notifications, setNotifications] = useState<NotificationSystem | null>(null)
  const [escalationRules, setEscalationRules] = useState<EscalationRules | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('alerts')

  useEffect(() => {
    loadAlertsData()
  }, [])

  const loadAlertsData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [alerts, configs, notifs, escalation] = await Promise.all([
        adminAPI.getAlerts(),
        adminAPI.getAlertConfigurations(),
        adminAPI.getNotifications(),
        adminAPI.getEscalationRules()
      ])

      setAlertSystem(alerts)
      setAlertConfigs(configs)
      setNotifications(notifs)
      setEscalationRules(escalation)
    } catch (err) {
      console.error('Failed to load alerts data:', err)
      setError('Failed to load alerts data. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const markNotificationAsRead = async (id: string) => {
    try {
      await adminAPI.markNotificationAsRead(id)
      // Refresh notifications
      const notifs = await adminAPI.getNotifications()
      setNotifications(notifs)
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />
      default:
        return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }


  if (isLoading && !alertSystem) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error && !alertSystem) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Bell className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAlertsData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alert System</h1>
          <p className="text-gray-600">Monitor system alerts, configure notifications, and manage escalation rules</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadAlertsData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Alert Statistics */}
      {alertSystem && alertSystem.statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {alertSystem.statistics.map((stat) => (
            <div key={stat.severity} className="card">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  {getSeverityIcon(stat.severity)}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 capitalize">{stat.severity} Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'alerts', name: 'Active Alerts', icon: Bell },
            { id: 'notifications', name: 'Notifications', icon: Mail },
            { id: 'config', name: 'Configuration', icon: Settings },
            { id: 'escalation', name: 'Escalation Rules', icon: AlertTriangle }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Active Alerts Tab */}
        {activeTab === 'alerts' && alertSystem && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Active Alerts
              </h3>
              <div className="space-y-4">
                {!alertSystem.alerts || alertSystem.alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">No active alerts at the moment</p>
                  </div>
                ) : (
                  alertSystem.alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getSeverityIcon(alert.severity)}
                          <div>
                            <h4 className="font-medium">{alert.message}</h4>
                            <p className="text-sm opacity-75 mt-1">{alert.details}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm">
                              <span>User: {alert.user_name}</span>
                              <span>Value: {typeof alert.value === 'number' ? formatCurrency(alert.value) : alert.value}</span>
                              <span>Triggered: {formatDate(alert.triggered_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-1 hover:bg-white hover:bg-opacity-20 rounded">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1 hover:bg-white hover:bg-opacity-20 rounded">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && notifications && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Notification History
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {notifications?.unreadCount || 0} unread
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                {notifications?.notifications?.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg ${
                      notification.readAt ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getSeverityIcon(notification.severity)}
                        <div>
                          <h4 className="font-medium">{notification.message}</h4>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center">
                              {notification.channel === 'email' && <Mail className="h-3 w-3 mr-1" />}
                              {notification.channel === 'sms' && <Smartphone className="h-3 w-3 mr-1" />}
                              {notification.channel === 'dashboard' && <Monitor className="h-3 w-3 mr-1" />}
                              {notification.channel}
                            </span>
                            <span>To: {notification.recipient}</span>
                            <span>Sent: {formatDate(notification.sentAt)}</span>
                            {notification.readAt && (
                              <span>Read: {formatDate(notification.readAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!notification.readAt && (
                          <button
                            onClick={() => markNotificationAsRead(notification.id)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          notification.status === 'sent' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {notification.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Configuration Tab */}
        {activeTab === 'config' && alertConfigs && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Alert Configuration
              </h3>
              <div className="space-y-6">
                {/* Large Transaction Alerts */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium">Large Transaction Alerts</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        alertConfigs?.largeTransaction?.enabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {alertConfigs?.largeTransaction?.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <button className="text-blue-600 hover:text-blue-900 text-sm">
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Threshold:</span> {alertConfigs?.largeTransaction?.threshold || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Severity:</span> 
                      <span className={`ml-1 px-2 py-1 text-xs rounded-full ${getSeverityColor(alertConfigs?.largeTransaction?.severity || 'low')}`}>
                        {alertConfigs?.largeTransaction?.severity || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Channels:</span> {alertConfigs?.largeTransaction?.notificationChannels?.join(', ') || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Inactive User Alerts */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium">Inactive User Alerts</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        alertConfigs?.inactiveUser?.enabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {alertConfigs?.inactiveUser?.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <button className="text-blue-600 hover:text-blue-900 text-sm">
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Threshold:</span> {alertConfigs?.inactiveUser?.threshold || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Severity:</span> 
                      <span className={`ml-1 px-2 py-1 text-xs rounded-full ${getSeverityColor(alertConfigs?.inactiveUser?.severity || 'low')}`}>
                        {alertConfigs?.inactiveUser?.severity || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Channels:</span> {alertConfigs?.inactiveUser?.notificationChannels?.join(', ') || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Budget Exceeded Alerts */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium">Budget Exceeded Alerts</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        alertConfigs?.budgetExceeded?.enabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {alertConfigs?.budgetExceeded?.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <button className="text-blue-600 hover:text-blue-900 text-sm">
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Threshold:</span> {alertConfigs?.budgetExceeded?.threshold || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Severity:</span> 
                      <span className={`ml-1 px-2 py-1 text-xs rounded-full ${getSeverityColor(alertConfigs?.budgetExceeded?.severity || 'low')}`}>
                        {alertConfigs?.budgetExceeded?.severity || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Channels:</span> {alertConfigs?.budgetExceeded?.notificationChannels?.join(', ') || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* System Performance Alerts */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium">System Performance Alerts</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        alertConfigs?.systemPerformance?.enabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {alertConfigs?.systemPerformance?.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <button className="text-blue-600 hover:text-blue-900 text-sm">
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Threshold:</span> {alertConfigs?.systemPerformance?.threshold || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Severity:</span> 
                      <span className={`ml-1 px-2 py-1 text-xs rounded-full ${getSeverityColor(alertConfigs?.systemPerformance?.severity || 'low')}`}>
                        {alertConfigs?.systemPerformance?.severity || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Channels:</span> {alertConfigs?.systemPerformance?.notificationChannels?.join(', ') || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Escalation Rules Tab */}
        {activeTab === 'escalation' && escalationRules && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Escalation Rules
              </h3>
              <div className="space-y-4">
                {escalationRules?.levels?.map((level) => (
                  <div key={level.level} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-medium">{level.name}</h4>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        Level {level.level}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Delay:</span> {level.delay} minutes
                      </div>
                      <div>
                        <span className="font-medium">Channels:</span> {level.channels.join(', ')}
                      </div>
                      <div>
                        <span className="font-medium">Recipients:</span> {level.recipients.length}
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="font-medium text-sm">Recipients:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {level.recipients.map((recipient, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {recipient}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3">Auto-Resolution Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Enabled:</span> 
                    <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                      escalationRules?.autoResolve?.enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {escalationRules?.autoResolve?.enabled ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Timeout:</span> {escalationRules?.autoResolve?.timeout || 'N/A'} minutes
                  </div>
                </div>
                <div className="mt-3">
                  <span className="font-medium text-sm">Conditions:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {escalationRules?.autoResolve?.conditions?.map((condition, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                      >
                        {condition.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  )
}

