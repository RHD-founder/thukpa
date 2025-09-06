'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    BarChart3,
    Table,
    Search,
    Star,
    Tag,
    MessageSquare,
    Bell,
    Settings,
    CheckCircle,
    AlertCircle,
    Info
} from 'lucide-react'
import { format } from 'date-fns'
import AnalyticsDashboard from '@/app/components/AnalyticsDashboard'
import FeedbackAnalytics from '@/app/components/FeedbackAnalytics'

interface FeedbackItem {
    id: string
    createdAt: string
    name: string
    contact?: string
    email?: string
    phone?: string
    rating?: number
    comments?: string
    location?: string
    category?: string
    visitDate?: string
    isAnonymous: boolean
    tags?: string
    sentiment?: string
    status: string
}


interface Notification {
    id: string
    type: 'success' | 'warning' | 'error' | 'info'
    title: string
    message: string
    timestamp: Date
    read: boolean
}

export default function DashboardClient() {
    const [view, setView] = useState<'analytics' | 'table' | 'feedback'>('analytics')
    const [items, setItems] = useState<FeedbackItem[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [ratingFilter, setRatingFilter] = useState('all')

    // Notifications state
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [showNotifications, setShowNotifications] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [settings, setSettings] = useState({
        theme: 'light',
        notifications: true,
        autoRefresh: true,
        refreshInterval: 30
    })

    // Notification functions
    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: Notification = {
            ...notification,
            id: Date.now().toString(),
            timestamp: new Date(),
            read: false
        }
        setNotifications(prev => [newNotification, ...prev])
    }, [])

    const markNotificationAsRead = useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === id ? { ...notif, read: true } : notif
            )
        )
    }, [])

    const clearAllNotifications = useCallback(() => {
        setNotifications([])
    }, [])

    const fetchFeedback = useCallback(async (showNotification = false, isBackgroundRefresh = false) => {
        if (isBackgroundRefresh) {
            setIsRefreshing(true)
        } else {
            setLoading(true)
        }

        try {
            const params = new URLSearchParams()
            if (searchTerm) params.append('q', searchTerm)
            if (statusFilter !== 'all') params.append('status', statusFilter)
            if (categoryFilter !== 'all') params.append('category', categoryFilter)
            if (ratingFilter !== 'all') params.append('rating', ratingFilter)

            const response = await fetch(`/api/feedback?${params.toString()}`)
            const data = await response.json()
            setItems(data.items || [])

            // Only show notification if explicitly requested (for critical events)
            if (showNotification && data.items && data.items.length > 0) {
                addNotification({
                    type: 'success',
                    title: 'New Feedback Received',
                    message: `${data.items.length} new feedback items available`
                })
            }
        } catch (error) {
            console.error('Failed to fetch feedback:', error)
            // Only show error notifications for critical failures
            addNotification({
                type: 'error',
                title: 'System Error',
                message: 'Critical: Failed to load feedback data'
            })
        } finally {
            if (isBackgroundRefresh) {
                setIsRefreshing(false)
            } else {
                setLoading(false)
            }
        }
    }, [searchTerm, statusFilter, categoryFilter, ratingFilter, addNotification])

    useEffect(() => {
        fetchFeedback()
    }, [fetchFeedback])

    // Auto-refresh functionality (background only)
    useEffect(() => {
        if (!settings.autoRefresh) return

        const interval = setInterval(() => {
            // Background refresh without notifications
            fetchFeedback(false, true)
        }, settings.refreshInterval * 1000)

        return () => clearInterval(interval)
    }, [settings.autoRefresh, settings.refreshInterval, fetchFeedback])

    // Critical event notifications (feedback, system issues, admin login)
    useEffect(() => {
        const interval = setInterval(() => {
            // Simulate critical events (much less frequent)
            if (Math.random() > 0.95) { // 5% chance every 30 seconds
                const criticalEvents = [
                    {
                        type: 'success' as const,
                        title: 'New Feedback Received',
                        message: 'Customer submitted a 5-star rating for food quality'
                    },
                    {
                        type: 'warning' as const,
                        title: 'System Alert',
                        message: 'High server load detected - monitoring performance'
                    },
                    {
                        type: 'info' as const,
                        title: 'Admin Login',
                        message: 'Administrator logged in from new location'
                    },
                    {
                        type: 'error' as const,
                        title: 'Critical Error',
                        message: 'Database connection timeout - retrying automatically'
                    }
                ]

                const randomEvent = criticalEvents[Math.floor(Math.random() * criticalEvents.length)]
                addNotification(randomEvent)
            }
        }, 30000) // Check every 30 seconds

        return () => clearInterval(interval)
    }, [addNotification])

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showNotifications || showSettings) {
                const target = event.target as Element
                if (!target.closest('[data-dropdown]')) {
                    setShowNotifications(false)
                    setShowSettings(false)
                }
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showNotifications, showSettings])

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            await fetch(`/api/feedback/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })
            // Background refresh without notification
            fetchFeedback(false, true)

            // Show notification for critical status changes
            if (newStatus === 'resolved' || newStatus === 'urgent') {
                addNotification({
                    type: newStatus === 'resolved' ? 'success' : 'warning',
                    title: 'Feedback Status Updated',
                    message: `Feedback marked as ${newStatus}`
                })
            }
        } catch (error) {
            console.error('Failed to update status:', error)
            addNotification({
                type: 'error',
                title: 'Update Failed',
                message: 'Failed to update feedback status'
            })
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-800'
            case 'reviewed': return 'bg-yellow-100 text-yellow-800'
            case 'resolved': return 'bg-green-100 text-green-800'
            case 'archived': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }


    const filteredItems = items.filter((item) => {
        const matchesSearch = !searchTerm ||
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.comments?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.location?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' || item.status === statusFilter
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
        const matchesRating = ratingFilter === 'all' ||
            (ratingFilter === '5' && item.rating === 5) ||
            (ratingFilter === '4' && item.rating === 4) ||
            (ratingFilter === '3' && item.rating === 3) ||
            (ratingFilter === '2' && item.rating === 2) ||
            (ratingFilter === '1' && item.rating === 1)

        return matchesSearch && matchesStatus && matchesCategory && matchesRating
    })

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 shadow-sm">
                <div className="p-6">
                    <div className="flex items-center mb-8">
                        <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-white font-bold text-lg">T</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Thukpa</h1>
                            <p className="text-gray-500 text-sm">Analytics</p>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        <button
                            onClick={() => setView('analytics')}
                            className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'analytics'
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <BarChart3 className="w-5 h-5 mr-3" />
                            Dashboard
                        </button>
                        <button
                            onClick={() => setView('feedback')}
                            className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'feedback'
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <MessageSquare className="w-5 h-5 mr-3" />
                            Analytics
                        </button>
                        <button
                            onClick={() => setView('table')}
                            className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'table'
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <Table className="w-5 h-5 mr-3" />
                            Data Table
                        </button>
                    </nav>
                </div>

                {/* User Profile - Sticky */}
                <div className="sticky bottom-6 left-6 right-6 z-50">
                    <div className="flex items-center p-3 bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-semibold text-sm">A</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Admin User</p>
                            <p className="text-xs text-gray-500">Administrator</p>
                        </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center space-x-3">
                                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                                {isRefreshing && (
                                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                        <span>Refreshing...</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-gray-600 text-sm">Manage and analyze customer feedback</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-64 px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            </div>

                            {/* Notifications Button */}
                            <div className="relative" data-dropdown>
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"
                                    title="Notifications"
                                >
                                    <Bell className="w-5 h-5" />
                                    {notifications.filter(n => !n.read).length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                            {notifications.filter(n => !n.read).length}
                                        </span>
                                    )}
                                </button>

                                {/* Notifications Dropdown */}
                                {showNotifications && (
                                    <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                                        <div className="p-4 border-b border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold text-gray-900">Notifications</h3>
                                                <button
                                                    onClick={clearAllNotifications}
                                                    className="text-sm text-blue-600 hover:text-blue-800"
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-4 text-center text-gray-500">No notifications</div>
                                            ) : (
                                                notifications.map((notification) => (
                                                    <div
                                                        key={notification.id}
                                                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                                                        onClick={() => markNotificationAsRead(notification.id)}
                                                    >
                                                        <div className="flex items-start space-x-3">
                                                            <div className={`p-1 rounded-full ${notification.type === 'success' ? 'bg-green-100' :
                                                                notification.type === 'warning' ? 'bg-yellow-100' :
                                                                    notification.type === 'error' ? 'bg-red-100' :
                                                                        'bg-blue-100'
                                                                }`}>
                                                                {notification.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                                                                {notification.type === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                                                                {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                                                                {notification.type === 'info' && <Info className="w-4 h-4 text-blue-600" />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-medium text-gray-900 text-sm">{notification.title}</p>
                                                                <p className="text-gray-600 text-sm">{notification.message}</p>
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    {format(notification.timestamp, 'MMM d, h:mm a')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Settings Button */}
                            <div className="relative" data-dropdown>
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Settings"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>

                                {/* Settings Dropdown */}
                                {showSettings && (
                                    <div className="absolute right-0 top-12 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                                        <div className="p-4 border-b border-gray-200">
                                            <h3 className="font-semibold text-gray-900">Settings</h3>
                                        </div>
                                        <div className="p-4 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                                                <select
                                                    value={settings.theme}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    aria-label="Theme selection"
                                                >
                                                    <option value="light">Light</option>
                                                    <option value="dark">Dark</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.notifications}
                                                        onChange={(e) => setSettings(prev => ({ ...prev, notifications: e.target.checked }))}
                                                        className="rounded"
                                                    />
                                                    <span className="text-sm text-gray-700">Enable Notifications</span>
                                                </label>
                                            </div>
                                            <div>
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.autoRefresh}
                                                        onChange={(e) => setSettings(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                                                        className="rounded"
                                                    />
                                                    <span className="text-sm text-gray-700">Auto Refresh</span>
                                                </label>
                                            </div>
                                            {settings.autoRefresh && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Refresh Interval (seconds)</label>
                                                    <input
                                                        type="number"
                                                        value={settings.refreshInterval}
                                                        onChange={(e) => setSettings(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                        min="10"
                                                        max="300"
                                                        aria-label="Refresh interval in seconds"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 bg-gray-50">
                    {view === 'analytics' ? (
                        <AnalyticsDashboard />
                    ) : view === 'feedback' ? (
                        <FeedbackAnalytics />
                    ) : (
                        <>
                            {/* Filters */}
                            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-2xl"></div>
                                <div className="relative">
                                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                                        <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full mr-3"></div>
                                        🔍 Advanced Filters
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <Search className="w-4 h-4 mr-2 text-blue-600" />
                                                Search Feedback
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Type to search..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <Tag className="w-4 h-4 mr-2 text-emerald-600" />
                                                Status Filter
                                            </label>
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white"
                                                aria-label="Filter by status"
                                            >
                                                <option value="all">🌟 All Status</option>
                                                <option value="new">🆕 New</option>
                                                <option value="reviewed">👀 Reviewed</option>
                                                <option value="resolved">✅ Resolved</option>
                                                <option value="archived">📁 Archived</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <Tag className="w-4 h-4 mr-2 text-purple-600" />
                                                Category Filter
                                            </label>
                                            <select
                                                value={categoryFilter}
                                                onChange={(e) => setCategoryFilter(e.target.value)}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white"
                                                aria-label="Filter by category"
                                            >
                                                <option value="all">🏷️ All Categories</option>
                                                <option value="food">🍽️ Food</option>
                                                <option value="service">🤝 Service</option>
                                                <option value="ambiance">🎨 Ambiance</option>
                                                <option value="value">💰 Value</option>
                                                <option value="cleanliness">🧹 Cleanliness</option>
                                                <option value="other">📝 Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <Star className="w-4 h-4 mr-2 text-yellow-600" />
                                                Rating Filter
                                            </label>
                                            <select
                                                value={ratingFilter}
                                                onChange={(e) => setRatingFilter(e.target.value)}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white"
                                                aria-label="Filter by rating"
                                            >
                                                <option value="all">⭐ All Ratings</option>
                                                <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                                                <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                                                <option value="3">⭐⭐⭐ 3 Stars</option>
                                                <option value="2">⭐⭐ 2 Stars</option>
                                                <option value="1">⭐ 1 Star</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 to-blue-50/50"></div>
                                <div className="relative overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Customer
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Rating
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Category
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Comments
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredItems.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                                    <span className="text-sm font-medium text-gray-700">
                                                                        {item.isAnonymous ? 'A' : (item.name ? item.name.charAt(0).toUpperCase() : '?')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {item.isAnonymous ? 'Anonymous' : item.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {item.email || item.phone || 'No contact'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {item.rating ? (
                                                            <div className="flex items-center">
                                                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                                                <span className="ml-1 text-sm text-gray-900">{item.rating}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-500">No rating</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm text-gray-900 capitalize">
                                                            {item.category || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900 max-w-xs truncate">
                                                            {item.comments || 'No comments'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <select
                                                            value={item.status}
                                                            onChange={(e) => updateStatus(item.id, e.target.value)}
                                                            className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(item.status)}`}
                                                            aria-label={`Update status for ${item.name}`}
                                                        >
                                                            <option value="new">New</option>
                                                            <option value="reviewed">Reviewed</option>
                                                            <option value="resolved">Resolved</option>
                                                            <option value="archived">Archived</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button className="text-blue-600 hover:text-blue-900">
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div >
    )
}
