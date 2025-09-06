"use client";

import { useState } from "react";
import { X, AlertTriangle, RefreshCw, Info } from "lucide-react";
import { AppError, getErrorMessage, getErrorDetails, getErrorIcon, getErrorColor, isRetryableError } from "@/lib/error-handler";

interface ErrorDisplayProps {
    error: AppError | null;
    onRetry?: () => void;
    onDismiss?: () => void;
    showDetails?: boolean;
    className?: string;
}

export default function ErrorDisplay({
    error,
    onRetry,
    onDismiss,
    showDetails = false,
    className = ""
}: ErrorDisplayProps) {
    const [showFullDetails, setShowFullDetails] = useState(false);

    if (!error) return null;

    const errorMessage = getErrorMessage(error);
    const errorDetails = getErrorDetails(error);
    const errorIcon = getErrorIcon(error);
    const _errorColor = getErrorColor(error);
    const canRetry = isRetryableError(error) && onRetry;

    return (
        <div className={`bg-white border-l-4 border-red-500 rounded-lg shadow-lg ${className}`}>
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                <span className="mr-2">{errorIcon}</span>
                                {errorMessage}
                            </h3>
                            <div className="flex items-center space-x-2">
                                {canRetry && (
                                    <button
                                        onClick={onRetry}
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Retry
                                    </button>
                                )}
                                {onDismiss && (
                                    <button
                                        onClick={onDismiss}
                                        className="text-gray-400 hover:text-gray-600"
                                        aria-label="Dismiss error"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {errorDetails && (
                            <div className="mt-2">
                                <p className="text-sm text-gray-600">{errorDetails}</p>
                            </div>
                        )}

                        {showDetails && (
                            <div className="mt-3">
                                <button
                                    onClick={() => setShowFullDetails(!showFullDetails)}
                                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                    <Info className="h-4 w-4 mr-1" />
                                    {showFullDetails ? 'Hide' : 'Show'} Technical Details
                                </button>

                                {showFullDetails && (
                                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                                        <div className="text-xs text-gray-600 space-y-1">
                                            <div><strong>Error Code:</strong> {error.code}</div>
                                            <div><strong>Status Code:</strong> {error.statusCode || 'N/A'}</div>
                                            <div><strong>Timestamp:</strong> {new Date(error.timestamp).toLocaleString()}</div>
                                            {error.context && Object.keys(error.context).length > 0 && (
                                                <div>
                                                    <strong>Context:</strong>
                                                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                                                        {JSON.stringify(error.context, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Inline error component for forms
export function InlineError({ error, className = "" }: { error: string | null; className?: string }) {
    if (!error) return null;

    return (
        <div className={`flex items-center text-sm text-red-600 mt-1 ${className}`}>
            <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
            <span>{error}</span>
        </div>
    );
}

// Loading state component
export function LoadingState({ message = "Loading...", className = "" }: { message?: string; className?: string }) {
    return (
        <div className={`flex items-center justify-center p-8 ${className}`}>
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">{message}</p>
            </div>
        </div>
    );
}

// Empty state component
export function EmptyState({
    message,
    description,
    icon: Icon = Info,
    action,
    className = ""
}: {
    message: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
    action?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`text-center py-12 ${className}`}>
            <Icon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{message}</h3>
            {description && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
            {action && (
                <div className="mt-6">{action}</div>
            )}
        </div>
    );
}
