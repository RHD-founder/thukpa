'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare, BarChart3, LogOut, User } from 'lucide-react'
import { logoutAction } from '@/app/actions'

interface User {
    id: string
    email: string
    name: string
    role: string
}

export default function Header() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check if user is authenticated
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/me')
                if (response.ok) {
                    const data = await response.json()
                    setUser(data.user)
                }
            } catch (error) {
                console.error('Auth check failed:', error)
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [])

    const handleLogout = async () => {
        try {
            await logoutAction()
            setUser(null)
        } catch (error) {
            console.error('Logout failed:', error)
        }
    }

    if (loading) {
        return (
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <MessageSquare className="h-8 w-8 text-blue-600 mr-3" />
                            <h1 className="text-2xl font-bold text-gray-900">FeedbackHub</h1>
                        </div>
                        <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>
            </header>
        )
    }

    return (
        <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-6">
                    <div className="flex items-center">
                        <MessageSquare className="h-8 w-8 text-blue-600 mr-3" />
                        <h1 className="text-2xl font-bold text-gray-900">FeedbackHub</h1>
                    </div>
                    <nav className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <div className="flex items-center space-x-2 text-gray-700">
                                    <User className="w-4 h-4" />
                                    <span className="text-sm font-medium">{user.name}</span>
                                </div>
                                <Link
                                    href="/dashboard"
                                    className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Dashboard
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/admin/login"
                                className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
                            >
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Admin Login
                            </Link>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    )
}
