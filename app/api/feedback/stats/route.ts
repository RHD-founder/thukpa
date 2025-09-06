import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get total submissions
    const totalSubmissions = await prisma.feedback.count();

    // Get today's submissions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySubmissions = await prisma.feedback.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // Get average rating
    const avgRatingResult = await prisma.feedback.aggregate({
      _avg: {
        rating: true,
      },
    });
    const averageRating = avgRatingResult._avg.rating || 0;

    // Get anonymous count
    const anonymousCount = await prisma.feedback.count({
      where: {
        isAnonymous: true,
      },
    });

    // Get recent submissions (last 10)
    const recentSubmissions = await prisma.feedback.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        rating: true,
        category: true,
        createdAt: true,
        isAnonymous: true,
      },
    });

    // Get category breakdown
    const categoryStats = await prisma.feedback.groupBy({
      by: ["category"],
      _count: {
        category: true,
      },
    });

    const categoryBreakdown = categoryStats.reduce((acc, stat) => {
      // Handle null categories by using "Other" as default
      const category = stat.category || "Other";
      acc[category] = stat._count.category;
      return acc;
    }, {} as Record<string, number>);

    // Get rating distribution
    const ratingStats = await prisma.feedback.groupBy({
      by: ["rating"],
      _count: {
        rating: true,
      },
    });

    const ratingDistribution = ratingStats.reduce((acc, stat) => {
      // Handle null ratings by filtering them out or treating them as "no rating"
      if (stat.rating !== null) {
        acc[stat.rating.toString()] = stat._count.rating;
      }
      return acc;
    }, {} as Record<string, number>);

    // Get daily trend for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyTrendData = await prisma.feedback.groupBy({
      by: ["createdAt"],
      _count: {
        id: true,
      },
      _avg: {
        rating: true,
      },
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Process daily trend data
    const dailyTrend = dailyTrendData
      .map((day) => ({
        date: day.createdAt.toISOString().split("T")[0],
        count: day._count.id,
        avgRating: day._avg.rating || 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const stats = {
      totalSubmissions,
      todaySubmissions,
      averageRating: Number(averageRating.toFixed(1)),
      anonymousCount,
      recentSubmissions: recentSubmissions.map((submission) => ({
        id: submission.id,
        name: submission.isAnonymous
          ? "Anonymous"
          : submission.name || "Unknown",
        rating: submission.rating || 0,
        category: submission.category || "Other",
        timestamp: submission.createdAt.toISOString(),
        isAnonymous: submission.isAnonymous,
      })),
      categoryBreakdown,
      ratingDistribution,
      dailyTrend,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch feedback stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback statistics" },
      { status: 500 }
    );
  }
}
