'use client'

import Link from 'next/link'
import { Home, ArrowLeft, AlertTriangle } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <AlertTriangle className="mx-auto h-24 w-24 text-blue-600" />
                    <h1 className="mt-4 text-6xl font-bold text-gray-900">404</h1>
                    <h2 className="mt-2 text-2xl font-semibold text-gray-700">
                        Page Not Found
                    </h2>
                    <p className="mt-4 text-gray-600">
                        Sorry, we couldn&apos;t find the page you&apos;re looking for.
                    </p>
                </div>

                <div className="space-y-4">
                    <Link
                        href="/"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    >
                        <Home className="w-5 h-5 mr-2" />
                        Go Home
                    </Link>

                    <div>
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
