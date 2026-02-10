import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseExcelFile, mapColumns, validateMemberRow, type MemberRow } from '@/lib/excel-parser';

// GET /api/members - Get all members
export async function GET() {
  try {
    const members = await prisma.member.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

// POST /api/members - Create new member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const member = await prisma.member.create({
      data: {
        phoneId: body.phoneId,
        memberNumber: body.memberNumber,
        name: body.name,
        industry: body.industry,
        master: body.master || null,
        joinDate: new Date(body.joinDate),
        status: body.status,
      },
    });
    
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    );
  }
}

// PUT /api/members - Update member
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    const member = await prisma.member.update({
      where: { id },
      data: {
        ...updateData,
        joinDate: updateData.joinDate ? new Date(updateData.joinDate) : undefined,
      },
    });
    
    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    );
  }
}

// DELETE /api/members - Delete member
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    await prisma.member.delete({
      where: { id: id || '' },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete member' },
      { status: 500 }
    );
  }
}
