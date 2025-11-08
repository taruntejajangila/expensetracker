// PaysaGo Admin Panel API Service
// Handles authenticated requests to the PaysaGo backend for admin operations.

import { API_BASE_URL } from '../../config/api.config';

export interface AdminUser {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
  lastLoginAt?: string
  lastActiveAt?: string
  transactionCount?: number
}

export interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalTransactions: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  lastUpdated: string
}

export interface SystemHealth {
  database: 'connected' | 'disconnected'
  api: 'healthy' | 'unhealthy'
  memory: number
  cpu: number
  uptime: number
}

export interface LiveTraffic {
  liveUsers: number
  hourlyActive: number
  dailyActive: number
  totalUsers: number
  lastUpdated: string
}

export interface UsageAnalytics {
  period: {
    days: number
    startDate: string
    endDate: string
  }
  usagePatterns: Array<{
    date: string
    active_users: number
    total_transactions: number
    income_count: number
    expense_count: number
  }>
  featureAdoption: Array<{
    feature: string
    users_with_feature: number
    total_users: number
  }>
  userEngagement: Array<{
    id: string
    name: string
    email: string
    transaction_count: number
    budget_count: number
    goal_count: number
    loan_count: number
    credit_card_count: number
    last_activity: string
    engagement_level: 'high' | 'medium' | 'low'
  }>
  activeUsers: {
    daily: number
    weekly: number
  }
  sessionMetrics: {
    avgDurationSeconds: number
    usersWithSessions: number
  }
}

export interface PerformanceAnalytics {
  timestamp: string
  apiPerformance: {
    endpoints: Array<{
      name: string
      avgResponseTime: number
      p95ResponseTime: number
      requestCount: number
    }>
    overall: {
      avgResponseTime: number
      p95ResponseTime: number
      totalRequests: number
    }
  }
  dbPerformance: {
    responseTime: number
    connectionPool: {
      total: number
      active: number
      idle: number
      waiting: number
    }
    queryPerformance: {
      slowQueries: number
      avgQueryTime: number
      totalQueries: number
    }
  }
  systemResources: {
    memory: {
      used: number
      available: number
      total: number
    }
    cpu: {
      usage: number
      cores: number
      load: number[]
    }
    disk: {
      used: number
      available: number
      total: number
    }
  }
  errorRates: {
    api: {
      totalRequests: number
      errorCount: number
      errorRate: number
      topErrors: Array<{
        error: string
        count: number
        percentage: number
      }>
    }
    database: {
      totalQueries: number
      errorCount: number
      errorRate: number
      connectionErrors: number
    }
  }
}

export interface TrendsAnalytics {
  period: {
    months: number
    startDate: string
    endDate: string
  }
  userGrowth: Array<{
    month: string
    new_users: number
    cumulative_users: number
  }>
  transactionTrends: Array<{
    month: string
    transaction_count: number
    active_users: number
    total_income: number
    total_expense: number
  }>
  featureTrends: Array<{
    month: string
    feature: string
    users: number
  }>
  peakUsage: Array<{
    hour: number
    transaction_count: number
    active_users: number
  }>
}

export interface FinancialAnalytics {
  period: {
    months: number
    startDate: string
    endDate: string
  }
  financialStats: {
    total_transactions: number
    active_users: number
    total_income: number
    total_expense: number
    avg_income: number
    avg_expense: number
    highest_transaction: number
    lowest_transaction: number
  }
  categorySpending: Array<{
    category_name: string
    category_icon: string
    category_color: string
    transaction_count: number
    total_spent: number
    avg_spent: number
    users_using_category: number
  }>
  monthlyTrends: Array<{
    month: string
    transaction_count: number
    active_users: number
    total_income: number
    total_expense: number
    net_savings: number
  }>
  budgetAnalysis: Array<{
    category_name: string
    category_icon: string
    category_color: string
    users_with_budget: number
    avg_budget_amount: number
    total_actual_spent: number
    avg_actual_spent: number
    budget_utilization_percentage: number
  }>
  financialHealth: Array<{
    id: string
    name: string
    email: string
    transaction_count: number
    total_income: number
    total_expense: number
    net_savings: number
    savings_rate_percentage: number
    financial_health_status: 'healthy' | 'balanced' | 'at_risk'
  }>
  topIncomeSources: Array<{
    category_name: string
    category_icon: string
    category_color: string
    transaction_count: number
    total_income: number
    avg_income: number
    users_with_income: number
  }>
}

export interface FinancialSummary {
  timestamp: string
  period: string
  active_users: number
  total_income: number
  total_expense: number
  net_savings: number
  total_transactions: number
  avg_expense: number
}

