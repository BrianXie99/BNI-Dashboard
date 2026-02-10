import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/ai-insights/generate - Generate AI insights
export async function POST() {
  try {
    // Get recent activities and members
    const members = await prisma.member.findMany({
      where: { status: 'ACTIVE' },
      include: {
        activities: {
          orderBy: { activityDate: 'desc' },
          take: 10,
        },
      },
    });

    // Clear existing insights
    await prisma.aIInsight.deleteMany({});

    // Generate insights for each member
    const insightsToCreate: any[] = [];

    for (const member of members) {
      const activities = member.activities;
      const totalReferrals = activities.reduce((sum: number, a: any) => sum + a.provideInsideRef + a.provideOutsideRef, 0);
      const totalTYFCB = activities.reduce((sum: number, a: any) => sum + a.tyfcb, 0);
      const totalOneToOnes = activities.reduce((sum: number, a: any) => sum + a.oneToOneVisit, 0);
      const attendanceCount = activities.filter((a: any) => a.attendance === '出席').length;
      const attendanceRate = activities.length > 0 ? (attendanceCount / activities.length) * 100 : 0;

      // Performance insights
      if (totalReferrals > 5) {
        insightsToCreate.push({
          memberId: member.id,
          insightType: 'PERFORMANCE',
          title: `${member.name} is a Top Referrer`,
          content: `${member.name} has generated ${totalReferrals} referrals in recent activities, placing them among the top performers in the chapter.`,
          recommendations: [
            'Consider recognizing this member at the next meeting',
            'Ask them to share their referral strategies with the group',
            'Feature their success story in chapter communications',
          ],
        });
      }

      if (totalTYFCB > 50000) {
        insightsToCreate.push({
          memberId: member.id,
          insightType: 'PERFORMANCE',
          title: `${member.name} is Exceeding TYFCB Goals`,
          content: `${member.name} has achieved $${totalTYFCB.toLocaleString()} in TYFCB, demonstrating strong business generation capabilities.`,
          recommendations: [
            'Celebrate this milestone publicly',
            'Encourage them to mentor other members',
            'Use their success as a case study',
          ],
        });
      }

      // Opportunity insights
      if (attendanceRate < 70) {
        insightsToCreate.push({
          memberId: member.id,
          insightType: 'OPPORTUNITY',
          title: `Improve ${member.name}'s Attendance`,
          content: `${member.name}'s attendance rate is ${attendanceRate.toFixed(1)}%, which is below the recommended 80% threshold.`,
          recommendations: [
            'Schedule a one-to-one to discuss any barriers',
            'Offer to help with meeting preparation',
            'Ensure they feel valued and engaged',
          ],
        });
      }

      if (totalOneToOnes < 2) {
        insightsToCreate.push({
          memberId: member.id,
          insightType: 'OPPORTUNITY',
          title: `${member.name} Needs More One-to-Ones`,
          content: `${member.name} has only completed ${totalOneToOnes} one-to-one meetings recently. Regular one-to-ones are essential for building referral relationships.`,
          recommendations: [
            'Encourage them to schedule more one-to-ones',
            'Offer to help them identify good matches',
            'Track their one-to-one progress',
          ],
        });
      }

      // Pattern insights
      if (totalReferrals > 0 && totalTYFCB === 0) {
        insightsToCreate.push({
          memberId: member.id,
          insightType: 'PATTERN',
          title: `${member.name} Gives Referrals But No TYFCB`,
          content: `${member.name} is actively giving referrals but hasn't reported any TYFCB. This may indicate a need for better follow-up tracking.`,
          recommendations: [
            'Educate on the importance of TYFCB tracking',
            'Help them understand the referral-to-closed business process',
            'Provide tools for better follow-up management',
          ],
        });
      }
    }

    // Create insights in batches
    for (const insight of insightsToCreate) {
      await prisma.aIInsight.create({
        data: insight,
      });
    }

    return NextResponse.json({
      success: true,
      insightsCreated: insightsToCreate.length,
    });
  } catch (error) {
    console.error('Generate AI insights error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI insights' },
      { status: 500 }
    );
  }
}
