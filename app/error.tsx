'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application error:', error)
    }, [error])

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <AlertTriangle className="mx-auto h-24 w-24 text-red-600" />
                    <h1 className="mt-4 text-4xl font-bold text-gray-900">
                        Something went wrong!
                    </h1>
                    <p className="mt-4 text-gray-600">
                        We&apos;re sorry, but something unexpected happened. Please try again.
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                        <details className="mt-4 text-left">
                            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                                Error Details
                            </summary>
                            <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                                {error.message}
                            </pre>
                        </details>
                    )}
                </div>

                <div className="space-y-4">
                    <button
                        onClick={reset}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                    >
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Try Again
                    </button>

                    <div>
                        <Link
                            href="/"
                            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                        >
                            <Home className="w-5 h-5 mr-2" />
                            Go Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
