export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/reports/industry - Get reports by industry
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekNumber = searchParams.get('weekNumber');
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    
    // Build where clause
    const where: any = { year: parseInt(year) };
    if (weekNumber) {
      where.weekNumber = parseInt(weekNumber);
    }
    
    // Get all activities with member info
    const activities = await prisma.activity.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            industry: true,
            memberNumber: true,
          },
        },
      },
    });
    
    // Group by industry
    const industryStats = new Map<string, {
      industry: string;
      totalMembers: number;
      totalReferrals: number;
      totalTYFCB: number;
      totalOneToOneVisits: number;
      totalVisitors: number;
      totalCEU: number;
      attendanceCount: number;
    }>();
    
    activities.forEach((activity) => {
      const industry = activity.member.industry;
      const stats = industryStats.get(industry) || {
        industry,
        totalMembers: 0,
        totalReferrals: 0,
        totalTYFCB: 0,
        totalOneToOneVisits: 0,
        totalVisitors: 0,
        totalCEU: 0,
        attendanceCount: 0,
      };
      
      stats.totalMembers += 1;
      stats.totalReferrals += activity.provideInsideRef + activity.provideOutsideRef;
      stats.totalTYFCB += activity.tyfcb;
      stats.totalOneToOneVisits += activity.oneToOneVisit;
      stats.totalVisitors += activity.visitors;
      stats.totalCEU += activity.ceu;
      if (activity.attendance === '出席') {
        stats.attendanceCount += 1;
      }
      
      industryStats.set(industry, stats);
    });
    
    // Convert to array and sort by total referrals
    const result = Array.from(industryStats.values()).map((stats) => ({
      ...stats,
      attendanceRate: stats.totalMembers > 0 ? (stats.attendanceCount / stats.totalMembers) * 100 : 0,
    })).sort((a, b) => b.totalReferrals - a.totalReferrals);
    
    return NextResponse.json({
      success: true,
      data: result,
      weekNumber: weekNumber ? parseInt(weekNumber) : null,
      year: parseInt(year),
    });
  } catch (error) {
    console.error('Industry reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch industry reports' },
      { status: 500 }
    );
  }
}