// Phase 4B: Advanced Monitoring Interfaces
export interface RealtimeTransaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  description: string
  created_at: string
  user_name: string
  user_email: string
  category_name: string
  category_color: string
}

export interface RealtimeMonitoring {
  realtimeTransactions: RealtimeTransaction[]
  lastUpdated: string
}

export interface AnomalyDetection {
  largeTransactions: Array<{
    id: string
    amount: number
    type: string
    description: string
    created_at: string
    user_name: string
    user_email: string
    category_name: string
    z_score: number
  }>
  categorySpikes: Array<{
    category_name: string
    date: string
    total_amount: number
    transaction_count: number
    z_score: number
  }>
  inactiveUsers: Array<{
    id: string
    name: string
    email: string
    join_date: string
    last_transaction: string | null
    days_inactive: number
  }>
  lastUpdated: string
}

export interface PerformanceMonitoring {
  databasePerformance: Array<{
    schemaname: string
    tablename: string
    inserts: number
    updates: number
    deletes: number
    live_tuples: number
    dead_tuples: number
    last_vacuum: string | null
    last_autovacuum: string | null
    last_analyze: string | null
    last_autoanalyze: string | null
  }>
  slowQueries: Array<{
    query: string
    calls: number
    total_time: number
    mean_time: number
    rows: number
  }>
  systemResources: {
    cpu_usage: number
    memory_usage: number
    disk_usage: number
    network_io: number
    active_connections: number
    uptime_hours: number
  }
  alerts: Array<{
    level: 'warning' | 'critical'
    message: string
    value: string
    threshold: string
  }>
  lastUpdated: string
}

export interface UserActivityTracking {
  userActivity: Array<{
    id: string
    name: string
    email: string
    join_date: string
    total_transactions: number
    last_activity: string | null
    days_since_last_activity: number
    activity_status: string
  }>
  featureUsage: Array<{
    feature: string
    users_count: number
    total_usage: number
  }>
  peakUsageHours: Array<{
    hour: number
    transaction_count: number
    active_users: number
  }>
  lastUpdated: string
}

// Phase 4B: Enhanced Financial Analytics Interfaces
export interface EnhancedFinancialAnalytics {
  enhancedHealthScoring: Array<{
    id: string
    name: string
    email: string
    transaction_count: number
    total_income: number
    total_expense: number
    avg_income: number
    avg_expense: number
    last_transaction: string | null
    budget_count: number
    avg_budget_amount: number
    total_budget: number
    loan_count: number
    total_loan_amount: number
    credit_card_count: number
    total_credit_limit: number
    total_credit_balance: number
    savings_rate_percentage: number
    spending_ratio_grade: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'
    debt_level: 'low' | 'moderate' | 'high' | 'none'
    activity_level: 'inactive' | 'moderately_active' | 'active' | 'very_active'
  }>
  realtimeTrends: Array<{
    date: string
    transaction_count: number
    active_users: number
    daily_income: number
    daily_expense: number
    avg_income: number
    avg_expense: number
  }>
  categoryPerformance: Array<{
    category_name: string
    category_color: string
    category_icon: string
    transaction_count: number
    users_count: number
    total_amount: number
    avg_amount: number
    min_amount: number
    max_amount: number
    transaction_type: 'income' | 'expense'
    usage_percentage: number
  }>
  savingsAnalysis: Array<{
    id: string
    name: string
    email: string
    transaction_count: number
    total_income: number
    total_expense: number
    net_savings: number
    savings_rate: number
    savings_grade: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'
  }>
  lastUpdated: string
}

export interface RealtimeFinancialDashboard {
  today: {
    transaction_count: number
    active_users: number
    total_income: number
    total_expense: number
    avg_income: number
    avg_expense: number
  }
  week: {
    transaction_count: number
    active_users: number
    total_income: number
    total_expense: number
    avg_income: number
    avg_expense: number
  }
  month: {
    transaction_count: number
    active_users: number
    total_income: number
    total_expense: number
    avg_income: number
    avg_expense: number
  }
  liveFeed: Array<{
    id: string
    amount: number
    type: string
    description: string
    created_at: string
    user_name: string
    category_name: string
    category_color: string
  }>
  healthIndicators: {
    today: {
      netCashFlow: number
      transactionVelocity: number
      userEngagement: number
    }
    week: {
      netCashFlow: number
      transactionVelocity: number
      userEngagement: number
    }
    month: {
      netCashFlow: number
      transactionVelocity: number
      userEngagement: number
    }
  }
  lastUpdated: string
}

