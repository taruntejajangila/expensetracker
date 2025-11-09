'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppWindow, Users, Download, Shield, Bell, RefreshCw, Smartphone, Target, Award, Star, BarChart3, Clock, Activity, CheckCircle, AlertTriangle } from 'lucide-react'
import adminAPI from '../services/api'
import { formatNumber } from '@/utils/numberFormatter'

// Mock app data - replace with real API calls
const mockAppData = {
  currentVersion: '1.2.3',
  latestVersion: '1.2.4',
  totalDownloads: 15420,
  activeUsers: 8920,
  crashRate: 0.02,
  avgResponseTime: 245,
  lastUpdate: '2024-06-15',
  nextUpdate: '2024-07-01',
  features: [
    { name: 'Credit Card Management', status: 'active', users: 12470 },
    { name: 'Transaction Tracking', status: 'active', users: 11890 },
    { name: 'Budget Planning', status: 'beta', users: 8900 },
    { name: 'Investment Tracking', status: 'planned', users: 0 },
    { name: 'Bill Reminders', status: 'active', users: 10200 }
  ],
  systemHealth: {
    database: 'healthy',
    api: 'healthy',
    pushNotifications: 'warning',
    analytics: 'healthy'
  }
}

export default function MobileAppPage() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getFeatureStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100'
      case 'beta':
        return 'text-blue-600 bg-blue-100'
      case 'planned':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mobile App</h1>
          <p className="text-gray-600">Manage your mobile application</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            App Settings
          </button>
          <button className="btn-primary flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Deploy Update
          </button>
        </div>
      </div>

      {/* App Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Smartphone className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Version</p>
              <p className="text-2xl font-bold text-gray-900">{mockAppData.currentVersion}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Download className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Downloads</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(mockAppData.totalDownloads)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(mockAppData.activeUsers)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Crash Rate</p>
              <p className="text-2xl font-bold text-gray-900">{(mockAppData.crashRate * 100).toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* App Health and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-3">
            {Object.entries(mockAppData.systemHealth).map(([service, status]) => (
              <div key={service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  {getStatusIcon(status)}
                  <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                    {service.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Average Response Time</span>
                <span>{mockAppData.avgResponseTime}ms</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full" 
                  style={{ width: `${Math.min((mockAppData.avgResponseTime / 500) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Last Update</span>
                <span>{new Date(mockAppData.lastUpdate).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Next Update</span>
                <span>{new Date(mockAppData.nextUpdate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Management */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Features Management</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feature
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockAppData.features.map((feature) => (
                <tr key={feature.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{feature.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFeatureStatusColor(feature.status)}`}>
                      {feature.status.charAt(0).toUpperCase() + feature.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(feature.users)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 text-sm">
                        Edit
                      </button>
                      <button className="text-green-600 hover:text-green-900 text-sm">
                        Toggle
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Version Control */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Version Control</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Version</h4>
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-lg font-mono text-gray-900">{mockAppData.currentVersion}</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Latest Available</h4>
            <div className="p-3 bg-blue-50 rounded-lg">
              <span className="text-lg font-mono text-blue-900">{mockAppData.latestVersion}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex space-x-3">
          <button className="btn-primary">Update to Latest</button>
          <button className="btn-secondary">Rollback</button>
          <button className="btn-secondary">View Changelog</button>
        </div>
      </div>
    </div>
  )
}
