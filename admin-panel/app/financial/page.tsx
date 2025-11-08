'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  Users, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Calendar,
  LineChart,
  Activity,
  CreditCard,
  PiggyBank
} from 'lucide-react'
import adminAPI, { FinancialAnalytics, FinancialSummary } from '../services/api'

// Emoji mapping function for categories
const getCategoryEmoji = (categoryName: string) => {
  const emojiMap: { [key: string]: string } = {
    'Food & Dining': '🍽️',
    'Dining Out/Food Delivery': '🍽️',
    'Groceries': '🛒',
    'Transportation': '🚗',
    'Entertainment': '🎬',
    'Healthcare': '🏥',
    'Utilities': '⚡',
    'Shopping': '🛍️',
    'Education': '📚',
    'Travel': '✈️',
    'Salary': '💰',
    'Investment': '📈',
    'Savings': '🏦',
    'Bills': '📄',
    'Insurance': '🛡️',
    'Rent': '🏠',
    'Gas': '⛽',
    'Phone': '📱',
    'Internet': '🌐',
    'Clothing': '👕',
    'Beauty': '💄',
    'Sports': '⚽',
    'Gifts': '🎁',
    'Charity': '❤️',
    'Other': '💳',
  }
  return emojiMap[categoryName] || '💳'
}