// Phase 4B: Reporting & Export Interfaces
export interface FinancialReport {
  summary: {
    total_transactions: string
    active_users: string
    total_income: string
    total_expenses: string
    avg_income?: number
    avg_expense?: number
  }
  categoryBreakdown: Array<{
    category_name: string
    category_color: string
    transaction_count: number
    total_amount: number
    avg_amount: number
    type: string
  }>
  monthlyTrends: Array<{
    month: string
    transaction_count: number
    monthly_income: number
    monthly_expense: number
  }>
  topUsers: Array<{
    user_name: string
    user_email: string
    transaction_count: number
    total_income: number
    total_expense: number
    net_amount: number
  }>
  reportPeriod: string
  generatedAt: string
}

export interface CustomReport {
  reportType: string
  results: any[]
  totalCount: number
  chartData: any
  generatedAt: string
}

export interface ScheduledReport {
  id: string
  name: string
  type: string
  schedule: string
  recipients: string[]
  format: string
  status: string
  nextRun: string
  lastRun?: string
}

// Phase 4B: Alert System Interfaces
export interface Alert {
  alert_type: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  triggered_at: string
  value: number
  user_name: string
  user_email: string
  details: string
}

export interface AlertStatistics {
  severity: string
  count: number
}

export interface AlertSystem {
  alerts: Alert[]
  statistics: AlertStatistics[]
  lastUpdated: string
}

export interface AlertConfiguration {
  enabled: boolean
  threshold: number
  severity: string
  notificationChannels: string[]
  escalationRules: {
    threshold: number
    severity: string
    notificationChannels: string[]
  }
}

export interface AlertConfigurations {
  largeTransaction: AlertConfiguration
  inactiveUser: AlertConfiguration
  budgetExceeded: AlertConfiguration
  systemPerformance: AlertConfiguration
  lastUpdated: string
}

export interface Notification {
  id: string
  type: string
  message: string
  severity: string
  channel: string
  recipient: string
  status: string
  sentAt: string
  readAt?: string
}

export interface NotificationSystem {
  notifications: Notification[]
  totalCount: number
  unreadCount: number
  lastUpdated: string
}

export interface EscalationRule {
  level: number
  name: string
  delay: number
  channels: string[]
  recipients: string[]
}

export interface EscalationRules {
  levels: EscalationRule[]
  autoResolve: {
    enabled: boolean
    timeout: number
    conditions: string[]
  }
  lastUpdated: string
}

