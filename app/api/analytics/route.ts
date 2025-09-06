import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { subDays, startOfDay, endOfDay } from "date-fns";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get("days") ?? 30);
    const category = searchParams.get("category") ?? "all";

    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    // Build where clause
    const where: Record<string, unknown> = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (category !== "all") {
      where.category = category;
    }

    // Get all feedback data
    const feedback = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Calculate metrics
    const totalFeedback = feedback.length;
    const ratings = feedback
      .filter((f) => f.rating !== null)
      .map((f) => f.rating!);
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

    // Rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: feedback.filter((f) => f.rating === rating).length,
    }));

    // Category distribution
    const categoryMap = new Map<string, number>();
    feedback.forEach((f) => {
      const cat = f.category || "uncategorized";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });
    const categoryDistribution = Array.from(categoryMap.entries()).map(
      ([category, count]) => ({
        category,
        count,
      })
    );

    // Sentiment distribution
    const sentimentMap = new Map<string, number>();
    feedback.forEach((f) => {
      const sentiment = f.sentiment || "neutral";
      sentimentMap.set(sentiment, (sentimentMap.get(sentiment) || 0) + 1);
    });
    const sentimentDistribution = Array.from(sentimentMap.entries()).map(
      ([sentiment, count]) => ({
        sentiment,
        count,
      })
    );

    // Daily feedback trend
    const dailyMap = new Map<
      string,
      { count: number; totalRating: number; ratingCount: number }
    >();
    feedback.forEach((f) => {
      const date = f.createdAt.toISOString().split("T")[0];
      const existing = dailyMap.get(date) || {
        count: 0,
        totalRating: 0,
        ratingCount: 0,
      };
      existing.count += 1;
      if (f.rating !== null) {
        existing.totalRating += f.rating;
        existing.ratingCount += 1;
      }
      dailyMap.set(date, existing);
    });

    const dailyFeedback = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        count: data.count,
        avgRating:
          data.ratingCount > 0 ? data.totalRating / data.ratingCount : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Location statistics
    const locationMap = new Map<
      string,
      { count: number; totalRating: number; ratingCount: number }
    >();
    feedback.forEach((f) => {
      const location = f.location || "Unknown";
      const existing = locationMap.get(location) || {
        count: 0,
        totalRating: 0,
        ratingCount: 0,
      };
      existing.count += 1;
      if (f.rating !== null) {
        existing.totalRating += f.rating;
        existing.ratingCount += 1;
      }
      locationMap.set(location, existing);
    });

    const locationStats = Array.from(locationMap.entries())
      .map(([location, data]) => ({
        location,
        count: data.count,
        avgRating:
          data.ratingCount > 0 ? data.totalRating / data.ratingCount : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Recent feedback (last 10)
    const recentFeedback = feedback.slice(0, 10);

    const analyticsData = {
      totalFeedback,
      averageRating,
      ratingDistribution,
      categoryDistribution,
      sentimentDistribution,
      dailyFeedback,
      locationStats,
      recentFeedback,
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
