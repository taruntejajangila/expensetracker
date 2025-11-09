'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Smartphone, CreditCard, TrendingUp, Activity, DollarSign, AlertTriangle, CheckCircle, XCircle, FileSearch, Bell } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import adminAPI, { SystemStats, SystemHealth, LiveTraffic } from './services/api'
import { formatNumber } from '@/utils/numberFormatter'


export default function Dashboard() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [liveTraffic, setLiveTraffic] = useState<LiveTraffic | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [alertsCount, setAlertsCount] = useState(0)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('🔄 Loading dashboard data...')

      // Load system stats, health, live traffic, and additional data in parallel
      const [statsData, healthData, liveTrafficData, alertsData] = await Promise.all([
        adminAPI.getSystemStats().catch(err => {
          console.error('❌ Failed to load stats:', err)
          return null
        }),
        adminAPI.getSystemHealth().catch(err => {
          console.error('❌ Failed to load health:', err)
          return null
        }),
        adminAPI.getLiveTraffic().catch(err => {
          console.error('❌ Failed to load live traffic:', err)
          return null
        }),
        adminAPI.getAlerts().catch(err => {
          console.error('❌ Failed to load alerts:', err)
          return { data: [] }
        })
      ])

      console.log('📊 Stats data:', statsData)
      console.log('🏥 Health data:', healthData)
      console.log('📊 Stats data type:', typeof statsData)
      console.log('🏥 Health data type:', typeof healthData)
      console.log('📊 Stats data keys:', statsData ? Object.keys(statsData) : 'null')
      console.log('🏥 Health data keys:', healthData ? Object.keys(healthData) : 'null')

      if (!statsData || !healthData) {
        throw new Error('Failed to load required dashboard data')
      }

      setStats(statsData)
      setHealth(healthData)
      setLiveTraffic(liveTrafficData)
      setAlertsCount(alertsData && 'data' in alertsData ? alertsData.data.length : 0)
      
             // Generate recent activity including live traffic
       const activities = [
         { id: 1, type: 'user', message: 'New user registered', time: '2 minutes ago', icon: Users },
         { id: 2, type: 'traffic', message: `${liveTrafficData?.liveUsers || 0} users currently online`, time: 'Just now', icon: Smartphone },
         { id: 3, type: 'traffic', message: `${liveTrafficData?.hourlyActive || 0} users active in last 2 hours`, time: 'Just now', icon: Activity },
         { id: 4, type: 'transaction', message: 'Large transaction processed', time: '5 minutes ago', icon: CreditCard },
         { id: 5, type: 'system', message: 'System health check completed', time: '10 minutes ago', icon: CheckCircle }
       ]
      
             if (healthData && healthData.memory > 80) {
         activities.push({ id: 6, type: 'alert', message: 'High memory usage detected', time: '15 minutes ago', icon: AlertTriangle })
       }
      
      setRecentActivity(activities)
      
      console.log('✅ Dashboard data loaded successfully')
    } catch (err) {
      console.error('❌ Failed to load dashboard data:', err)
      setError('Failed to load dashboard data. Please check your connection.')
      // Set default values to prevent crashes
      setStats(null)
      setHealth(null)
    } finally {
      setIsLoading(false)
    }
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'critical':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <XCircle className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  // Don't render dashboard content until we have complete and valid data
  if (!stats || !health || 
      typeof stats.totalUsers !== 'number' || 
      typeof stats.activeUsers !== 'number' || 
      typeof stats.totalTransactions !== 'number' ||
      !stats.systemHealth) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
          {stats && (
            <div className="mt-4 text-sm text-gray-500">
              <p>Stats loaded: {stats ? 'Yes' : 'No'}</p>
              <p>Health loaded: {health ? 'Yes' : 'No'}</p>
              {stats && (
                <p>Stats structure: {JSON.stringify({
                  totalUsers: typeof stats.totalUsers,
                  activeUsers: typeof stats.activeUsers,
                  totalTransactions: typeof stats.totalTransactions,
                  systemHealth: stats.systemHealth
                })}</p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Real-time system monitoring and user management</p>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'N/A'}
          </div>
        </div>

        {/* System Health Alert */}
        {stats.systemHealth && stats.systemHealth !== 'healthy' && (
          <div className={`p-4 rounded-lg border ${
            stats.systemHealth === 'warning' 
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {getHealthIcon(stats.systemHealth)}
              <span className="ml-2 font-medium">
                System Status: {stats.systemHealth.toUpperCase()}
              </span>
            </div>
            <p className="mt-1 text-sm">
              {stats.systemHealth === 'warning' 
                ? 'System is experiencing high load. Monitor closely.'
                : 'System is under critical load. Immediate attention required.'
              }
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats.totalUsers)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats.activeUsers)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${
                liveTraffic && liveTraffic.liveUsers > 0 ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Smartphone className={`h-6 w-6 ${
                  liveTraffic && liveTraffic.liveUsers > 0 ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>
              <div className="ml-4">
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-600">Live Traffic</p>
                  {liveTraffic && liveTraffic.liveUsers > 0 && (
                    <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {liveTraffic ? formatNumber(liveTraffic.liveUsers) : '0'}
                </p>
                                 <div className="text-xs text-gray-500 space-y-1">
                   <p>{liveTraffic ? `${liveTraffic.hourlyActive} active (2h)` : '0 active (2h)'}</p>
                   <p>{liveTraffic ? `${liveTraffic.dailyActive} active today` : '0 active today'}</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <div className="flex items-center">
                  {getHealthIcon(stats.systemHealth)}
                  <span className={`ml-2 text-lg font-bold ${getHealthColor(stats.systemHealth)}`}>
                    {stats.systemHealth.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Health Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health Status */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            {health && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Database Status:</span>
                  <span className={`font-medium ${
                    health.database === 'connected' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {health.database.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">API Status:</span>
                  <span className={`font-medium ${
                    health.api === 'healthy' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {health.api.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Memory Usage:</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className={`h-2 rounded-full ${
                          health.memory > 80 ? 'bg-red-500' : 
                          health.memory > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${health.memory}%` }}
                      ></div>
                    </div>
                    <span className={`font-medium ${
                      health.memory > 80 ? 'text-red-600' : 
                      health.memory > 60 ? 'text-yellow-600' : 'text-green-600'
                    }`}>{health.memory}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">CPU Usage:</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className={`h-2 rounded-full ${
                          health.cpu > 80 ? 'bg-red-500' : 
                          health.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${health.cpu}%` }}
                      ></div>
                    </div>
                    <span className={`font-medium ${
                      health.cpu > 80 ? 'text-red-600' : 
                      health.cpu > 60 ? 'text-yellow-600' : 'text-green-600'
                    }`}>{health.cpu}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Uptime:</span>
                  <span className="font-medium">{Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => router.push('/users')}
                className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="font-medium text-blue-900">View All Users</span>
                  </div>
                  <span className="text-sm text-blue-600">→</span>
                </div>
              </button>
              <button 
                onClick={() => router.push('/monitoring')}
                className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 text-green-600 mr-3" />
                    <span className="font-medium text-green-900">System Monitoring</span>
                  </div>
                  <span className="text-sm text-green-600">→</span>
                </div>
              </button>
              <button 
                onClick={() => router.push('/reports')}
                className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-purple-600 mr-3" />
                    <span className="font-medium text-purple-900">Transaction Reports</span>
                  </div>
                  <span className="text-sm text-purple-600">→</span>
                </div>
              </button>
              <button 
                onClick={() => router.push('/logs')}
                className="w-full p-3 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileSearch className="h-5 w-5 text-orange-600 mr-3" />
                    <span className="font-medium text-orange-900">System Logs</span>
                  </div>
                  <span className="text-sm text-orange-600">→</span>
                </div>
              </button>
              {alertsCount > 0 && (
                <button 
                  onClick={() => router.push('/alerts')}
                  className="w-full p-3 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Bell className="h-5 w-5 text-red-600 mr-3" />
                      <span className="font-medium text-red-900">Active Alerts</span>
                    </div>
                    <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                      {alertsCount}
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => {
              const IconComponent = activity.icon
              return (
                <div key={activity.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <IconComponent className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-center">
          <button
            onClick={loadDashboardData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Activity className="h-5 w-5 mr-2" />
            Refresh Data
          </button>
        </div>
      </div>
  )
}