class AdminAPIService {
  // Get authentication token from localStorage
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminToken')
    }
    return null
  }

  // Get authentication headers
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    const token = this.getToken()
    console.log('🔑 API Service: Token retrieved:', token ? `${token.substring(0, 20)}...` : 'null')
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
      console.log('🔑 API Service: Authorization header set')
    } else {
      console.log('🔑 API Service: No token available')
    }
    
    return headers
  }

  // Make API request with error handling
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const url = `${API_BASE_URL}${endpoint}`
      const response = await fetch(url, {
        ...options,
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid, redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('adminToken')
            localStorage.removeItem('adminUser')
            window.location.href = '/login'
          }
          throw new Error('Authentication expired. Please login again.')
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('🔍 API Response:', responseData)
      
      // Check if the response has a data property (backend format)
      if (responseData.success && responseData.data) {
        console.log('✅ Extracting data from response:', responseData.data)
        return responseData.data
      }
      
      // If no data property, return the response as-is
      console.log('⚠️ No data property found, returning response as-is')
      return responseData
    } catch (error) {
      console.error('API Request failed:', error)
      throw error
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  // Logout user
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
      window.location.href = '/login'
    }
  }

  // Get system statistics
  async getSystemStats(): Promise<SystemStats> {
    return this.makeRequest<SystemStats>('/admin/stats')
  }

  // Get all users
  async getUsers(): Promise<AdminUser[]> {
    return this.makeRequest<AdminUser[]>('/admin/users')
  }

  // Get comprehensive user details
  async getUserDetails(userId: string): Promise<any> {
    return this.makeRequest<any>(`/admin/users/${userId}/details`)
  }

  // Get system health
  async getSystemHealth(): Promise<SystemHealth> {
    return this.makeRequest<SystemHealth>('/admin/health')
  }

  // Get live traffic data
  async getLiveTraffic(): Promise<LiveTraffic> {
    return this.makeRequest<LiveTraffic>('/admin/live-traffic')
  }

  // Update user status
  async updateUserStatus(userId: string, status: string): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  // Get error logs
  async getErrorLogs(): Promise<any[]> {
    return this.makeRequest<any[]>('/admin/logs/errors')
  }

  // Get performance metrics
  async getPerformanceMetrics(): Promise<any> {
    return this.makeRequest<any>('/admin/metrics/performance')
  }

  // Get system usage analytics
  async getUsageAnalytics(days: number = 30): Promise<UsageAnalytics> {
    return this.makeRequest<UsageAnalytics>(`/admin/analytics/usage?days=${days}`)
  }

  // Get detailed performance analytics
  async getPerformanceAnalytics(): Promise<PerformanceAnalytics> {
    return this.makeRequest<PerformanceAnalytics>('/admin/analytics/performance')
  }

  // Get system usage trends
  async getTrendsAnalytics(months: number = 12): Promise<TrendsAnalytics> {
    return this.makeRequest<TrendsAnalytics>(`/admin/analytics/trends?months=${months}`)
  }

  // Get financial overview analytics
  async getFinancialAnalytics(months: number = 12): Promise<FinancialAnalytics> {
    return this.makeRequest<FinancialAnalytics>(`/admin/analytics/financial?months=${months}`)
  }

  // Get quick financial summary
  async getFinancialSummary(): Promise<FinancialSummary> {
    return this.makeRequest<FinancialSummary>('/admin/analytics/financial/summary')
  }

  // Phase 4B: Advanced Monitoring API Methods
  async getRealtimeMonitoring(): Promise<RealtimeMonitoring> {
    return this.makeRequest<RealtimeMonitoring>('/admin/monitoring/transactions/realtime')
  }

  async getAnomalyDetection(): Promise<AnomalyDetection> {
    return this.makeRequest<AnomalyDetection>('/admin/monitoring/anomalies')
  }

  async getPerformanceMonitoring(): Promise<PerformanceMonitoring> {
    return this.makeRequest<PerformanceMonitoring>('/admin/monitoring/performance')
  }

  async getUserActivityTracking(): Promise<UserActivityTracking> {
    return this.makeRequest<UserActivityTracking>('/admin/monitoring/activity')
  }

  // Phase 4B: Enhanced Financial Analytics API Methods
  async getEnhancedFinancialAnalytics(months: number = 12): Promise<EnhancedFinancialAnalytics> {
    return this.makeRequest<EnhancedFinancialAnalytics>(`/admin/analytics/financial/enhanced?months=${months}`)
  }

  async getRealtimeFinancialDashboard(): Promise<RealtimeFinancialDashboard> {
    return this.makeRequest<RealtimeFinancialDashboard>('/admin/analytics/financial/realtime')
  }

  // Phase 4B: Reporting & Export API Methods
  async exportTransactions(format: string = 'csv', filters: any = {}): Promise<any> {
    const params = new URLSearchParams({
      format,
      ...filters
    })
    return this.makeRequest<any>(`/admin/reports/export/transactions?${params}`)
  }

  async getFinancialReport(period: string = 'month', userId?: string): Promise<FinancialReport> {
    const params = new URLSearchParams({ period })
    if (userId) params.append('userId', userId)
    return this.makeRequest<FinancialReport>(`/admin/reports/financial?${params}`)
  }

  async generateCustomReport(config: any): Promise<CustomReport> {
    return this.makeRequest<CustomReport>('/admin/reports/custom', {
      method: 'POST',
      body: JSON.stringify(config)
    })
  }

  async scheduleReport(config: any): Promise<any> {
    return this.makeRequest<any>('/admin/reports/schedule', {
      method: 'POST',
      body: JSON.stringify(config)
    })
  }

  async getScheduledReports(): Promise<{ scheduledReports: ScheduledReport[] }> {
    return this.makeRequest<{ scheduledReports: ScheduledReport[] }>('/admin/reports/scheduled')
  }

  // Phase 4B: Alert System API Methods
  async getAlerts(): Promise<AlertSystem> {
    return this.makeRequest<AlertSystem>('/admin/alerts')
  }

  async getAlertConfigurations(): Promise<AlertConfigurations> {
    return this.makeRequest<AlertConfigurations>('/admin/alerts/config')
  }

  async updateAlertConfiguration(alertType: string, configuration: any): Promise<any> {
    return this.makeRequest<any>('/admin/alerts/config', {
      method: 'PUT',
      body: JSON.stringify({ alertType, configuration })
    })
  }

  async getNotifications(): Promise<NotificationSystem> {
    return this.makeRequest<NotificationSystem>('/admin/alerts/notifications')
  }

  async markNotificationAsRead(id: string): Promise<any> {
    return this.makeRequest<any>(`/admin/alerts/notifications/${id}/read`, {
      method: 'PUT'
    })
  }

  async getEscalationRules(): Promise<EscalationRules> {
    return this.makeRequest<EscalationRules>('/admin/alerts/escalation')
  }
}

export const adminAPI = new AdminAPIService()
export default adminAPI
