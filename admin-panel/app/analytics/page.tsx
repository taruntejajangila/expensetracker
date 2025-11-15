'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart, LineChart, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, CartesianGrid, XAxis, YAxis, Bar, Line, AreaChart, Area } from 'recharts'
import { Activity, AlertTriangle, BarChart3, Calendar, CheckCircle, Clock, CreditCard, DollarSign, Download, Eye, Filter, Gauge, Layers, PieChart as PieChartIcon, RefreshCw, Search, Server, ShoppingBag, Smartphone, Target, TrendingDown, TrendingUp, Users, Zap } from 'lucide-react'
import adminAPI, { AnalyticsResponse, PeriodOption } from '../services/api'
import { formatNumber } from '@/utils/numberFormatter'

export default function AnalyticsPage() {
  const [usageAnalytics, setUsageAnalytics] = useState<UsageAnalytics | null>(null)
  const [performanceAnalytics, setPerformanceAnalytics] = useState<PerformanceAnalytics | null>(null)
  const [trendsAnalytics, setTrendsAnalytics] = useState<TrendsAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState(30) // days
  const [selectedTrendPeriod, setSelectedTrendPeriod] = useState(12) // months

  useEffect(() => {
    loadAnalyticsData()
  }, [selectedPeriod, selectedTrendPeriod])

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [usage, performance, trends] = await Promise.all([
        adminAPI.getUsageAnalytics(selectedPeriod),
        adminAPI.getPerformanceAnalytics(),
        adminAPI.getTrendsAnalytics(selectedTrendPeriod)
      ])

      setUsageAnalytics(usage)
      setPerformanceAnalytics(performance)
      setTrendsAnalytics(trends)
    } catch (err) {
      console.error('Failed to load analytics data:', err)
      setError('Failed to load analytics data. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatPercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (isLoading && !usageAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error && !usageAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Activity className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAnalyticsData}
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
          <h1 className="text-3xl font-bold text-gray-900">System Usage Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into app usage, user behavior, and system performance</p>
        </div>
        <button
          onClick={loadAnalyticsData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Usage Period:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Trends Period:</span>
          <select
            value={selectedTrendPeriod}
            onChange={(e) => setSelectedTrendPeriod(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
            <option value={24}>Last 24 months</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Overview */}
      {usageAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Daily Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{usageAnalytics.activeUsers.daily}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Weekly Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{usageAnalytics.activeUsers.weekly}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Session Duration</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(usageAnalytics.sessionMetrics.avgDurationSeconds)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Users with Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{usageAnalytics.sessionMetrics.usersWithSessions}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Adoption */}
      {usageAnalytics && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Feature Adoption Rates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {usageAnalytics.featureAdoption.map((feature) => (
              <div key={feature.feature} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPercentage(feature.users_with_feature, feature.total_users)}%
                </div>
                <div className="text-sm font-medium text-gray-700 capitalize">
                  {feature.feature.replace('_', ' ')}
                </div>
                <div className="text-xs text-gray-500">
                  {feature.users_with_feature} of {feature.total_users} users
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Patterns Chart */}
      {usageAnalytics && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <LineChart className="h-5 w-5 mr-2" />
            Daily Usage Patterns (Last {selectedPeriod} days)
          </h3>
          <div className="space-y-3">
            {usageAnalytics.usagePatterns.slice(0, 10).map((pattern) => (
              <div key={pattern.date} className="flex items-center space-x-4">
                <div className="w-24 text-sm font-medium text-gray-700">
                  {new Date(pattern.date).toLocaleDateString()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-16 text-xs text-gray-500">Users: {pattern.active_users}</div>
                    <div className="w-20 text-xs text-gray-500">Total: {pattern.total_transactions}</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(pattern.total_transactions / Math.max(...usageAnalytics.usagePatterns.map(p => p.total_transactions))) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-green-600">+{pattern.income_count}</div>
                  <div className="text-red-600">-{pattern.expense_count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Engagement */}
      {usageAnalytics && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            User Engagement Analysis
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Features Used</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usageAnalytics.userEngagement.slice(0, 10).map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.transaction_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-2">
                        {user.budget_count > 0 && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Budgets</span>}
                        {user.goal_count > 0 && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Goals</span>}
                        {user.loan_count > 0 && <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Loans</span>}
                        {user.credit_card_count > 0 && <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Cards</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.last_activity).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEngagementColor(user.engagement_level)}`}>
                        {user.engagement_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {performanceAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API Performance */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              API Performance
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Response Time:</span>
                <span className="font-medium">{performanceAnalytics.apiPerformance.overall.avgResponseTime}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">P95 Response Time:</span>
                <span className="font-medium">{performanceAnalytics.apiPerformance.overall.p95ResponseTime}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Requests:</span>
                <span className="font-medium">{formatNumber(performanceAnalytics.apiPerformance.overall.totalRequests)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Error Rate:</span>
                <span className="font-medium">{performanceAnalytics.errorRates.api.errorRate}%</span>
              </div>
            </div>
          </div>

          {/* System Resources */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Gauge className="h-5 w-5 mr-2" />
              System Resources
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Memory Usage</span>
                  <span className="text-sm font-medium text-gray-900">{performanceAnalytics.systemResources.memory.used}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      performanceAnalytics.systemResources.memory.used > 90 ? 'bg-red-600' : 
                      performanceAnalytics.systemResources.memory.used > 80 ? 'bg-yellow-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${performanceAnalytics.systemResources.memory.used}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">CPU Usage</span>
                  <span className="text-sm font-medium text-gray-900">{performanceAnalytics.systemResources.cpu.usage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      performanceAnalytics.systemResources.cpu.usage > 90 ? 'bg-red-600' : 
                      performanceAnalytics.systemResources.cpu.usage > 80 ? 'bg-yellow-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${performanceAnalytics.systemResources.cpu.usage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trends Overview */}
      {trendsAnalytics && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Growth Trends (Last {selectedTrendPeriod} months)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Growth */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">User Growth</h4>
              <div className="space-y-2">
                {trendsAnalytics.userGrowth.slice(-6).map((month) => (
                  <div key={month.month} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {new Date(month.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-green-600">+{month.new_users}</span>
                      <span className="text-sm text-gray-900">{month.cumulative_users}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Peak Usage Hours */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Peak Usage Hours</h4>
              <div className="space-y-2">
                {trendsAnalytics.peakUsage.map((hour) => (
                  <div key={hour.hour} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {hour.hour}:00 {hour.hour < 12 ? 'AM' : 'PM'}
                    </span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-blue-600">{hour.transaction_count}</span>
                      <span className="text-sm text-gray-500">({hour.active_users} users)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {usageAnalytics ? new Date().toLocaleString() : 'N/A'}
      </div>
    </div>
  )
}
