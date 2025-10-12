'use client'

import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [debugData, setDebugData] = useState<any>({})

  useEffect(() => {
    const debugKeys = [
      'debug_login_start',
      'debug_api_response', 
      'debug_token_stored',
      'debug_login_success',
      'debug_login_failed',
      'debug_login_error',
      'debug_conditional_layout',
      'debug_redirect_to_login',
      'adminToken',
      'adminUser'
    ]

    const data: any = {}
    debugKeys.forEach(key => {
      const value = localStorage.getItem(key)
      if (value) {
        try {
          data[key] = JSON.parse(value)
        } catch {
          data[key] = value
        }
      }
    })

    setDebugData(data)
  }, [])

  const clearDebugData = () => {
    const debugKeys = [
      'debug_login_start',
      'debug_api_response', 
      'debug_token_stored',
      'debug_login_success',
      'debug_login_failed',
      'debug_login_error',
      'debug_conditional_layout',
      'debug_redirect_to_login'
    ]
    
    debugKeys.forEach(key => {
      localStorage.removeItem(key)
    })
    
    setDebugData({})
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
      
      <div className="mb-4">
        <button 
          onClick={clearDebugData}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Clear Debug Data
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(debugData).map(([key, value]) => (
          <div key={key} className="border rounded p-4">
            <h3 className="font-bold text-lg mb-2">{key}</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        ))}
      </div>

      {Object.keys(debugData).length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No debug data found. Try logging in to generate debug information.
        </div>
      )}
    </div>
  )
}
