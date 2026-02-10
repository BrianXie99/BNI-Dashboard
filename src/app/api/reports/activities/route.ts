import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/reports/activities - Get member activities for a specific week
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekNumber = searchParams.get('weekNumber') ? parseInt(searchParams.get('weekNumber')!) : null;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();

    if (!weekNumber) {
      return NextResponse.json(
        { error: 'Week number is required' },
        { status: 400 }
      );
    }

    const activities = await prisma.activity.findMany({
      where: { weekNumber, year },
      include: {
        member: true,
      },
      orderBy: {
        activityDate: 'asc',
      },
    });

    // Group activities by member
    const memberActivities = new Map<string, any>();

    activities.forEach((activity) => {
      const memberId = activity.memberId;
      const existing = memberActivities.get(memberId) || {
        memberName: activity.memberName,
        memberNumber: activity.member?.memberNumber || '',
        industry: activity.member?.industry || '',
        referrals: 0,
        tyfcb: 0,
        oneToOnes: 0,
        visitors: 0,
        attendance: '出席',
      };

      existing.referrals += activity.provideInsideRef + activity.provideOutsideRef;
      existing.tyfcb += activity.tyfcb;
      existing.oneToOnes += activity.oneToOneVisit;
      existing.visitors += activity.visitors;
      
      // Use the most recent attendance status
      existing.attendance = activity.attendance;

      memberActivities.set(memberId, existing);
    });

    return NextResponse.json(Array.from(memberActivities.values()));
  } catch (error) {
    console.error('Member activities error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member activities' },
      { status: 500 }
    );
  }
}
