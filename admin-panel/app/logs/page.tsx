'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Bug,
  Copy,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Terminal
} from 'lucide-react'
import adminAPI, { SystemErrorLog, SystemLogLevel } from '../services/api'

type LogLevelFilter = 'ALL' | SystemLogLevel

const LOG_LEVEL_META: Record<SystemLogLevel, { label: string; badge: string; chip: string; icon: JSX.Element }> = {
  ERROR: {
    label: 'Errors',
    badge: 'bg-red-100 text-red-800 border border-red-200',
    chip: 'bg-red-50 text-red-700 border border-red-200',
    icon: <ShieldAlert className="h-4 w-4 text-red-600" />
  },
  WARN: {
    label: 'Warnings',
    badge: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    chip: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    icon: <AlertCircle className="h-4 w-4 text-yellow-600" />
  },
  INFO: {
    label: 'Info',
    badge: 'bg-blue-100 text-blue-800 border border-blue-200',
    chip: 'bg-blue-50 text-blue-700 border border-blue-200',
    icon: <FileText className="h-4 w-4 text-blue-600" />
  },
  DEBUG: {
    label: 'Debug',
    badge: 'bg-gray-100 text-gray-800 border border-gray-200',
    chip: 'bg-gray-50 text-gray-700 border border-gray-200',
    icon: <Terminal className="h-4 w-4 text-gray-600" />
  }
}

const FILTER_OPTIONS: Array<{ id: LogLevelFilter; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'ERROR', label: 'Errors' },
  { id: 'WARN', label: 'Warnings' },
  { id: 'INFO', label: 'Info' },
  { id: 'DEBUG', label: 'Debug' }
]

const relativeTimeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

function getRelativeTime(timestamp: string) {
  const now = Date.now()
  const logTime = new Date(timestamp).getTime()
  const diffMs = logTime - now
  const diffMinutes = Math.round(diffMs / (60 * 1000))
  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormat.format(diffMinutes, 'minute')
  }
  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormat.format(diffHours, 'hour')
  }
  const diffDays = Math.round(diffHours / 24)
  return relativeTimeFormat.format(diffDays, 'day')
}

function formatExactTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString()
}

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemErrorLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<LogLevelFilter>('ALL')
  const [selectedLog, setSelectedLog] = useState<SystemErrorLog | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      loadLogs(false)
    }, 60000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  const loadLogs = async (withLoadingState: boolean = true) => {
    try {
      if (withLoadingState) {
        setIsLoading(true)
      }
      setError(null)
      const data = await adminAPI.getErrorLogs()
      setLogs(data)
      if (selectedLog) {
        const updatedSelection = data.find((log) => log.id === selectedLog.id)
        setSelectedLog(updatedSelection ?? null)
      }
    } catch (err) {
      console.error('Failed to load logs:', err)
      setError('Unable to load logs right now. Please try again or check your network connection.')
    } finally {
      if (withLoadingState) {
        setIsLoading(false)
      }
    }
  }

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesLevel = levelFilter === 'ALL' || log.level === levelFilter
      const term = searchTerm.trim().toLowerCase()
      if (!term) {
        return matchesLevel
      }
      const haystack = [
        log.message,
        log.details,
        log.stackTrace,
        log.source,
        log.level,
        String(log.id)
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return matchesLevel && haystack.includes(term)
    })
  }, [logs, levelFilter, searchTerm])

  const logStats = useMemo(() => {
    const base = {
      total: logs.length,
      ERROR: 0,
      WARN: 0,
      INFO: 0,
      DEBUG: 0
    }
    return logs.reduce((acc, log) => {
      if (log.level in acc) {
        acc[log.level as SystemLogLevel] += 1
      }
      return acc
    }, base)
  }, [logs])

  const handleCopy = async (content?: string | null) => {
    if (!content) return
    try {
      await navigator.clipboard.writeText(content)
      alert('Copied to clipboard')
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Unable to copy text. Please copy manually.')
    }
  }

  if (isLoading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">Unable to fetch logs</h2>
          <p className="text-gray-600 max-w-md">{error}</p>
        </div>
        <button
          onClick={() => loadLogs(true)}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600">
            Investigate backend issues, warning signals, and informational events captured by the server.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center space-x-2 text-sm text-gray-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={autoRefresh}
              onChange={(event) => setAutoRefresh(event.target.checked)}
            />
            <span>Auto refresh (1 min)</span>
          </label>
          <button
            onClick={() => loadLogs(true)}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Entries</p>
              <p className="text-3xl font-bold text-gray-900">{logStats.total}</p>
            </div>
            <Bug className="h-10 w-10 text-blue-500" />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Combined error, warning, info, and debug entries fetched from the backend API.
          </p>
        </div>

        {(['ERROR', 'WARN', 'INFO'] as SystemLogLevel[]).map((level) => (
          <div key={level} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{LOG_LEVEL_META[level].label}</p>
                <p className={`text-3xl font-bold ${level === 'ERROR' ? 'text-red-600' : level === 'WARN' ? 'text-yellow-600' : 'text-blue-600'}`}>
                  {logStats[level]}
                </p>
              </div>
              {LOG_LEVEL_META[level].icon}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {level === 'ERROR' && 'Critical failures requiring immediate attention.'}
              {level === 'WARN' && 'Potential issues or degraded performance signals.'}
              {level === 'INFO' && 'Operational events and successful operations.'}
            </p>
          </div>
        ))}
      </div>

      <div className="card space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              placeholder="Search message, source, stack trace…"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setLevelFilter(option.id)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  option.id === levelFilter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
                {option.id !== 'ALL' && (
                  <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-gray-600">
                    {logStats[option.id as SystemLogLevel]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="lg:w-2/3">
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Level
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Message
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Source
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-sm text-gray-500">
                        No logs match your current filters. Try adjusting the level filter or search query.
                      </td>
                    </tr>
                  )}
                  {filteredLogs.map((log) => {
                    const meta = LOG_LEVEL_META[log.level]
                    const isSelected = selectedLog?.id === log.id
                    return (
                      <tr
                        key={`${log.id}-${log.timestamp}`}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>
                            {meta.icon}
                            {log.level}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <p className="font-medium">{log.message}</p>
                          {log.details && (
                            <p className="mt-1 text-xs text-gray-500 line-clamp-2">{log.details}</p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{log.source}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">
                          <div>{getRelativeTime(log.timestamp)}</div>
                          <div className="text-xs text-gray-400">{formatExactTimestamp(log.timestamp)}</div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:w-1/3">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-4 py-3">
                <h3 className="text-lg font-semibold text-gray-900">Log Details</h3>
                <p className="text-sm text-gray-500">Select a log entry to see the full context and stack trace.</p>
              </div>
              {selectedLog ? (
                <div className="space-y-4 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Message</p>
                      <p className="text-base font-semibold text-gray-900">{selectedLog.message}</p>
                    </div>
                    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${LOG_LEVEL_META[selectedLog.level].chip}`}>
                      {LOG_LEVEL_META[selectedLog.level].icon}
                      {selectedLog.level}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Source</p>
                    <p className="text-sm text-gray-800">{selectedLog.source}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Log ID</p>
                      <p className="text-sm text-gray-800">{selectedLog.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Captured</p>
                      <p className="text-sm text-gray-800">{formatExactTimestamp(selectedLog.timestamp)}</p>
                    </div>
                  </div>

                  {selectedLog.details && (
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500">Details</p>
                        <button
                          onClick={() => handleCopy(selectedLog.details ?? undefined)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                        >
                          <Copy className="h-3 w-3" />
                          Copy
                        </button>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{selectedLog.details}</p>
                    </div>
                  )}

                  {selectedLog.stackTrace && (
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500">Stack Trace</p>
                        <button
                          onClick={() => handleCopy(selectedLog.stackTrace ?? undefined)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                        >
                          <Copy className="h-3 w-3" />
                          Copy
                        </button>
                      </div>
                      <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">
                        {selectedLog.stackTrace}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3 p-6 text-center text-gray-500">
                  <FileText className="h-10 w-10 text-gray-400" />
                  <p className="text-sm">Select a log entry to inspect its full context.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
