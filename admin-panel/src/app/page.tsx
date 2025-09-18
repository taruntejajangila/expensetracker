import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, Smartphone, CreditCard, TrendingUp, Activity, AlertTriangle, CheckCircle, XCircle, FileSearch, Bell,
  BarChart3, PieChart, DollarSign, Clock, Zap, Shield, Globe, Server, Database
} from 'lucide-react'
import { 
  LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import adminAPI, { SystemStats, SystemHealth, LiveTraffic } from './services/api'


export default function Dashboard() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [liveTraffic, setLiveTraffic] = useState<LiveTraffic | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [alertsCount, setAlertsCount] = useState(0)

  // Sample data for charts
  const trafficData = [
    { name: 'Mon', users: 4000, sessions: 2400, revenue: 2400 },
    { name: 'Tue', users: 3000, sessions: 1398, revenue: 2210 },
    { name: 'Wed', users: 2000, sessions: 9800, revenue: 2290 },
    { name: 'Thu', users: 2780, sessions: 3908, revenue: 2000 },
    { name: 'Fri', users: 1890, sessions: 4800, revenue: 2181 },
    { name: 'Sat', users: 2390, sessions: 3800, revenue: 2500 },
    { name: 'Sun', users: 3490, sessions: 4300, revenue: 2100 },
  ]

  const deviceData = [
    { name: 'Mobile', value: 65, color: '#8884d8' },
    { name: 'Desktop', value: 25, color: '#82ca9d' },
    { name: 'Tablet', value: 10, color: '#ffc658' },
  ]

  const categoryData = [
    { name: 'Food', amount: 400, color: '#ff6b6b' },
    { name: 'Transport', amount: 300, color: '#4ecdc4' },
    { name: 'Entertainment', amount: 200, color: '#45b7d1' },
    { name: 'Shopping', amount: 150, color: '#f9ca24' },
    { name: 'Other', amount: 100, color: '#6c5ce7' },
  ]

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('Loading dashboard data...')

      // Load system stats, health, live traffic, and additional data in parallel
      const [statsData, healthData, liveTrafficData, alertsData] = await Promise.all([
        adminAPI.getSystemStats().catch(err => {
          console.error('Failed to load stats:', err)
          return null
        }),
        adminAPI.getSystemHealth().catch(err => {
          console.error('Failed to load health:', err)
          return null
        }),
        adminAPI.getLiveTraffic().catch(err => {
          console.error('Failed to load live traffic:', err)
          return null
        }),
        adminAPI.getAlerts().catch(err => {
          console.error('Failed to load alerts:', err)
          return { data: [] }
        })
      ])

      console.log('Stats data:', statsData)
      console.log('Health data:', healthData)
      console.log('Stats data type:', typeof statsData)
      console.log('Health data type:', typeof healthData)
      console.log('Stats data keys:', statsData ? Object.keys(statsData) : 'null')
      console.log('Health data keys:', healthData ? Object.keys(healthData) : 'null')

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
      
      console.log('Dashboard data loaded successfully')
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
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
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalUsers.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">+12.5%</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.activeUsers.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">+8.2%</span>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-600">Live Traffic</p>
                  {liveTraffic && liveTraffic.liveUsers > 0 && (
                    <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {liveTraffic ? liveTraffic.liveUsers.toLocaleString() : '0'}
                </p>
                <div className="text-xs text-gray-500 mt-2">
                  <p>{liveTraffic ? `${liveTraffic.hourlyActive} active (2h)` : '0 active (2h)'}</p>
                </div>
              </div>
              <div className={`p-3 rounded-full ${
                liveTraffic && liveTraffic.liveUsers > 0 ? 'bg-green-50' : 'bg-gray-50'
              }`}>
                <Smartphone className={`h-8 w-8 ${
                  liveTraffic && liveTraffic.liveUsers > 0 ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <div className="flex items-center mt-2">
                  {getHealthIcon(stats.systemHealth)}
                  <span className={`ml-2 text-xl font-bold ${getHealthColor(stats.systemHealth)}`}>
                    {stats.systemHealth.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center mt-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-blue-600 ml-1">All systems operational</span>
                </div>
              </div>
              <div className={`p-3 rounded-full ${
                stats.systemHealth === 'healthy' ? 'bg-green-50' : 
                stats.systemHealth === 'warning' ? 'bg-yellow-50' : 'bg-red-50'
              }`}>
                <Shield className={`h-8 w-8 ${
                  stats.systemHealth === 'healthy' ? 'text-green-600' : 
                  stats.systemHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'
                }`} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Weekly Traffic</h3>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">Last 7 days</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Device Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Device Distribution</h3>
              <div className="flex items-center space-x-2">
                <PieChart className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">User devices</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-6 mt-4">
              {deviceData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Analytics</h3>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600">Last 7 days</span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Health Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health Status */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center mb-6">
              <Shield className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
            </div>
            {health && (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Database className="h-5 w-5 text-gray-500 mr-3" />
                    <span className="text-gray-600">Database Status</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`font-medium ${
                      health.database === 'connected' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {health.database.toUpperCase()}
                    </span>
                    <div className={`w-2 h-2 rounded-full ml-2 ${
                      health.database === 'connected' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 text-gray-500 mr-3" />
                    <span className="text-gray-600">API Status</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`font-medium ${
                      health.api === 'healthy' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {health.api.toUpperCase()}
                    </span>
                    <div className={`w-2 h-2 rounded-full ml-2 ${
                      health.api === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Server className="h-5 w-5 text-gray-500 mr-3" />
                    <span className="text-gray-600">Memory Usage</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
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
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Zap className="h-5 w-5 text-gray-500 mr-3" />
                    <span className="text-gray-600">CPU Usage</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
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
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-500 mr-3" />
                    <span className="text-gray-600">Uptime</span>
                  </div>
                  <span className="font-medium text-green-600">{Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/users')}
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
                onClick={() => navigate('/monitoring')}
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
                onClick={() => navigate('/reports')}
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
                onClick={() => navigate('/logs')}
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
                  onClick={() => navigate('/alerts')}
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
