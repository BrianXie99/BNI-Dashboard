import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/activities - Get all activities or filter by query params
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const phoneId = searchParams.get('phoneId');
    const weekNumber = searchParams.get('weekNumber');
    const year = searchParams.get('year');

    const where: any = {};
    
    if (memberId) {
      where.memberId = memberId;
    }
    if (phoneId) {
      where.phoneId = phoneId;
    }
    if (weekNumber) {
      where.weekNumber = parseInt(weekNumber);
    }
    if (year) {
      where.year = parseInt(year);
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { activityDate: 'desc' },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
            industry: true,
          },
        },
      },
    });
    
    return NextResponse.json(activities);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

// POST /api/activities - Create new activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const activity = await prisma.activity.create({
      data: {
        memberId: body.memberId,
        phoneId: body.phoneId,
        memberName: body.memberName,
        identity: body.identity || null,
        activityDate: new Date(body.activityDate),
        weekNumber: body.weekNumber,
        year: body.year,
        attendance: body.attendance || '出席',
        provideInsideRef: body.provideInsideRef || 0,
        provideOutsideRef: body.provideOutsideRef || 0,
        receivedInsideRef: body.receivedInsideRef || 0,
        receivedOutsideRef: body.receivedOutsideRef || 0,
        visitors: body.visitors || 0,
        oneToOneVisit: body.oneToOneVisit || 0,
        tyfcb: body.tyfcb || 0,
        ceu: body.ceu || 0,
        uploadedAt: new Date(),
        uploadedBy: body.uploadedBy || 'system',
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
            industry: true,
          },
        },
      },
    });
    
    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}

// PUT /api/activities - Update activity
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    const activity = await prisma.activity.update({
      where: { id },
      data: {
        ...updateData,
        activityDate: updateData.activityDate ? new Date(updateData.activityDate) : undefined,
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
            industry: true,
          },
        },
      },
    });
    
    return NextResponse.json(activity);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    );
  }
}

// DELETE /api/activities - Delete activity
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      );
    }
    
    await prisma.activity.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    );
  }
}
