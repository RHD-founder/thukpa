import React from 'react'
import Link from 'next/link'
import { MessageSquare, BarChart3, Download, Star } from 'lucide-react'
import FeedbackForm from './components/FeedbackForm'
import Header from './components/Header'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Share Your
            <span className="text-blue-600"> Experience</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Help us improve by sharing your feedback. Your voice matters and helps us create better experiences for everyone.
          </p>
          <div className="flex justify-center items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
              <span className="ml-2">4.8/5 from 1,200+ reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Form Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FeedbackForm />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Why Your Feedback Matters
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We use your feedback to continuously improve our services and create better experiences for all our customers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Real-time Feedback</h4>
              <p className="text-gray-600">
                Share your thoughts instantly and see how your feedback contributes to improvements.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Data-Driven Insights</h4>
              <p className="text-gray-600">
                We analyze all feedback to identify trends and make informed decisions about our services.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Transparent Reporting</h4>
              <p className="text-gray-600">
                Access comprehensive reports and analytics to understand how feedback drives change.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              
              <h4 className="text-xl font-bold">FeedbackHub</h4>
            </div>
            <p className="text-gray-400 mb-4">
              Empowering better experiences through feedback
            </p>
            <div className="flex justify-center space-x-6">
              <Link href="/admin/login" className="text-gray-400 hover:text-white transition-colors">
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}