export default function FinancialPage() {
  const [financialAnalytics, setFinancialAnalytics] = useState<FinancialAnalytics | null>(null)
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState(12) // months

  useEffect(() => {
    loadFinancialData()
  }, [selectedPeriod])

  const loadFinancialData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [analytics, summary] = await Promise.all([
        adminAPI.getFinancialAnalytics(selectedPeriod),
        adminAPI.getFinancialSummary()
      ])

             console.log('Financial Analytics Data:', analytics)
       console.log('Financial Summary Data:', summary)
       setFinancialAnalytics(analytics)
       setFinancialSummary(summary)
    } catch (err) {
      console.error('Failed to load financial data:', err)
      setError('Failed to load financial data. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: any) => {
    // Convert to number and handle all edge cases
    if (amount === null || amount === undefined) {
      return '₹0'
    }
    
    const numAmount = Number(amount)
    if (isNaN(numAmount)) {
      return '₹0'
    }
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount)
  }

  const formatPercentage = (value: any) => {
    // Convert to number and handle all edge cases
    if (value === null || value === undefined) {
      return '0.0%'
    }
    
    const numValue = Number(value)
    if (isNaN(numValue)) {
      return '0.0%'
    }
    
    return `${numValue.toFixed(1)}%`
  }

  const getFinancialHealthColor = (status: string | null | undefined) => {
    if (!status) return 'text-gray-600 bg-gray-100'
    
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'balanced': return 'text-yellow-600 bg-yellow-100'
      case 'at_risk': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getFinancialHealthIcon = (status: string | null | undefined) => {
    if (!status) return <Activity className="h-4 w-4" />
    
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />
      case 'balanced': return <AlertTriangle className="h-4 w-4" />
      case 'at_risk': return <AlertTriangle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (isLoading && !financialAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error && !financialAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <AlertTriangle className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadFinancialData}
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
          <h1 className="text-3xl font-bold text-gray-900">Financial Overview Dashboard</h1>
          <p className="text-gray-600">Comprehensive financial insights and analytics across all users</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
              <option value={24}>Last 24 months</option>
            </select>
          </div>
          <button
            onClick={loadFinancialData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Quick Financial Summary */}
      {financialSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(financialSummary.total_income)}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(financialSummary.total_expense)}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <PiggyBank className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Savings</p>
                                 <p className={`text-2xl font-bold ${(financialSummary.net_savings || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                   {formatCurrency(financialSummary.net_savings)}
                 </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{financialSummary.active_users}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Statistics */}
      {financialAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Aggregate Financial Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Financial Statistics (Last {selectedPeriod} months)
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{financialAnalytics.financialStats.total_transactions?.toLocaleString() || '0'}</div>
                  <div className="text-sm text-gray-600">Total Transactions</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{financialAnalytics.financialStats.active_users?.toLocaleString() || '0'}</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(financialAnalytics.financialStats.avg_income || 0)}</div>
                  <div className="text-sm text-gray-600">Avg Income</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(financialAnalytics.financialStats.avg_expense || 0)}</div>
                  <div className="text-sm text-gray-600">Avg Expense</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{formatCurrency(financialAnalytics.financialStats.highest_transaction || 0)}</div>
                  <div className="text-sm text-gray-600">Highest Transaction</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">{formatCurrency(financialAnalytics.financialStats.lowest_transaction || 0)}</div>
                  <div className="text-sm text-gray-600">Lowest Transaction</div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Income Sources */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Top Income Sources
            </h3>
            <div className="space-y-3">
                             {(financialAnalytics.topIncomeSources || []).slice(0, 5).map((source, index) => (
                <div key={source.category_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center text-2xl">
                      {getCategoryEmoji(source.category_name)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{source.category_name}</div>
                      <div className="text-sm text-gray-500">{source.transaction_count} transactions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{formatCurrency(source.total_income)}</div>
                    <div className="text-sm text-gray-500">{formatCurrency(source.avg_income)} avg</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Spending Analysis */}
      {financialAnalytics && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Category Spending Analysis
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Spent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                                 {(financialAnalytics.categorySpending || []).map((category) => (
                  <tr key={category.category_name}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-6 h-6 flex items-center justify-center text-lg mr-3">
                          {getCategoryEmoji(category.category_name)}
                        </div>
                        <div className="text-sm font-medium text-gray-900">{category.category_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                      {formatCurrency(category.total_spent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(category.avg_spent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.transaction_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.users_using_category}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Budget vs Actual Analysis */}
      {financialAnalytics && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Budget vs Actual Spending
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {(financialAnalytics.budgetAnalysis || []).map((budget) => (
                <div key={budget.category_name} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 flex items-center justify-center text-lg">
                      {getCategoryEmoji(budget.category_name)}
                    </div>
                    <span className="font-medium text-gray-900">{budget.category_name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{budget.users_with_budget} users</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-medium">{formatCurrency(budget.avg_budget_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Actual:</span>
                    <span className="font-medium">{formatCurrency(budget.total_actual_spent)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Utilization:</span>
                    <span className={`font-medium ${
                      (budget.budget_utilization_percentage || 0) > 100 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatPercentage(budget.budget_utilization_percentage)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Health Indicators */}
      {financialAnalytics && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            User Financial Health
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Savings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Savings Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                                 {(financialAnalytics.financialHealth || []).slice(0, 10).map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      {formatCurrency(user.total_income)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                      {formatCurrency(user.total_expense)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                                             <span className={(user.net_savings || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                         {formatCurrency(user.net_savings)}
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPercentage(user.savings_rate_percentage)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${getFinancialHealthColor(user.financial_health_status)}`}>
                        {getFinancialHealthIcon(user.financial_health_status)}
                        <span className="capitalize">{user.financial_health_status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly Financial Trends */}
      {financialAnalytics && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <LineChart className="h-5 w-5 mr-2" />
            Monthly Financial Trends
          </h3>
          <div className="space-y-3">
                         {(financialAnalytics.monthlyTrends || []).slice(-6).map((month) => (
              <div key={month.month} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-24 text-sm font-medium text-gray-700">
                  {new Date(month.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2 text-xs text-gray-500">
                    <span>Income: {formatCurrency(month.total_income)}</span>
                    <span>Expenses: {formatCurrency(month.total_expense)}</span>
                    <span>Net: {formatCurrency(month.net_savings)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                                             className={`h-2 rounded-full ${
                         (month.net_savings || 0) >= 0 ? 'bg-green-600' : 'bg-red-600'
                       }`}
                      style={{ 
                        width: `${Math.min(Math.abs(month.net_savings || 0) / Math.max(month.total_income || 1, month.total_expense || 1) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium text-gray-900">{month.transaction_count} transactions</div>
                  <div className="text-gray-500">{month.active_users} users</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {financialAnalytics ? new Date().toLocaleString() : 'N/A'}
      </div>
    </div>
  )
}
