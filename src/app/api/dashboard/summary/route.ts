import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/dashboard/summary - Get dashboard summary statistics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekNumber = searchParams.get('weekNumber') ? parseInt(searchParams.get('weekNumber')!) : undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    
    // Get activities for the specified period
    const whereClause = weekNumber
      ? { weekNumber, year }
      : { year };
    
    const activities = await prisma.activity.findMany({
      where: whereClause,
      include: {
        member: true,
      },
    });
    
    // Calculate statistics
    const totalMembers = new Set(activities.map(a => a.memberId)).size;
    const totalInsideReferrals = activities.reduce((sum: number, a) => sum + a.provideInsideRef, 0);
    const totalOutsideReferrals = activities.reduce((sum: number, a) => sum + a.provideOutsideRef, 0);
    const totalTYFCB = activities.reduce((sum: number, a) => sum + a.tyfcb, 0);
    const totalOneToOneVisits = activities.reduce((sum: number, a) => sum + a.oneToOneVisit, 0);
    const totalVisitors = activities.reduce((sum: number, a) => sum + a.visitors, 0);
    const totalCEU = activities.reduce((sum: number, a) => sum + a.ceu, 0);
    const attendanceCount = activities.filter(a => a.attendance === '出席').length;
    const attendanceRate = activities.length > 0 ? (attendanceCount / activities.length) * 100 : 0;
    
    // Get top performers
    const memberStats = new Map<string, { 
      memberId: string;
      memberName: string;
      industry: string;
      referrals: number; 
      tyfcb: number; 
      oneToOnes: number; 
    }>();
    
    activities.forEach(a => {
      const stats = memberStats.get(a.memberId) || {
        memberId: a.memberId,
        memberName: a.memberName,
        industry: a.member?.industry || '',
        referrals: 0, 
        tyfcb: 0, 
        oneToOnes: 0,
      };
      stats.referrals += a.provideInsideRef + a.provideOutsideRef;
      stats.tyfcb += a.tyfcb;
      stats.oneToOnes += a.oneToOneVisit;
      memberStats.set(a.memberId, stats);
    });
    
    const topReferrers = Array.from(memberStats.values())
      .sort((a, b) => b.referrals - a.referrals)
      .slice(0, 10);
    
    const topTYFCB = Array.from(memberStats.values())
      .sort((a, b) => b.tyfcb - a.tyfcb)
      .slice(0, 10);
    
    const topOneToOnes = Array.from(memberStats.values())
      .sort((a, b) => b.oneToOnes - a.oneToOnes)
      .slice(0, 10);
    
    // Get weekly reports for trend data
    const weeklyReports = await prisma.weeklyReport.findMany({
      where: { year },
      orderBy: [{ weekNumber: 'asc' }],
      take: 52,
    });
    
    return NextResponse.json({
      summary: {
        totalMembers,
        totalInsideReferrals,
        totalOutsideReferrals,
        totalReferrals: totalInsideReferrals + totalOutsideReferrals,
        totalTYFCB,
        totalOneToOneVisits,
        totalVisitors,
        totalCEU,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        totalActivities: activities.length,
      },
      topPerformers: {
        referrers: topReferrers,
        tyfcb: topTYFCB,
        oneToOnes: topOneToOnes,
      },
      trends: weeklyReports,
      period: { weekNumber, year },
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard summary' },
      { status: 500 }
    );
  }
}
