'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  User,
  Calendar,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Flag,
  Edit,
  Save,
  X,
  RefreshCw,
  Eye,
  Image as ImageIcon,
  Paperclip
} from 'lucide-react'
import { API_BASE_URL, SERVER_BASE_URL } from '../../../config/api.config'

interface Attachment {
  id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  created_at: string
}

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  user_name: string
  user_email: string
  user_phone?: string
  assigned_to_name?: string
  resolution?: string
  resolved_at?: string
  created_at: string
  updated_at: string
  messages: Message[]
  attachments?: Attachment[]
}

interface MessageAttachment {
  id: string
  file_name: string
  file_path: string
  file_type: string
}

interface Message {
  id: string
  message: string
  is_admin_reply: boolean
  user_name: string
  user_email: string
  created_at: string
  attachments?: MessageAttachment[]
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [isEditingStatus, setIsEditingStatus] = useState(false)
  const [tempStatus, setTempStatus] = useState('')
  const [isEditingResolution, setIsEditingResolution] = useState(false)
  const [tempResolution, setTempResolution] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [adminAttachments, setAdminAttachments] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      // Force scroll to bottom immediately
      const container = messagesContainerRef.current
      container.scrollTop = container.scrollHeight
      console.log('Scrolled to bottom:', container.scrollTop, 'Height:', container.scrollHeight)
    }
  }

  const fetchTicket = async (silent = false) => {
    try {
      // Only show loading spinner on initial load
      if (!silent) {
        setLoading(true)
      }
      
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/admin/support-tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTicket(data.data)
        
        // Only update these if not editing
        if (!isEditingStatus) {
          setTempStatus(data.data.status)
        }
        if (!isEditingResolution) {
          setTempResolution(data.data.resolution || '')
        }
        
        // Scroll to bottom after data is set
        setTimeout(() => scrollToBottom(), 100)
      } else {
        console.error('Failed to fetch ticket')
      }
    } catch (error) {
      console.error('Error fetching ticket:', error)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (ticket?.messages && ticket.messages.length > 0) {
      // Multiple attempts to ensure scroll happens
      setTimeout(() => scrollToBottom(), 50)
      setTimeout(() => scrollToBottom(), 150)
      setTimeout(() => scrollToBottom(), 300)
    }
  }, [ticket?.messages?.length])

  useEffect(() => {
    if (ticketId) {
      fetchTicket()
    }
  }, [ticketId])
  
  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await fetchTicket(true)
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const quickReplies = [
    "Thank you for contacting us! I'll help you with this.",
    "I'm looking into this issue for you. Please give me a moment.",
    "Could you please provide more details about the issue?",
    "This has been resolved. Please let me know if you need anything else.",
    "I've escalated this to our technical team. We'll get back to you soon.",
    "Thank you for your patience! This should be fixed now."
  ]

  const handleQuickReply = (reply: string) => {
    setNewMessage(reply)
    setShowQuickReplies(false)
    textareaRef.current?.focus()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length + adminAttachments.length > 3) {
      alert('Maximum 3 attachments allowed per reply')
      return
    }

    // Validate file types
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/') || file.type === 'application/pdf'
      if (!isValid) {
        alert(`${file.name} is not a valid image or PDF file`)
      }
      return isValid
    })

    // Validate file sizes
    const validSizedFiles = validFiles.filter(file => {
      const isValidSize = file.size <= 5 * 1024 * 1024
      if (!isValidSize) {
        alert(`${file.name} is too large. Maximum size is 5MB`)
      }
      return isValidSize
    })

    if (validSizedFiles.length > 0) {
      setAdminAttachments([...adminAttachments, ...validSizedFiles])
      
      // Create preview URLs
      const newPreviews = validSizedFiles.map(file => URL.createObjectURL(file))
      setPreviewUrls([...previewUrls, ...newPreviews])
    }
  }

  const removeAdminAttachment = (index: number) => {
    const newAttachments = [...adminAttachments]
    const newPreviews = [...previewUrls]
    
    // Revoke URL to free memory
    URL.revokeObjectURL(newPreviews[index])
    
    newAttachments.splice(index, 1)
    newPreviews.splice(index, 1)
    
    setAdminAttachments(newAttachments)
    setPreviewUrls(newPreviews)
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Keyboard shortcut for sending message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      sendReply()
    }
  }

  const sendReply = async () => {
    if (!newMessage.trim() && adminAttachments.length === 0) return

    try {
      setSendingMessage(true)
      const token = localStorage.getItem('adminToken')

      if (adminAttachments.length > 0) {
        // Use FormData for attachments
        const formData = new FormData()
        formData.append('message', newMessage || 'Attachment')
        adminAttachments.forEach(file => {
          formData.append('attachments', file)
        })

        const response = await fetch(`${API_BASE_URL}/admin/support-tickets/${ticketId}/reply`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
            // Don't set Content-Type - browser will set it with boundary for multipart
          },
          body: formData
        })

        if (response.ok) {
          setNewMessage('')
          setAdminAttachments([])
          // Clean up preview URLs
          previewUrls.forEach(url => URL.revokeObjectURL(url))
          setPreviewUrls([])
          setIsTyping(false)
          await fetchTicket(true)
        } else {
          const errorData = await response.json()
          console.error('Failed to send reply:', errorData.message || 'Unknown error')
          // You could also show a user-friendly error message here
        }
      } else {
        // Regular JSON request without attachments
        const response = await fetch(`${API_BASE_URL}/admin/support-tickets/${ticketId}/reply`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: newMessage })
        })

        if (response.ok) {
          setNewMessage('')
          setIsTyping(false)
          await fetchTicket(true)
        } else {
          const errorData = await response.json()
          console.error('Failed to send reply:', errorData.message || 'Unknown error')
          // You could also show a user-friendly error message here
        }
      }
    } catch (error) {
      console.error('Error sending reply:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const updateStatus = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/admin/support-tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: tempStatus })
      })

      if (response.ok) {
        setIsEditingStatus(false)
        await fetchTicket() // Refresh ticket data
      } else {
        console.error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const updateResolution = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/admin/support-tickets/${ticketId}/resolution`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resolution: tempResolution })
      })

      if (response.ok) {
        setIsEditingResolution(false)
        await fetchTicket() // Refresh ticket data
      } else {
        console.error('Failed to update resolution')
      }
    } catch (error) {
      console.error('Error updating resolution:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'closed':
        return <XCircle className="h-5 w-5 text-gray-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'urgent':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ticket Not Found</h1>
          <p className="text-gray-600">The ticket you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Tickets
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{ticket.ticket_number}</h1>
            <p className="text-lg text-gray-700">{ticket.subject}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              {getStatusIcon(ticket.status)}
              {isEditingStatus ? (
                <div className="ml-2 flex items-center space-x-2">
                  <select
                    value={tempStatus}
                    onChange={(e) => setTempStatus(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button
                    onClick={updateStatus}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingStatus(false)
                      setTempStatus(ticket.status)
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="ml-2 flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => setIsEditingStatus(true)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
              <Flag className="h-4 w-4 mr-1" />
              {ticket.priority}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Conversation */}
        <div className="lg:col-span-2 space-y-6">

          {/* Messages */}
          <div className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Conversation</h2>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
                title="Refresh messages"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            <div 
              ref={messagesContainerRef}
              className="space-y-4 max-h-96 overflow-y-auto flex flex-col-reverse"
              style={{ display: 'flex', flexDirection: 'column-reverse' }}
            >
              {ticket.messages.slice().reverse().map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_admin_reply ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div className="flex flex-col max-w-xs lg:max-w-md">
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-sm ${
                        message.is_admin_reply
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-semibold ${
                          message.is_admin_reply ? 'text-blue-100' : 'text-gray-600'
                        }`}>
                          {message.is_admin_reply ? '👤 You' : `👨‍💼 ${message.user_name}`}
                        </span>
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.message}
                      </div>
                      
                      {/* Message Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {message.attachments.map((attachment: any) => (
                            <button
                              key={attachment.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedImage(`${SERVER_BASE_URL}${attachment.file_path}`)
                                setShowImageModal(true)
                              }}
                              className="relative group"
                            >
                              <img 
                                src={`${SERVER_BASE_URL}${attachment.file_path}`}
                                alt={attachment.file_name}
                                className="w-32 h-32 object-cover rounded border-2 border-white/20"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                                <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <div className={`flex items-center justify-between mt-2 text-xs ${
                        message.is_admin_reply ? 'text-blue-200' : 'text-gray-400'
                      }`}>
                        <span>{formatRelativeTime(message.created_at)}</span>
                        {message.is_admin_reply && (
                          <span className="ml-2">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              {/* Quick Replies */}
              {showQuickReplies && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Quick Replies</span>
                    <button
                      onClick={() => setShowQuickReplies(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {quickReplies.map((reply, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickReply(reply)}
                        className="w-full text-left px-3 py-2 text-sm bg-white hover:bg-blue-50 border border-gray-200 rounded-md transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {/* Attachment Preview */}
                {previewUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={url}
                          alt={`Attachment ${index + 1}`}
                          className="w-20 h-20 object-cover rounded border border-gray-300"
                        />
                        <button
                          onClick={() => removeAdminAttachment(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex space-x-2">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    placeholder="Type your reply... (Ctrl+Enter to send)"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {/* Attachment Button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={adminAttachments.length >= 3}
                      className="flex items-center px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={adminAttachments.length >= 3 ? 'Maximum 3 attachments' : 'Add attachment'}
                    >
                      <Paperclip className="h-4 w-4 mr-1" />
                      Attach
                      {adminAttachments.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                          {adminAttachments.length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setShowQuickReplies(!showQuickReplies)}
                      className="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center transition-colors"
                      title="Quick replies"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Quick Replies
                    </button>
                  </div>
                  
                  <button
                    onClick={sendReply}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium transition-all hover:shadow-md"
                  >
                    {sendingMessage ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Reply
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Details */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <p className="text-sm text-gray-900 capitalize">{ticket.category}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
              </div>
              {/* Attachments */}
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attachments ({ticket.attachments.length})</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ticket.attachments.map((attachment: any) => (
                      <button
                        key={attachment.id}
                        onClick={() => {
                          setSelectedImage(`${SERVER_BASE_URL}${attachment.file_path}`)
                          setShowImageModal(true)
                        }}
                        className="relative group cursor-pointer"
                      >
                        <img 
                          src={`${SERVER_BASE_URL}${attachment.file_path}`}
                          alt={attachment.file_name}
                          className="w-full h-20 object-cover rounded border border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded flex items-center justify-center">
                          <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {ticket.resolution && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                  {isEditingResolution ? (
                    <div className="space-y-2">
                      <textarea
                        value={tempResolution}
                        onChange={(e) => setTempResolution(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={updateResolution}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingResolution(false)
                            setTempResolution(ticket.resolution || '')
                          }}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-2">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap flex-1">{ticket.resolution}</p>
                      <button
                        onClick={() => setIsEditingResolution(true)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{ticket.user_name}</p>
                  <p className="text-sm text-gray-500">{ticket.user_email}</p>
                  {ticket.user_phone && (
                    <p className="text-sm text-gray-500">{ticket.user_phone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Info */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Information</h3>
            <div className="space-y-3">
              {/* Status */}
              <div className="flex items-start">
                {getStatusIcon(ticket.status)}
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">Status</p>
                  {isEditingStatus ? (
                    <div className="mt-1 flex items-center space-x-2">
                      <select
                        value={tempStatus}
                        onChange={(e) => setTempStatus(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button
                        onClick={updateStatus}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingStatus(false)
                          setTempStatus(ticket.status)
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => setIsEditingStatus(true)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div className="flex items-center">
                <Flag className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Priority</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 my-3"></div>

              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Created</p>
                  <p className="text-sm text-gray-500">{formatDate(ticket.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Last Updated</p>
                  <p className="text-sm text-gray-500">{formatDate(ticket.updated_at)}</p>
                </div>
              </div>
              {ticket.resolved_at && (
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Resolved</p>
                    <p className="text-sm text-gray-500">{formatDate(ticket.resolved_at)}</p>
                  </div>
                </div>
              )}
              {ticket.assigned_to_name && (
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Assigned To</p>
                    <p className="text-sm text-gray-500">{ticket.assigned_to_name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {showImageModal && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
          onClick={() => setShowImageModal(false)}
        >
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
          >
            <X className="h-8 w-8" />
          </button>
          
          <div className="max-w-6xl max-h-screen p-8" onClick={(e) => e.stopPropagation()}>
            <img 
              src={selectedImage}
              alt="Attachment"
              className="max-w-full max-h-[80vh] object-contain rounded shadow-2xl"
            />
          </div>
          
          <div className="absolute bottom-8 flex space-x-4">
            <a
              href={selectedImage}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center bg-black bg-opacity-70 text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all"
            >
              <Eye className="h-5 w-5 mr-2" />
              Open in New Tab
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
