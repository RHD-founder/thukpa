import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { feedbackSchema, searchSchema } from "@/lib/validations";
import {
  getSecurityContext,
  sanitizeInput,
  createAuditLog,
} from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const context = await getSecurityContext(req);

    // Validate input
    const validatedData = feedbackSchema.parse(body);

    // Sanitize inputs
    const sanitizedData = {
      ...validatedData,
      name: sanitizeInput(validatedData.name),
      comments: validatedData.comments
        ? sanitizeInput(validatedData.comments)
        : null,
      location: validatedData.location
        ? sanitizeInput(validatedData.location)
        : null,
    };

    // Basic sentiment analysis based on rating and comments
    let sentiment = "neutral";
    if (sanitizedData.rating) {
      if (sanitizedData.rating >= 4) sentiment = "positive";
      else if (sanitizedData.rating <= 2) sentiment = "negative";
    }

    // Simple sentiment analysis based on keywords in comments
    if (sanitizedData.comments) {
      const positiveWords = [
        "good",
        "great",
        "excellent",
        "amazing",
        "wonderful",
        "fantastic",
        "love",
        "perfect",
      ];
      const negativeWords = [
        "bad",
        "terrible",
        "awful",
        "horrible",
        "disappointed",
        "hate",
        "worst",
      ];

      const commentLower = sanitizedData.comments.toLowerCase();
      const hasPositive = positiveWords.some((word) =>
        commentLower.includes(word)
      );
      const hasNegative = negativeWords.some((word) =>
        commentLower.includes(word)
      );

      if (hasPositive && !hasNegative) sentiment = "positive";
      else if (hasNegative && !hasPositive) sentiment = "negative";
    }

    const saved = await prisma.feedback.create({
      data: {
        name: sanitizedData.isAnonymous ? "Anonymous" : sanitizedData.name,
        contact: sanitizedData.contact || null,
        email: sanitizedData.email || null,
        phone: sanitizedData.phone || null,
        rating: sanitizedData.rating || null,
        comments: sanitizedData.comments || null,
        location: sanitizedData.location || null,
        category: sanitizedData.category || null,
        visitDate: sanitizedData.visitDate
          ? new Date(sanitizedData.visitDate)
          : null,
        isAnonymous: sanitizedData.isAnonymous,
        tags: sanitizedData.tags
          ? JSON.stringify(JSON.parse(sanitizedData.tags))
          : null,
        sentiment,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });

    // Log feedback creation
    await prisma.auditLog.create({
      data: createAuditLog(
        null,
        "create",
        "feedback",
        saved.id,
        {
          category: sanitizedData.category,
          rating: sanitizedData.rating,
          sentiment,
          isAnonymous: sanitizedData.isAnonymous,
        },
        context
      ),
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("Feedback creation error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create feedback" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const context = await getSecurityContext(req);

    // Validate search parameters
    const validatedParams = searchSchema.parse({
      q: searchParams.get("q") ?? "",
      status: searchParams.get("status") ?? "all",
      category: searchParams.get("category") ?? "all",
      rating: searchParams.get("rating") ?? "all",
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? 20),
    });

    const { q, status, category, rating, page, limit } = validatedParams;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    // Text search
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { comments: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { contact: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    // Status filter
    if (status !== "all") {
      where.status = status;
    }

    // Category filter
    if (category !== "all") {
      where.category = category;
    }

    // Rating filter
    if (rating !== "all") {
      const ratingNum = Number(rating);
      if (ratingNum >= 1 && ratingNum <= 5) {
        where.rating = { gte: ratingNum };
      }
    }

    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.feedback.count({ where }),
    ]);

    // Log search activity
    await prisma.auditLog.create({
      data: createAuditLog(
        null,
        "search",
        "feedback",
        null,
        {
          q,
          status,
          category,
          rating,
          page,
          limit,
          resultsCount: items.length,
        },
        context
      ),
    });

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Feedback fetch error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid search parameters" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}
