'use client'

import { useState, useEffect } from 'react'
import { Settings, Save, AlertCircle, CheckCircle } from 'lucide-react'
import adminAPI from '../services/api'
import { API_BASE_URL } from '../../config/api.config'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    systemName: 'Mobile App Admin Panel',
    maintenanceMode: false,
    emailNotifications: true,
    autoBackup: true,
    logRetentionDays: 30,
    maxUsers: 1000,
    apiRateLimit: 1000
  })

  const [contactInfo, setContactInfo] = useState({
    email: 'support@mypaisa.com',
    phone: '+91 98765 43210',
    hours: 'Mon-Fri 9AM-6PM',
    legalEmail: 'legal@mypaisa.com',
    privacyEmail: 'privacy@mypaisa.com',
    showEmail: true,
    showPhone: true,
    showHours: true
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingContact, setIsLoadingContact] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  const handleSave = async () => {
    setIsLoading(true)
    setMessage('')
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMessage('Settings saved successfully!')
      setMessageType('success')
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('')
        setMessageType('')
      }, 3000)
    } catch (error) {
      setMessage('Failed to save settings. Please try again.')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleContactInfoChange = (key: string, value: string) => {
    setContactInfo(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Fetch contact information on component mount
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const token = localStorage.getItem('adminToken')
        const response = await fetch(`${API_BASE_URL}/app-settings/contact`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setContactInfo(data.data)
          }
        }
      } catch (error) {
        console.error('Error fetching contact information:', error)
      }
    }

    fetchContactInfo()
  }, [])

  const handleSaveContactInfo = async () => {
    setIsLoadingContact(true)
    setMessage('')
    
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/app-settings/contact`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactInfo)
      })

      if (!response.ok) {
        throw new Error('Failed to update contact information')
      }

      const data = await response.json()
      if (data.success) {
        setMessage('Contact information saved successfully!')
        setMessageType('success')
        setTimeout(() => {
          setMessage('')
          setMessageType('')
        }, 3000)
      }
    } catch (error) {
      setMessage('Failed to save contact information. Please try again.')
      setMessageType('error')
      setTimeout(() => {
        setMessage('')
        setMessageType('')
      }, 3000)
    } finally {
      setIsLoadingContact(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
      </div>

      {message && (
        <div className={`rounded-md p-4 ${
          messageType === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            {messageType === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400" />
            )}
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                messageType === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            General Settings
          </h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="systemName" className="block text-sm font-medium text-gray-700">
                System Name
              </label>
              <input
                type="text"
                id="systemName"
                value={settings.systemName}
                onChange={(e) => handleInputChange('systemName', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="maxUsers" className="block text-sm font-medium text-gray-700">
                Maximum Users
              </label>
              <input
                type="number"
                id="maxUsers"
                value={settings.maxUsers}
                onChange={(e) => handleInputChange('maxUsers', parseInt(e.target.value))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="logRetentionDays" className="block text-sm font-medium text-gray-700">
                Log Retention (Days)
              </label>
              <input
                type="number"
                id="logRetentionDays"
                value={settings.logRetentionDays}
                onChange={(e) => handleInputChange('logRetentionDays', parseInt(e.target.value))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="apiRateLimit" className="block text-sm font-medium text-gray-700">
                API Rate Limit (requests/hour)
              </label>
              <input
                type="number"
                id="apiRateLimit"
                value={settings.apiRateLimit}
                onChange={(e) => handleInputChange('apiRateLimit', parseInt(e.target.value))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Contact Information
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Manage contact information displayed in the mobile app's Help & Support section.
          </p>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                Support Email
              </label>
              <input
                type="email"
                id="contactEmail"
                value={contactInfo.email}
                onChange={(e) => handleContactInfoChange('email', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="support@example.com"
              />
              <div className="mt-2 flex items-center">
                <input
                  type="checkbox"
                  id="showEmail"
                  checked={contactInfo.showEmail}
                  onChange={(e) => handleContactInfoChange('showEmail', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showEmail" className="ml-2 block text-sm text-gray-700">
                  Show in mobile app
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                Support Phone
              </label>
              <input
                type="text"
                id="contactPhone"
                value={contactInfo.phone}
                onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="+1 234 567 8900"
              />
              <div className="mt-2 flex items-center">
                <input
                  type="checkbox"
                  id="showPhone"
                  checked={contactInfo.showPhone}
                  onChange={(e) => handleContactInfoChange('showPhone', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showPhone" className="ml-2 block text-sm text-gray-700">
                  Show in mobile app
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="contactHours" className="block text-sm font-medium text-gray-700">
                Support Hours
              </label>
              <input
                type="text"
                id="contactHours"
                value={contactInfo.hours}
                onChange={(e) => handleContactInfoChange('hours', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Mon-Fri 9AM-6PM"
              />
              <div className="mt-2 flex items-center">
                <input
                  type="checkbox"
                  id="showHours"
                  checked={contactInfo.showHours}
                  onChange={(e) => handleContactInfoChange('showHours', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showHours" className="ml-2 block text-sm text-gray-700">
                  Show in mobile app
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="legalEmail" className="block text-sm font-medium text-gray-700">
                Legal Email
              </label>
              <input
                type="email"
                id="legalEmail"
                value={contactInfo.legalEmail}
                onChange={(e) => handleContactInfoChange('legalEmail', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="legal@example.com"
              />
            </div>

            <div>
              <label htmlFor="privacyEmail" className="block text-sm font-medium text-gray-700">
                Privacy Email
              </label>
              <input
                type="email"
                id="privacyEmail"
                value={contactInfo.privacyEmail}
                onChange={(e) => handleContactInfoChange('privacyEmail', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="privacy@example.com"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveContactInfo}
              disabled={isLoadingContact}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingContact ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isLoadingContact ? 'Saving...' : 'Save Contact Info'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            System Options
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Maintenance Mode</h4>
                <p className="text-sm text-gray-500">Enable maintenance mode to restrict access</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-500">Send email notifications for system alerts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Auto Backup</h4>
                <p className="text-sm text-gray-500">Automatically backup system data daily</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoBackup}
                  onChange={(e) => handleInputChange('autoBackup', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
