export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/ai-insights - Get all AI insights
export async function GET() {
  try {
    const insights = await prisma.aIInsight.findMany({
      include: {
        member: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    // Generate mock performance analysis and matches
    const members = await prisma.member.findMany({
      where: { status: 'ACTIVE' },
      include: {
        activities: {
          orderBy: { activityDate: 'desc' },
          take: 10,
        },
      },
    });

    const performanceAnalysis = members.map((member) => {
      const activities = member.activities;
      const totalReferrals = activities.reduce((sum, a) => sum + a.provideInsideRef + a.provideOutsideRef, 0);
      const totalTYFCB = activities.reduce((sum, a) => sum + a.tyfcb, 0);
      const totalOneToOnes = activities.reduce((sum, a) => sum + a.oneToOneVisit, 0);
      const attendanceCount = activities.filter((a) => a.attendance === '出席').length;
      const attendanceRate = activities.length > 0 ? (attendanceCount / activities.length) * 100 : 0;

      // Calculate scores (normalized)
      const referralScore = Math.min(100, (totalReferrals / 10) * 100);
      const tyfcbScore = Math.min(100, (totalTYFCB / 10000) * 100);
      const attendanceScore = attendanceRate;
      const oneToOneScore = Math.min(100, (totalOneToOnes / 5) * 100);
      const overallScore = (referralScore + tyfcbScore + attendanceScore + oneToOneScore) / 4;

      return {
        memberId: member.id,
        memberName: member.name,
        industry: member.industry,
        overallScore: Math.round(overallScore),
        referralScore: Math.round(referralScore),
        tyfcbScore: Math.round(tyfcbScore),
        attendanceScore: Math.round(attendanceScore),
        oneToOneScore: Math.round(oneToOneScore),
        trend: 'STABLE' as const,
      };
    });

    // Generate mock member matches based on industries
    const memberMatches: any[] = [];
    const industryGroups = new Map<string, any[]>();

    members.forEach((member) => {
      const industry = member.industry.toLowerCase();
      if (!industryGroups.has(industry)) {
        industryGroups.set(industry, []);
      }
      industryGroups.get(industry)?.push(member);
    });

    // Find potential matches (complementary industries)
    const complementaryPairs = [
      ['real estate', 'mortgage'],
      ['insurance', 'financial planning'],
      ['web design', 'marketing'],
      ['accounting', 'tax services'],
      ['legal', 'business consulting'],
    ];

    complementaryPairs.forEach(([industry1, industry2]) => {
      const group1 = industryGroups.get(industry1) || [];
      const group2 = industryGroups.get(industry2) || [];

      if (group1.length > 0 && group2.length > 0) {
        for (let i = 0; i < Math.min(group1.length, group2.length); i++) {
          memberMatches.push({
            member1: {
              id: group1[i].id,
              name: group1[i].name,
              industry: group1[i].industry,
            },
            member2: {
              id: group2[i].id,
              name: group2[i].name,
              industry: group2[i].industry,
            },
            matchScore: Math.floor(Math.random() * 20) + 80,
            reason: `Complementary industries: ${group1[i].industry} and ${group2[i].industry} often work together on client projects.`,
          });
        }
      }
    });

    return NextResponse.json({
      insights,
      matches: memberMatches.slice(0, 10),
      performance: performanceAnalysis.sort((a, b) => b.overallScore - a.overallScore).slice(0, 10),
    });
  } catch (error) {
    console.error('AI insights error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI insights' },
      { status: 500 }
    );
  }
}
