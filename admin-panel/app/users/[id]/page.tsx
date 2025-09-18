'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, User, Mail, Calendar, Activity, CreditCard, TrendingUp, AlertCircle, RefreshCw, DollarSign, Laptop, Briefcase, Home, Gift, Plus, ShoppingCart, Utensils, Zap, ShoppingBag, Film, Car, Plane, CreditCard as CardIcon, Heart, GraduationCap, TrendingUp as TrendingUpIcon, Users, Clock, Wifi } from 'lucide-react'
import adminAPI from '../../services/api'

interface UserDetails {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
  lastLoginAt?: string
  lastActiveAt?: string
  transactionCount: number
  // Additional user data we'll fetch
  transactions?: any[]
  categories?: any[]
  accounts?: any[]
  goals?: any[]
  loans?: any[]
  creditCards?: any[]
  budgets?: any[]
}

export default function UserDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  
  const [user, setUser] = useState<UserDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (userId) {
      loadUserDetails()
    }
  }, [userId])

  const loadUserDetails = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch comprehensive user data
      const userData = await adminAPI.getUserDetails(userId)
      setUser(userData)
    } catch (err) {
      console.error('Failed to load user details:', err)
      setError('Failed to load user details. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status as keyof typeof statusClasses]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

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

  // Category display component
  const CategoryItem = ({ category }: { category: any }) => {
    return (
      <div className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="w-10 h-10 flex items-center justify-center text-2xl">
          {getCategoryEmoji(category.name)}
        </div>
        <div className="flex-1">
          <div className="font-medium text-gray-900">{category.name}</div>
          <div className="text-xs text-gray-500">
            Created: {new Date(category.created_at).toLocaleDateString()}
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          category.is_default 
            ? 'bg-gray-100 text-gray-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {category.is_default ? 'Default' : 'Custom'}
        </span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <AlertCircle className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading User</h3>
          <p className="text-gray-600 mb-4">{error || 'User not found'}</p>
          <button
            onClick={loadUserDetails}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
            <p className="text-gray-600">Comprehensive view of {user.name}'s data</p>
          </div>
        </div>
        <button
          onClick={loadUserDetails}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* User Overview Card */}
      <div className="card">
        <div className="flex items-start space-x-6">
          <div className="p-3 bg-blue-100 rounded-lg">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              {getStatusBadge(user.status)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{user.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {user.lastActiveAt ? `Last active ${formatRelativeTime(user.lastActiveAt)}` : 'Never active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'transactions', label: 'Transactions', icon: CreditCard },
            { id: 'categories', label: 'Categories', icon: Activity },
            { id: 'accounts', label: 'Accounts', icon: User },
            { id: 'goals', label: 'Goals', icon: TrendingUp },
            { id: 'loans', label: 'Loans', icon: CreditCard },
            { id: 'creditCards', label: 'Credit Cards', icon: CreditCard },
            { id: 'budgets', label: 'Budgets', icon: TrendingUp }
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
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="card">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Account Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{user.transactionCount}</div>
                <div className="text-sm text-blue-600">Total Transactions</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {user.categories?.length || 0}
                </div>
                <div className="text-sm text-green-600">Categories</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {user.accounts?.length || 0}
                </div>
                <div className="text-sm text-purple-600">Accounts</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {user.goals?.length || 0}
                </div>
                <div className="text-sm text-yellow-600">Goals</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {user.budgets?.length || 0}
                </div>
                <div className="text-sm text-orange-600">Budgets</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            {user.transactions && user.transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4 font-medium text-gray-900">Date</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-900">Description</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-900">Category</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-900">Amount</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-900">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.transactions.map((transaction: any) => (
                      <tr key={transaction.id} className="border-b border-gray-100">
                        <td className="py-2 px-4 text-sm text-gray-600">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-4 text-sm text-gray-900">{transaction.description}</td>
                                                 <td className="py-2 px-4 text-sm text-gray-600">{transaction.category_name || 'Uncategorized'}</td>
                        <td className="py-2 px-4 text-sm text-gray-900">
                          <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                            {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No transactions found</p>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Available Categories</h3>
            {user.categories && user.categories.length > 0 ? (
              <div className="space-y-8">
                {/* Summary Stats */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Category Summary</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        {user.categories.filter((cat: any) => cat.type === 'income' && cat.is_default).length}
                      </div>
                      <div className="text-xs text-gray-600">Default Income</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-blue-600">
                        {user.categories.filter((cat: any) => cat.type === 'income' && !cat.is_default).length}
                      </div>
                      <div className="text-xs text-gray-600">Custom Income</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-red-600">
                        {user.categories.filter((cat: any) => cat.type === 'expense' && cat.is_default).length}
                      </div>
                      <div className="text-xs text-gray-600">Default Expense</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-purple-600">
                        {user.categories.filter((cat: any) => cat.type === 'expense' && !cat.is_default).length}
                      </div>
                      <div className="text-xs text-gray-600">Custom Expense</div>
                    </div>
                  </div>
                </div>

                {/* Income Categories */}
                      <div>
                  <h4 className="text-md font-semibold text-green-700 mb-4 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Income Categories
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Default Income Categories */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
                        Default Income Categories
                      </h5>
                      <div className="space-y-2">
                        {user.categories
                          .filter((cat: any) => cat.type === 'income' && cat.is_default)
                          .map((category: any) => (
                            <CategoryItem key={category.id} category={category} />
                          ))}
                      </div>
                    </div>

                    {/* Custom Income Categories */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
                        Custom Income Categories
                      </h5>
                      <div className="space-y-2">
                        {user.categories
                          .filter((cat: any) => cat.type === 'income' && !cat.is_default)
                          .map((category: any) => (
                            <CategoryItem key={category.id} category={category} />
                          ))}
                        {user.categories.filter((cat: any) => cat.type === 'income' && !cat.is_default).length === 0 && (
                          <p className="text-sm text-gray-500 italic">No custom income categories</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expense Categories */}
                <div>
                  <h4 className="text-md font-semibold text-red-700 mb-4 flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    Expense Categories
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Default Expense Categories */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
                        Default Expense Categories
                      </h5>
                      <div className="space-y-2">
                        {user.categories
                          .filter((cat: any) => cat.type === 'expense' && cat.is_default)
                          .map((category: any) => (
                            <CategoryItem key={category.id} category={category} />
                          ))}
                      </div>
                    </div>

                    {/* Custom Expense Categories */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
                        Custom Expense Categories
                      </h5>
                      <div className="space-y-2">
                        {user.categories
                          .filter((cat: any) => cat.type === 'expense' && !cat.is_default)
                          .map((category: any) => (
                            <CategoryItem key={category.id} category={category} />
                          ))}
                        {user.categories.filter((cat: any) => cat.type === 'expense' && !cat.is_default).length === 0 && (
                          <p className="text-sm text-gray-500 italic">No custom expense categories</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No categories found</p>
            )}
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">User Accounts</h3>
            {user.accounts && user.accounts.length > 0 ? (
              <div className="space-y-6">
                {/* Bank Accounts */}
                <div>
                  <h4 className="text-md font-semibold text-blue-700 mb-4 flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    Bank Accounts
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.accounts
                      .filter((account: any) => account.type !== 'wallet')
                      .map((account: any) => (
                        <div key={account.id} className="p-6 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{account.name}</div>
                                <div className="text-sm text-gray-600 capitalize">{account.type} Account</div>
                              </div>
                            </div>
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Active
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Balance</span>
                              <span className="text-lg font-bold text-gray-900">
                                ₹{parseFloat(account.balance || 0).toLocaleString()}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Currency</span>
                              <span className="text-sm font-medium text-gray-900">{account.currency || 'INR'}</span>
                            </div>
                            
                            {account.bank_name && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Bank</span>
                                <span className="text-sm font-medium text-gray-900">{account.bank_name}</span>
                              </div>
                            )}
                            
                            {account.account_number && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Account Number</span>
                                <span className="text-sm font-mono text-gray-900">
                                  ****{account.account_number.slice(-4)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Cash Wallet */}
                <div>
                  <h4 className="text-md font-semibold text-green-700 mb-4 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Cash Wallet
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.accounts
                      .filter((account: any) => account.type === 'wallet')
                      .map((account: any) => (
                        <div key={account.id} className="p-6 border border-gray-200 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{account.name}</div>
                                <div className="text-sm text-gray-600">Digital Wallet</div>
                              </div>
                            </div>
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Active
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Balance</span>
                              <span className="text-lg font-bold text-gray-900">
                                ₹{parseFloat(account.balance || 0).toLocaleString()}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Currency</span>
                              <span className="text-sm font-medium text-gray-900">{account.currency || 'INR'}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Type</span>
                              <span className="text-sm font-medium text-gray-900">Digital Cash</span>
                            </div>
                          </div>
                  </div>
                ))}
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Account Summary</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-blue-600">
                        {user.accounts.filter((acc: any) => acc.type !== 'wallet').length}
                      </div>
                      <div className="text-xs text-gray-600">Bank Accounts</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        {user.accounts.filter((acc: any) => acc.type === 'wallet').length}
                      </div>
                      <div className="text-xs text-gray-600">Cash Wallets</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-600">
                        ₹{user.accounts.reduce((total: number, acc: any) => total + parseFloat(acc.balance || 0), 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">Total Balance</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-purple-600">
                        {user.accounts.filter((acc: any) => parseFloat(acc.balance || 0) > 0).length}
                      </div>
                      <div className="text-xs text-gray-600">Active Accounts</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No accounts found</p>
            )}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">User Goals</h3>
            {user.goals && user.goals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.goals.map((goal: any) => (
                  <div key={goal.id} className="p-4 border border-gray-200 rounded-lg">
                                             <div className="font-medium text-gray-900">{goal.name}</div>
                    <div className="text-sm text-gray-500">
                      Target: ₹{goal.target_amount} | Current: ₹{goal.current_amount || 0}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No goals found</p>
            )}
          </div>
        )}

        {activeTab === 'loans' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">User Loans</h3>
            {user.loans && user.loans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.loans.map((loan: any) => (
                  <div key={loan.id} className="p-4 border border-gray-200 rounded-lg">
                                             <div className="font-medium text-gray-900">{loan.name}</div>
                    <div className="text-sm text-gray-500">
                      Amount: ₹{loan.amount} | Status: {loan.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No loans found</p>
            )}
          </div>
        )}

        {activeTab === 'creditCards' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">User Credit Cards</h3>
            {user.creditCards && user.creditCards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.creditCards.map((card: any) => (
                  <div key={card.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="font-medium text-gray-900">{card.name}</div>
                    <div className="text-sm text-gray-500">
                      Limit: ₹{card.credit_limit} | Balance: ₹{card.current_balance || 0}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No credit cards found</p>
            )}
          </div>
        )}

        {activeTab === 'budgets' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">User Budgets</h3>
            {user.budgets && user.budgets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.budgets.map((budget: any) => {
                  const spentPercentage = (budget.spent / budget.amount) * 100;
                  const isOverBudget = spentPercentage > 100;
                  const isUnderBudget = spentPercentage < 80;
                  
                  return (
                    <div key={budget.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="font-medium text-gray-900">{budget.name}</div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <div>Budget: ₹{budget.amount}</div>
                        <div>Spent: ₹{budget.spent}</div>
                        <div>Period: {budget.period}</div>
                        <div className={`font-medium ${
                          isOverBudget ? 'text-red-600' : 
                          isUnderBudget ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          Status: {budget.status}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              isOverBudget ? 'bg-red-500' : 
                              isUnderBudget ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {spentPercentage.toFixed(1)}% used
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No budgets found</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
