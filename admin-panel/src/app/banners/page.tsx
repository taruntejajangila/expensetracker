'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  BarChart3,
  Calendar,
  Image as ImageIcon,
  Type,
  Settings,
  Smartphone
} from 'lucide-react'

interface Banner {
  id: number
  title: string
  subtitle?: string
  description?: string
  image_url?: string
  target_url?: string
  background_color: string
  text_color: string
  icon?: string
  category_id?: number
  is_active: boolean
  sort_order: number
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
  category_name?: string
  category_color?: string
  created_by_name?: string
  updated_by_name?: string
  total_views: number
  total_clicks: number
  click_through_rate: number
}

interface BannerCategory {
  id: number
  name: string
  description?: string
  color: string
  banner_count: number
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [categories, setCategories] = useState<BannerCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Fetch banners
  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(statusFilter && { status: statusFilter })
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/admin/banners?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBanners(data.data.banners)
        setTotalPages(data.data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, selectedCategory, statusFilter])

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/admin/banners/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    fetchBanners()
    fetchCategories()
  }, [fetchBanners])

  // Toggle banner status
  const toggleBannerStatus = async (bannerId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/admin/banners/${bannerId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        fetchBanners() // Refresh the list
      }
    } catch (error) {
      console.error('Error toggling banner status:', error)
    }
  }

  // Delete banner
  const deleteBanner = async (bannerId: number) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/admin/banners/${bannerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })

      if (response.ok) {
        fetchBanners() // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting banner:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
        isActive 
          ? 'text-green-600 bg-green-100' 
          : 'text-gray-600 bg-gray-100'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banner Management</h1>
          <p className="text-gray-600">Manage promotional banners and announcements</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Banner
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search banners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name} ({category.banner_count})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Banners Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Banner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Analytics
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Loading banners...
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No banners found
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-16 h-12 rounded-lg overflow-hidden mr-4 bg-gray-100">
                          {banner.image_url ? (
                            <img 
                              src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001'}${banner.image_url}`}
                              alt={banner.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {banner.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {banner.description || 'No description'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {banner.category_name ? (
                        <span 
                          className="px-2 py-1 text-xs font-medium rounded-full text-white"
                          style={{ backgroundColor: banner.category_color || '#6C5CE7' }}
                        >
                          {banner.category_name}
                        </span>
                      ) : (
                        <span className="text-gray-400">No category</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(banner.is_active)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Eye className="h-3 w-3 mr-1 text-gray-400" />
                          <span>{banner.total_views || 0}</span>
                        </div>
                        <div className="flex items-center">
                          <BarChart3 className="h-3 w-3 mr-1 text-gray-400" />
                          <span>{banner.click_through_rate ? Math.round(banner.click_through_rate * 100) / 100 : 0}% CTR</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(banner.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedBanner(banner)
                            setShowEditModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleBannerStatus(banner.id)}
                          className={banner.is_active ? "text-yellow-600 hover:text-yellow-900" : "text-green-600 hover:text-green-900"}
                        >
                          {banner.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => deleteBanner(banner.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Banner Modal */}
      {(showCreateModal || showEditModal) && (
        <BannerModal
          banner={selectedBanner}
          categories={categories}
          onClose={() => {
            setShowCreateModal(false)
            setShowEditModal(false)
            setSelectedBanner(null)
          }}
          onSave={() => {
            fetchBanners()
            setShowCreateModal(false)
            setShowEditModal(false)
            setSelectedBanner(null)
          }}
        />
      )}
    </div>
  )
}

// Banner Modal Component
function BannerModal({ 
  banner, 
  categories, 
  onClose, 
  onSave 
}: { 
  banner: Banner | null
  categories: BannerCategory[]
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState<{
    title: string
    description: string
    image_url: string
    target_url: string
    category_id: number | null
    is_active: boolean
    sort_order: number
    start_date: string
    end_date: string
  }>({
    title: banner?.title || '',
    description: banner?.description || '',
    image_url: banner?.image_url || '',
    target_url: banner?.target_url || '',
    category_id: banner?.category_id || null,
    is_active: banner?.is_active ?? true,
    sort_order: banner?.sort_order || 0,
    start_date: banner?.start_date ? banner.start_date.split('T')[0] : '',
    end_date: banner?.end_date ? banner.end_date.split('T')[0] : ''
  })
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<boolean>(false)

  const [loading, setLoading] = useState(false)

  // Set image preview for existing banner
  useEffect(() => {
    // Reset error state when banner changes
    setImageError(false);
    
    if (banner?.image_url && !imageFile) {
      const fullImageUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001'}${banner.image_url}`;
      setImagePreview(fullImageUrl);
    } else if (!banner?.image_url) {
      setImagePreview(null);
    }
  }, [banner?.image_url, imageFile])

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Upload image file to server
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('image', file)
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/admin/banners/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error('Failed to upload image')
    }
    
    const data = await response.json()
    return data.imageUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let imageUrl = formData.image_url
      
      // Upload new image if file is selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }
      
      // If no image file and no existing image URL, show error
      if (!imageUrl) {
        alert('Please select an image file')
        setLoading(false)
        return
      }

      const url = banner 
        ? `/admin/banners/${banner.id}`
        : '/admin/banners'
      
      const method = banner ? 'PUT' : 'POST'

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}${url}`, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          image_url: imageUrl,
          category_id: formData.category_id,
          sort_order: parseInt(formData.sort_order.toString()),
          // Set default values for removed fields
          subtitle: '',
          background_color: '#6C5CE7',
          text_color: '#FFFFFF',
          icon: ''
        })
      })

      if (response.ok) {
        onSave()
        onClose()
      } else {
        const error = await response.json()
        alert(error.message || 'Error saving banner')
      }
    } catch (error) {
      console.error('Error saving banner:', error)
      alert('Error saving banner')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900">
              {banner ? 'Edit Banner' : 'Create New Banner'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Type className="h-5 w-5 mr-3 text-blue-600" />
                Banner Information
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Name *
                    <span className="text-gray-500 text-xs ml-1">(Internal name for identification)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Summer Sale Banner"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target URL
                    <span className="text-gray-500 text-xs ml-1">(Where users go when they tap the banner)</span>
                  </label>
                  <input
                    type="url"
                    value={formData.target_url}
                    onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                    placeholder="https://example.com/landing-page"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                  <span className="text-gray-500 text-xs ml-1">(Internal description for reference)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Brief description of this banner campaign..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <ImageIcon className="h-5 w-5 mr-3 text-green-600" />
                Banner Image
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image *
                  <span className="text-gray-500 text-xs ml-1">(Select an image file from your device)</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="image-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="image-upload"
                          name="image-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Recommended dimensions: 1200x400px or similar aspect ratio for best mobile display
                </p>
              </div>

              {/* Image Preview */}
              {(imagePreview || (banner?.image_url && !imageFile) || banner?.image_url) && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image Preview</label>
                  <div className="border border-gray-300 rounded-lg p-4 bg-white">
                    {!imageError ? (
                      <img
                        src={imagePreview || (banner?.image_url ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001'}${banner.image_url}` : '')}
                        alt="Banner preview"
                        className="w-full h-32 object-cover rounded-md"
                        onError={() => {
                          setImageError(true);
                        }}
                        onLoad={() => {
                          setImageError(false);
                        }}
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-200 rounded-md flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Failed to load image</p>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      {imageFile ? 'New image preview' : 'Current image'}
                    </p>
                  </div>
                </div>
              )}
            </div>


            {/* Organization & Settings Section */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Settings className="h-5 w-5 mr-3 text-orange-600" />
                Organization & Settings
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                    <span className="text-gray-500 text-xs ml-1">(Optional - for organization)</span>
                  </label>
                                            <select
                            value={formData.category_id || ''}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : null })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">No category</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                    <span className="text-gray-500 text-xs ml-1">(Lower numbers appear first)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center justify-center lg:justify-start">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Active Banner</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Scheduling Section */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Calendar className="h-5 w-5 mr-3 text-indigo-600" />
                Scheduling (Optional)
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                    <span className="text-gray-500 text-xs ml-1">(When banner becomes visible)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                    <span className="text-gray-500 text-xs ml-1">(When banner stops being visible)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Leave dates empty to show the banner immediately and indefinitely. 
                  Use dates to create time-limited campaigns.
                </p>
              </div>
            </div>

            {/* Mobile App Preview Section */}
            {(imagePreview || (banner?.image_url && !imageFile)) && (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Smartphone className="h-5 w-5 mr-3 text-indigo-600" />
                  Mobile App Preview
                </h3>
                
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Mobile Frame */}
                    <div className="w-80 h-96 bg-gray-900 rounded-3xl p-2 shadow-2xl">
                      <div className="w-full h-full bg-white rounded-2xl overflow-hidden relative">
                        {/* Mobile Header */}
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-blue-600 rounded"></div>
                              <span className="text-sm font-semibold text-gray-900">FinanceTracker</span>
                            </div>
                            <div className="flex space-x-1">
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Mobile Content */}
                        <div className="p-4 space-y-4">
                          {/* Sample Balance Card */}
                          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white">
                            <div className="text-sm opacity-90">Total Balance</div>
                            <div className="text-2xl font-bold">$12,450.00</div>
                          </div>
                          
                          {/* Banner Carousel Preview */}
                          <div className="relative">
                            <div className="text-xs text-gray-500 mb-2">Banner Carousel</div>
                            <div className="relative overflow-hidden rounded-xl bg-gray-100">
                              <img
                                src={imagePreview || (formData.image_url ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001'}${formData.image_url}` : '')}
                                alt="Banner preview"
                                className="w-full h-24 object-cover"
                                onError={(e) => {
                                  console.error('Mobile preview image error:', e);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              {/* Dot indicators */}
                              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                                <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
                                <div className="w-2 h-2 bg-white rounded-full opacity-40"></div>
                                <div className="w-2 h-2 bg-white rounded-full opacity-40"></div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Sample Quick Actions */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <span className="text-green-600 text-sm">+</span>
                              </div>
                              <div className="text-xs text-gray-600">Add Income</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <span className="text-red-600 text-sm">-</span>
                              </div>
                              <div className="text-xs text-gray-600">Add Expense</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    This is how your banner will appear in the mobile app carousel
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    The banner will slide horizontally with other promotional content
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : (banner ? 'Update Banner' : 'Create Banner')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
