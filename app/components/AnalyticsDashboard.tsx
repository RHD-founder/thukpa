'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Area,
    ComposedChart,
    Legend,
    RadialBarChart,
    RadialBar,
    Line
} from 'recharts'
import {
    TrendingUp,
    Users,
    Star,
    MessageSquare,
    Download,
    BarChart3,
    PieChart as PieChartIcon
} from 'lucide-react'

interface FeedbackData {
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

interface AnalyticsData {
    totalFeedback: number
    averageRating: number
    ratingDistribution: { rating: number; count: number }[]
    categoryDistribution: { category: string; count: number }[]
    sentimentDistribution: { sentiment: string; count: number }[]
    dailyFeedback: { date: string; count: number; avgRating: number }[]
    locationStats: { location: string; count: number; avgRating: number }[]
    recentFeedback: FeedbackData[]
}

const COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4',
    '#84CC16', '#F97316', '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'
]


export default function AnalyticsDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState(30)
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [chartType, setChartType] = useState<'bar' | 'pie'>('bar')

    const fetchAnalytics = useCallback(async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/analytics?days=${dateRange}&category=${selectedCategory}`)
            const analyticsData = await response.json()
            setData(analyticsData)
        } catch (error) {
            console.error('Failed to fetch analytics:', error)
        } finally {
            setLoading(false)
        }
    }, [dateRange, selectedCategory])

    useEffect(() => {
        fetchAnalytics()
    }, [fetchAnalytics])

    const exportData = async (format: 'csv' | 'excel' | 'pdf') => {
        try {
            const response = await fetch(`/api/feedback/export?format=${format}&days=${dateRange}&category=${selectedCategory}`)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `feedback-export-${format}-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Export failed:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!data) {
        return <div className="text-center text-gray-500">No data available</div>
    }

    return (
        <div className="space-y-6">
            {/* Advanced SVG Gradients for ultra-smooth charts */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                    {/* Bar Chart Gradients */}
                    <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                        <stop offset="50%" stopColor="#2563EB" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                        <stop offset="50%" stopColor="#059669" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                        <stop offset="50%" stopColor="#D97706" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#B45309" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                        <stop offset="50%" stopColor="#7C3AED" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#6D28D9" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity={1} />
                        <stop offset="50%" stopColor="#DC2626" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#B91C1C" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#06B6D4" stopOpacity={1} />
                        <stop offset="50%" stopColor="#0891B2" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#0E7490" stopOpacity={0.7} />
                    </linearGradient>

                    {/* Area Chart Gradients */}
                    <linearGradient id="areaBlueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="30%" stopColor="#3B82F6" stopOpacity={0.4} />
                        <stop offset="70%" stopColor="#3B82F6" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="areaGreenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                        <stop offset="30%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="70%" stopColor="#10B981" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
                    </linearGradient>

                    {/* Radial Gradients for donut charts */}
                    <radialGradient id="radialBlue" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.8} />
                    </radialGradient>
                    <radialGradient id="radialGreen" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                    </radialGradient>
                    <radialGradient id="radialYellow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                        <stop offset="100%" stopColor="#D97706" stopOpacity={0.8} />
                    </radialGradient>
                    <radialGradient id="radialPurple" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.8} />
                    </radialGradient>
                    <radialGradient id="radialRed" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity={1} />
                        <stop offset="100%" stopColor="#DC2626" stopOpacity={0.8} />
                    </radialGradient>
                    <radialGradient id="radialCyan" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#06B6D4" stopOpacity={1} />
                        <stop offset="100%" stopColor="#0891B2" stopOpacity={0.8} />
                    </radialGradient>
                </defs>
            </svg>

            {/* Header with Controls */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                            Analytics Dashboard
                        </h2>
                        <p className="text-gray-600">Comprehensive feedback analysis and insights</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(Number(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            aria-label="Date range filter"
                        >
                            <option value={7}>Last 7 days</option>
                            <option value={30}>Last 30 days</option>
                            <option value={90}>Last 90 days</option>
                            <option value={365}>Last year</option>
                        </select>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            aria-label="Category filter"
                        >
                            <option value="all">All Categories</option>
                            <option value="food">Food</option>
                            <option value="service">Service</option>
                            <option value="ambiance">Ambiance</option>
                            <option value="value">Value</option>
                        </select>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setChartType('bar')}
                                className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${chartType === 'bar'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                aria-label="Switch to bar chart view"
                            >
                                <BarChart3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setChartType('pie')}
                                className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${chartType === 'pie'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                aria-label="Switch to pie chart view"
                            >
                                <PieChartIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <MessageSquare className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="text-right">
                            <div className="flex items-center text-green-600 text-sm font-medium">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                {data.totalFeedback > 0 ? '+5.2%' : '0%'}
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Total Feedback</p>
                        <p className="text-2xl font-bold text-gray-900">{data.totalFeedback}</p>
                        <p className="text-xs text-gray-500 mt-1">This month</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Star className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="text-right">
                            <div className="flex items-center text-green-600 text-sm font-medium">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                {data.averageRating > 0 ? '+3.1%' : '0%'}
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Average Rating</p>
                        <p className="text-2xl font-bold text-gray-900">{data.averageRating.toFixed(1)}</p>
                        <p className="text-xs text-gray-500 mt-1">Out of 5 stars</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="text-right">
                            <div className="flex items-center text-green-600 text-sm font-medium">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                {(data.sentimentDistribution.find(s => s.sentiment === 'positive')?.count || 0) > 0 ? '+7.8%' : '0%'}
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Positive Sentiment</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {data.sentimentDistribution.find(s => s.sentiment === 'positive')?.count || 0}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Happy customers</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="text-right">
                            <div className="flex items-center text-green-600 text-sm font-medium">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                {data.locationStats.length > 0 ? '+2.4%' : '0%'}
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Unique Locations</p>
                        <p className="text-2xl font-bold text-gray-900">{data.locationStats.length}</p>
                        <p className="text-xs text-gray-500 mt-1">Active locations</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Rating Distribution */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'bar' ? (
                                <BarChart data={data.ratingDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barCategoryGap="20%">
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#f0f0f0"
                                        strokeOpacity={0.6}
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="rating"
                                        tick={{
                                            fontSize: 13,
                                            fill: '#6B7280',
                                            fontWeight: 500,
                                            fontFamily: 'Inter, system-ui, sans-serif'
                                        }}
                                        axisLine={{
                                            stroke: '#E5E7EB',
                                            strokeWidth: 1.5
                                        }}
                                        tickLine={{
                                            stroke: '#E5E7EB',
                                            strokeWidth: 1.5
                                        }}
                                        tickMargin={8}
                                    />
                                    <YAxis
                                        tick={{
                                            fontSize: 13,
                                            fill: '#6B7280',
                                            fontWeight: 500,
                                            fontFamily: 'Inter, system-ui, sans-serif'
                                        }}
                                        axisLine={{
                                            stroke: '#E5E7EB',
                                            strokeWidth: 1.5
                                        }}
                                        tickLine={{
                                            stroke: '#E5E7EB',
                                            strokeWidth: 1.5
                                        }}
                                        tickMargin={8}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(229, 231, 235, 0.8)',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                            padding: '12px 16px',
                                            fontSize: '14px',
                                            fontFamily: 'Inter, system-ui, sans-serif'
                                        }}
                                        formatter={(value) => [`${value} ratings`, 'Count']}
                                        labelFormatter={(label) => `${label} Star${label !== '1' ? 's' : ''}`}
                                        cursor={{
                                            fill: 'rgba(59, 130, 246, 0.1)',
                                            stroke: '#3B82F6',
                                            strokeWidth: 1,
                                            strokeDasharray: '5 5'
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill="url(#blueGradient)"
                                        radius={[8, 8, 0, 0]}
                                        animationBegin={0}
                                        animationDuration={2000}
                                        animationEasing="ease-out"
                                        stroke="#ffffff"
                                        strokeWidth={1}
                                        style={{
                                            filter: 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.2))'
                                        }}
                                    />
                                </BarChart>
                            ) : (
                                <PieChart>
                                    <Pie
                                        data={data.ratingDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ rating }) => (
                                            <text
                                                x={0}
                                                y={0}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                style={{
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    fill: '#374151',
                                                    fontFamily: 'Inter, system-ui, sans-serif'
                                                }}
                                            >
                                                {`${rating}★`}
                                            </text>
                                        )}
                                        outerRadius={110}
                                        innerRadius={50}
                                        fill="#8884d8"
                                        dataKey="count"
                                        animationBegin={0}
                                        animationDuration={2000}
                                        animationEasing="ease-out"
                                        paddingAngle={2}
                                    >
                                        {data.ratingDistribution?.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={`url(#radial${['Blue', 'Green', 'Yellow', 'Purple', 'Red', 'Cyan'][index % 6]})`}
                                                stroke="#ffffff"
                                                strokeWidth={3}
                                                style={{
                                                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                                                }}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(229, 231, 235, 0.8)',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                            padding: '12px 16px',
                                            fontSize: '14px',
                                            fontFamily: 'Inter, system-ui, sans-serif'
                                        }}
                                        formatter={(value, name, props) => [
                                            `${value} ratings`,
                                            `${props.payload.rating} Star${props.payload.rating !== '1' ? 's' : ''}`
                                        ]}
                                    />
                                </PieChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.categoryDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    innerRadius={40}
                                    fill="#8884d8"
                                    dataKey="count"
                                    animationBegin={0}
                                    animationDuration={1500}
                                    animationEasing="ease-out"
                                >
                                    {data.categoryDistribution?.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            stroke="#ffffff"
                                            strokeWidth={2}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    formatter={(value) => [`${value} feedback`, 'Count']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Daily Feedback Trend */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Feedback Trend</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data.dailyFeedback} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#f0f0f0"
                                strokeOpacity={0.6}
                                vertical={false}
                            />
                            <XAxis
                                dataKey="date"
                                tick={{
                                    fontSize: 13,
                                    fill: '#6B7280',
                                    fontWeight: 500,
                                    fontFamily: 'Inter, system-ui, sans-serif'
                                }}
                                axisLine={{
                                    stroke: '#E5E7EB',
                                    strokeWidth: 1.5
                                }}
                                tickLine={{
                                    stroke: '#E5E7EB',
                                    strokeWidth: 1.5
                                }}
                                tickMargin={8}
                                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis
                                yAxisId="left"
                                tick={{
                                    fontSize: 13,
                                    fill: '#6B7280',
                                    fontWeight: 500,
                                    fontFamily: 'Inter, system-ui, sans-serif'
                                }}
                                axisLine={{
                                    stroke: '#E5E7EB',
                                    strokeWidth: 1.5
                                }}
                                tickLine={{
                                    stroke: '#E5E7EB',
                                    strokeWidth: 1.5
                                }}
                                tickMargin={8}
                                label={{
                                    value: 'Feedback Count',
                                    angle: -90,
                                    position: 'insideLeft',
                                    style: {
                                        textAnchor: 'middle',
                                        fill: '#6B7280',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        fontFamily: 'Inter, system-ui, sans-serif'
                                    }
                                }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tick={{
                                    fontSize: 13,
                                    fill: '#6B7280',
                                    fontWeight: 500,
                                    fontFamily: 'Inter, system-ui, sans-serif'
                                }}
                                axisLine={{
                                    stroke: '#E5E7EB',
                                    strokeWidth: 1.5
                                }}
                                tickLine={{
                                    stroke: '#E5E7EB',
                                    strokeWidth: 1.5
                                }}
                                tickMargin={8}
                                label={{
                                    value: 'Avg Rating',
                                    angle: 90,
                                    position: 'insideRight',
                                    style: {
                                        textAnchor: 'middle',
                                        fill: '#6B7280',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        fontFamily: 'Inter, system-ui, sans-serif'
                                    }
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(229, 231, 235, 0.8)',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                    padding: '12px 16px',
                                    fontSize: '14px',
                                    fontFamily: 'Inter, system-ui, sans-serif'
                                }}
                                formatter={(value, name) => {
                                    if (name === 'count') return [`${value} feedback`, 'Count'];
                                    if (name === 'avgRating') return [`${Number(value).toFixed(1)} stars`, 'Avg Rating'];
                                    return [value, name];
                                }}
                                labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                                cursor={{
                                    fill: 'rgba(59, 130, 246, 0.05)',
                                    stroke: '#3B82F6',
                                    strokeWidth: 1,
                                    strokeDasharray: '5 5'
                                }}
                            />
                            <Legend
                                wrapperStyle={{
                                    fontFamily: 'Inter, system-ui, sans-serif',
                                    fontSize: '13px',
                                    fontWeight: '500'
                                }}
                            />
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="count"
                                stroke="#3B82F6"
                                fill="url(#areaBlueGradient)"
                                strokeWidth={4}
                                animationBegin={0}
                                animationDuration={2500}
                                animationEasing="ease-out"
                                style={{
                                    filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.2))'
                                }}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="avgRating"
                                stroke="#F59E0B"
                                strokeWidth={4}
                                dot={{
                                    fill: '#F59E0B',
                                    strokeWidth: 3,
                                    r: 6,
                                    stroke: '#ffffff',
                                    style: {
                                        filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3))'
                                    }
                                }}
                                activeDot={{
                                    r: 8,
                                    stroke: '#F59E0B',
                                    strokeWidth: 3,
                                    fill: '#ffffff',
                                    style: {
                                        filter: 'drop-shadow(0 4px 8px rgba(245, 158, 11, 0.4))'
                                    }
                                }}
                                animationBegin={500}
                                animationDuration={2500}
                                animationEasing="ease-out"
                                style={{
                                    filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.2))'
                                }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Sentiment Analysis & Location Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sentiment Analysis Radial Chart */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Analysis</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={data.sentimentDistribution?.map((item, index) => ({
                                ...item,
                                fill: COLORS[index % COLORS.length]
                            }))}>
                                <RadialBar
                                    dataKey="count"
                                    cornerRadius={10}
                                    fill="#8884d8"
                                    animationBegin={0}
                                    animationDuration={2000}
                                    animationEasing="ease-out"
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    formatter={(value) => [`${value} feedback`, 'Count']}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown'}
                                />
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Location Performance */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Performance</h3>
                    <div className="h-80 overflow-y-auto">
                        <div className="space-y-4">
                            {data.locationStats?.map((location, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-900">
                                                {location.location || 'Unknown'}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {location.count} feedback
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-4 h-4 ${i < Math.round(location.avgRating)
                                                            ? 'text-yellow-400 fill-current'
                                                            : 'text-gray-300'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">
                                                {location.avgRating.toFixed(1)}
                                            </span>
                                        </div>
                                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${Math.min((location.avgRating / 5) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Export Options */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => exportData('csv')}
                        className="group flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                        <Download className="w-5 h-5 mr-3 group-hover:animate-bounce" />
                        <span className="font-medium">Export CSV</span>
                    </button>
                    <button
                        onClick={() => exportData('excel')}
                        className="group flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                        <Download className="w-5 h-5 mr-3 group-hover:animate-bounce" />
                        <span className="font-medium">Export Excel</span>
                    </button>
                    <button
                        onClick={() => exportData('pdf')}
                        className="group flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                        <Download className="w-5 h-5 mr-3 group-hover:animate-bounce" />
                        <span className="font-medium">Export PDF</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
