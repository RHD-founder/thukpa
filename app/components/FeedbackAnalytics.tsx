'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Clock, Eye, Star, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    AreaChart
} from 'recharts'

interface FeedbackStats {
    totalSubmissions: number
    todaySubmissions: number
    averageRating: number
    anonymousCount: number
    recentSubmissions: Array<{
        id: string
        name: string
        rating: number
        category: string
        timestamp: string
        isAnonymous: boolean
    }>
    categoryBreakdown: Record<string, number>
    ratingDistribution: Record<string, number>
    dailyTrend: Array<{
        date: string
        count: number
        avgRating: number
    }>
}

const COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4',
    '#84CC16', '#F97316', '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'
]

// Add SVG gradients for smooth charts
const ChartGradients = () => (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
            <linearGradient id="categoryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                <stop offset="50%" stopColor="#2563EB" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="30%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="70%" stopColor="#10B981" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
            </linearGradient>
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
)

export default function FeedbackAnalytics() {
    const [stats, setStats] = useState<FeedbackStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchFeedbackStats = async () => {
            try {
                const response = await fetch('/api/feedback/stats')
                const data = await response.json()
                setStats(data)
            } catch (error) {
                console.error('Failed to fetch feedback stats:', error)
                // Set empty stats if API fails
                setStats({
                    totalSubmissions: 0,
                    todaySubmissions: 0,
                    averageRating: 0,
                    anonymousCount: 0,
                    recentSubmissions: [],
                    categoryBreakdown: {},
                    ratingDistribution: {},
                    dailyTrend: []
                })
            } finally {
                setLoading(false)
            }
        }

        fetchFeedbackStats()
    }, [])

    if (loading) {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">📊 Feedback Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <ChartGradients />
            <h2 className="text-2xl font-bold text-gray-900">📊 Feedback Analytics</h2>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <MessageSquare className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                                <p className="text-2xl font-bold text-gray-900">{stats?.totalSubmissions || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Clock className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Today&apos;s Submissions</p>
                                <p className="text-2xl font-bold text-gray-900">{stats?.todaySubmissions || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Star className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                                <p className="text-2xl font-bold text-gray-900">{stats?.averageRating?.toFixed(1) || '0.0'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Eye className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Anonymous</p>
                                <p className="text-2xl font-bold text-gray-900">{stats?.anonymousCount || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Submissions */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {stats?.recentSubmissions?.map((submission) => (
                            <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-medium">
                                            {submission.isAnonymous ? 'A' : (submission.name ? submission.name.charAt(0) : '?')}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {submission.isAnonymous ? 'Anonymous' : submission.name}
                                        </p>
                                        <p className="text-sm text-gray-500 capitalize">
                                            {submission.category} • {new Date(submission.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < submission.rating
                                                    ? 'text-yellow-400 fill-current'
                                                    : 'text-gray-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm font-medium">{submission.rating}/5</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown Chart */}
                <Card className="hover:shadow-md transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                            Category Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.categoryBreakdown ? Object.entries(stats.categoryBreakdown).map(([category, count]) => ({
                                    category: category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Unknown',
                                    count,
                                    fill: COLORS[Object.keys(stats.categoryBreakdown).indexOf(category) % COLORS.length]
                                })) : []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barCategoryGap="20%">
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#f0f0f0"
                                        strokeOpacity={0.6}
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="category"
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
                                        formatter={(value) => [`${value} feedback`, 'Count']}
                                        cursor={{
                                            fill: 'rgba(59, 130, 246, 0.1)',
                                            stroke: '#3B82F6',
                                            strokeWidth: 1,
                                            strokeDasharray: '5 5'
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill="url(#categoryGradient)"
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
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Rating Distribution Chart */}
                <Card className="hover:shadow-md transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Star className="w-5 h-5 mr-2 text-yellow-600" />
                            Rating Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats?.ratingDistribution ? Object.entries(stats.ratingDistribution).map(([rating, count]) => ({
                                            rating: `${rating} Star${rating !== '1' ? 's' : ''}`,
                                            count,
                                            fill: COLORS[parseInt(rating) - 1] || COLORS[0]
                                        })) : []}
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
                                                {`${rating}`}
                                            </text>
                                        )}
                                        outerRadius={90}
                                        innerRadius={40}
                                        fill="#8884d8"
                                        dataKey="count"
                                        animationBegin={0}
                                        animationDuration={2000}
                                        animationEasing="ease-out"
                                        paddingAngle={2}
                                    >
                                        {stats?.ratingDistribution ? Object.entries(stats.ratingDistribution).map(([,], index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={`url(#radial${['Blue', 'Green', 'Yellow', 'Purple', 'Red', 'Cyan'][index % 6]})`}
                                                stroke="#ffffff"
                                                strokeWidth={3}
                                                style={{
                                                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                                                }}
                                            />
                                        )) : []}
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
                                            `${props.payload.rating}`
                                        ]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Daily Trend Chart */}
            {stats?.dailyTrend && stats.dailyTrend.length > 0 && (
                <Card className="hover:shadow-md transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                            Daily Feedback Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.dailyTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                                            fill: 'rgba(16, 185, 129, 0.05)',
                                            stroke: '#10B981',
                                            strokeWidth: 1,
                                            strokeDasharray: '5 5'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#10B981"
                                        fill="url(#trendGradient)"
                                        strokeWidth={4}
                                        animationBegin={0}
                                        animationDuration={2500}
                                        animationEasing="ease-out"
                                        style={{
                                            filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.2))'
                                        }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
