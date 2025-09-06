'use client'

import { useState } from 'react'
import { Star, User, Mail, Phone, MapPin, Calendar, MessageSquare, Tag, Eye, EyeOff } from 'lucide-react'
import { sanitizeInput, validateEmail, validatePhone } from '@/lib/sanitize'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

export default function FeedbackForm() {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [isAnonymous, setIsAnonymous] = useState(false)

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setMessage(null)
        const form = e.currentTarget
        const formData = new FormData(form)
        const payload = Object.fromEntries(formData.entries())

        // Sanitize all string inputs
        Object.keys(payload).forEach(key => {
            if (typeof payload[key] === 'string') {
                payload[key] = sanitizeInput(payload[key] as string)
            }
        })

        // Validate email and phone if provided
        if (payload.email && !validateEmail(payload.email as string)) {
            setMessage('Please enter a valid email address')
            setLoading(false)
            return
        }

        if (payload.phone && !validatePhone(payload.phone as string)) {
            setMessage('Please enter a valid phone number')
            setLoading(false)
            return
        }

        // Add rating and anonymous status
        if (rating) payload.rating = rating.toString()
        payload.isAnonymous = isAnonymous.toString()

        // Convert visitDate to ISO string if provided
        if (payload.visitDate) {
            payload.visitDate = new Date(payload.visitDate as string).toISOString()
        }

        const res = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })

        setLoading(false)
        if (res.ok) {
            form.reset()
            setRating(0)
            setHoverRating(0)
            setIsAnonymous(false)
            setMessage('Thank you for your valuable feedback! We appreciate your input.')
        } else {
            setMessage('Something went wrong. Please try again.')
        }
    }

    const handleStarClick = (value: number) => {
        setRating(value)
    }

    const handleStarHover = (value: number) => {
        setHoverRating(value)
    }

    const handleStarLeave = () => {
        setHoverRating(0)
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-gray-900 mb-2">Share Your Feedback</CardTitle>
                <p className="text-gray-600">Help us improve by sharing your experience</p>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-6">
                    {/* Name Field */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center text-sm font-medium text-gray-700">
                            <User className="w-4 h-4 mr-2" />
                            Name *
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Your full name"
                            required
                            className="w-full"
                        />
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700">
                                <Mail className="w-4 h-4 mr-2" />
                                Email
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="your.email@example.com"
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center text-sm font-medium text-gray-700">
                                <Phone className="w-4 h-4 mr-2" />
                                Phone
                            </Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <Label htmlFor="location" className="flex items-center text-sm font-medium text-gray-700">
                            <MapPin className="w-4 h-4 mr-2" />
                            Location
                        </Label>
                        <Input
                            id="location"
                            name="location"
                            placeholder="Restaurant name or location"
                            className="w-full"
                        />
                    </div>

                    {/* Visit Date */}
                    <div className="space-y-2">
                        <Label htmlFor="visitDate" className="flex items-center text-sm font-medium text-gray-700">
                            <Calendar className="w-4 h-4 mr-2" />
                            Visit Date
                        </Label>
                        <Input
                            id="visitDate"
                            name="visitDate"
                            type="date"
                            className="w-full"
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label htmlFor="category" className="flex items-center text-sm font-medium text-gray-700">
                            <Tag className="w-4 h-4 mr-2" />
                            Category
                        </Label>
                        <Select name="category">
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="food">Food Quality</SelectItem>
                                <SelectItem value="service">Service</SelectItem>
                                <SelectItem value="ambiance">Ambiance</SelectItem>
                                <SelectItem value="value">Value for Money</SelectItem>
                                <SelectItem value="cleanliness">Cleanliness</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Rating */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Star className="w-4 h-4 inline mr-2" />
                            Overall Rating
                        </label>
                        <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => handleStarClick(value)}
                                    onMouseEnter={() => handleStarHover(value)}
                                    onMouseLeave={handleStarLeave}
                                    className="focus:outline-none"
                                    aria-label={`Rate ${value} star${value !== 1 ? 's' : ''}`}
                                >
                                    <Star
                                        className={`w-8 h-8 transition-colors duration-200 ${value <= (hoverRating || rating)
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Click to rate'}
                        </p>
                    </div>

                    {/* Comments */}
                    <div className="space-y-2">
                        <Label htmlFor="comments" className="flex items-center text-sm font-medium text-gray-700">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Comments
                        </Label>
                        <Textarea
                            id="comments"
                            name="comments"
                            placeholder="Tell us about your experience..."
                            rows={4}
                            className="w-full resize-none"
                        />
                    </div>

                    {/* Anonymous Option */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="anonymous"
                            checked={isAnonymous}
                            onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                        />
                        <Label htmlFor="anonymous" className="text-sm text-gray-700 flex items-center cursor-pointer">
                            {isAnonymous ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                            Submit anonymously
                        </Label>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Submitting...
                            </div>
                        ) : (
                            'Submit Feedback'
                        )}
                    </Button>

                    {/* Message */}
                    {message && (
                        <div className={`p-4 rounded-lg ${message.includes('Thank you')
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                            {message}
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    )
}
