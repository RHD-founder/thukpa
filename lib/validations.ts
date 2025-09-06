import { z } from "zod";

// Feedback form validation
export const feedbackSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),

  email: z
    .string()
    .email("Invalid email format")
    .max(254, "Email must be less than 254 characters")
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number format")
    .optional()
    .or(z.literal("")),

  contact: z
    .string()
    .max(100, "Contact must be less than 100 characters")
    .optional()
    .or(z.literal("")),

  location: z
    .string()
    .max(100, "Location must be less than 100 characters")
    .optional()
    .or(z.literal("")),

  rating: z
    .union([z.number(), z.string()])
    .transform((val) => {
      if (typeof val === "string") {
        const num = parseInt(val);
        return isNaN(num) ? undefined : num;
      }
      return val;
    })
    .refine((val) => val === undefined || (val >= 1 && val <= 5), {
      message: "Rating must be between 1 and 5",
    })
    .optional(),

  comments: z
    .string()
    .max(2000, "Comments must be less than 2000 characters")
    .optional()
    .or(z.literal("")),

  category: z
    .enum(["food", "service", "ambiance", "value", "cleanliness", "other"])
    .optional(),

  visitDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((val) => {
      if (!val || val === "") return undefined;
      try {
        return new Date(val).toISOString();
      } catch {
        return undefined;
      }
    }),

  isAnonymous: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === "string") {
        return val === "true";
      }
      return val;
    })
    .default(false),

  tags: z.string().optional().or(z.literal("")),
});

// Admin login validation
export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .max(254, "Email must be less than 254 characters"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

// User creation validation
export const createUserSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .max(254, "Email must be less than 254 characters"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),

  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),

  role: z.enum(["admin", "moderator"]).default("moderator"),
});

// Feedback update validation
export const updateFeedbackSchema = z.object({
  status: z.enum(["new", "reviewed", "resolved", "archived"]),
});

// Search and filter validation
export const searchSchema = z.object({
  q: z
    .string()
    .max(100, "Search query must be less than 100 characters")
    .optional(),

  status: z
    .enum(["all", "new", "reviewed", "resolved", "archived"])
    .default("all"),

  category: z
    .enum([
      "all",
      "food",
      "service",
      "ambiance",
      "value",
      "cleanliness",
      "other",
    ])
    .default("all"),

  rating: z.enum(["all", "1", "2", "3", "4", "5"]).default("all"),

  page: z
    .number()
    .int("Page must be a whole number")
    .min(1, "Page must be at least 1")
    .default(1),

  limit: z
    .number()
    .int("Limit must be a whole number")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must be at most 100")
    .default(20),
});

// Export validation
export const exportSchema = z.object({
  format: z.enum(["csv", "excel", "pdf"]).default("csv"),

  days: z
    .number()
    .int("Days must be a whole number")
    .min(1, "Days must be at least 1")
    .max(365, "Days must be at most 365")
    .default(30),

  category: z
    .enum([
      "all",
      "food",
      "service",
      "ambiance",
      "value",
      "cleanliness",
      "other",
    ])
    .default("all"),
});

// Analytics validation
export const analyticsSchema = z.object({
  days: z
    .number()
    .int("Days must be a whole number")
    .min(1, "Days must be at least 1")
    .max(365, "Days must be at most 365")
    .default(30),

  category: z
    .enum([
      "all",
      "food",
      "service",
      "ambiance",
      "value",
      "cleanliness",
      "other",
    ])
    .default("all"),
});

// Type exports
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type ExportInput = z.infer<typeof exportSchema>;
export type AnalyticsInput = z.infer<typeof analyticsSchema>;
