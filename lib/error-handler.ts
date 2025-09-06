// Comprehensive error handling utilities

export interface AppError {
  code: string;
  message: string;
  details?: string;
  statusCode?: number;
  timestamp: string;
  context?: Record<string, unknown>;
}

export class ErrorHandler {
  static createError(
    code: string,
    message: string,
    details?: string,
    statusCode: number = 500,
    context?: Record<string, unknown>
  ): AppError {
    return {
      code,
      message,
      details,
      statusCode,
      timestamp: new Date().toISOString(),
      context,
    };
  }

  static handleApiError(error: unknown): AppError {
    console.error("API Error:", error);

    if (error instanceof Error) {
      // Database errors
      if (error.message.includes("Unique constraint")) {
        return this.createError(
          "DUPLICATE_ENTRY",
          "This record already exists",
          error.message,
          409
        );
      }

      if (error.message.includes("Foreign key constraint")) {
        return this.createError(
          "INVALID_REFERENCE",
          "Referenced record does not exist",
          error.message,
          400
        );
      }

      if (error.message.includes("Connection")) {
        return this.createError(
          "DATABASE_ERROR",
          "Database connection failed",
          "Please try again later",
          503
        );
      }

      // Validation errors
      if (error.message.includes("validation")) {
        return this.createError(
          "VALIDATION_ERROR",
          "Invalid data provided",
          error.message,
          400
        );
      }

      // Generic error
      return this.createError(
        "INTERNAL_ERROR",
        "An unexpected error occurred",
        error.message,
        500
      );
    }

    // Unknown error type
    return this.createError(
      "UNKNOWN_ERROR",
      "An unknown error occurred",
      "Please contact support if this persists",
      500
    );
  }

  static handleNetworkError(error: unknown): AppError {
    console.error("Network Error:", error);

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return this.createError(
        "NETWORK_ERROR",
        "Unable to connect to server",
        "Please check your internet connection",
        0
      );
    }

    return this.createError(
      "NETWORK_ERROR",
      "Network request failed",
      "Please try again later",
      0
    );
  }

  static handleValidationError(field: string, message: string): AppError {
    return this.createError(
      "VALIDATION_ERROR",
      `Invalid ${field}`,
      message,
      400
    );
  }

  static handleAuthError(
    message: string = "Authentication required"
  ): AppError {
    return this.createError(
      "AUTH_ERROR",
      message,
      "Please log in to continue",
      401
    );
  }

  static handlePermissionError(
    message: string = "Insufficient permissions"
  ): AppError {
    return this.createError(
      "PERMISSION_ERROR",
      message,
      "You do not have permission to perform this action",
      403
    );
  }

  static handleNotFoundError(resource: string = "Resource"): AppError {
    return this.createError(
      "NOT_FOUND",
      `${resource} not found`,
      "The requested resource does not exist",
      404
    );
  }

  static handleRateLimitError(): AppError {
    return this.createError(
      "RATE_LIMIT",
      "Too many requests",
      "Please wait before trying again",
      429
    );
  }

  static handleSecurityError(message: string): AppError {
    return this.createError(
      "SECURITY_ERROR",
      "Security violation detected",
      message,
      403
    );
  }
}

// Error display utilities
export const getErrorMessage = (error: AppError): string => {
  return error.message || "An unexpected error occurred";
};

export const getErrorDetails = (error: AppError): string => {
  return error.details || "No additional details available";
};

export const isRetryableError = (error: AppError): boolean => {
  const retryableCodes = ["NETWORK_ERROR", "DATABASE_ERROR", "INTERNAL_ERROR"];
  return retryableCodes.includes(error.code);
};

export const getErrorIcon = (error: AppError): string => {
  switch (error.code) {
    case "NETWORK_ERROR":
      return "🌐";
    case "DATABASE_ERROR":
      return "🗄️";
    case "AUTH_ERROR":
      return "🔐";
    case "PERMISSION_ERROR":
      return "🚫";
    case "VALIDATION_ERROR":
      return "⚠️";
    case "NOT_FOUND":
      return "🔍";
    case "RATE_LIMIT":
      return "⏱️";
    case "SECURITY_ERROR":
      return "🛡️";
    default:
      return "❌";
  }
};

export const getErrorColor = (error: AppError): string => {
  switch (error.code) {
    case "NETWORK_ERROR":
    case "DATABASE_ERROR":
      return "text-orange-600 bg-orange-100";
    case "AUTH_ERROR":
    case "PERMISSION_ERROR":
      return "text-red-600 bg-red-100";
    case "VALIDATION_ERROR":
      return "text-yellow-600 bg-yellow-100";
    case "NOT_FOUND":
      return "text-blue-600 bg-blue-100";
    case "RATE_LIMIT":
      return "text-purple-600 bg-purple-100";
    case "SECURITY_ERROR":
      return "text-red-700 bg-red-200";
    default:
      return "text-gray-600 bg-gray-100";
  }
};
