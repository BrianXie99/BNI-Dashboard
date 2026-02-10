import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/terms - Get all terms
export async function GET() {
  try {
    const terms = await prisma.term.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(terms);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch terms' },
      { status: 500 }
    );
  }
}

// POST /api/terms - Create new term
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const term = await prisma.term.create({
      data: {
        term: body.term,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        weekNumber: body.weekNumber,
        date: new Date(body.date),
        isMeeting: body.isMeeting ?? true,
        remarks: body.remarks || null,
      },
    });
    
    return NextResponse.json(term, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create term' },
      { status: 500 }
    );
  }
}

// PUT /api/terms - Update term
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    const term = await prisma.term.update({
      where: { id },
      data: {
        ...updateData,
        startTime: updateData.startTime ? new Date(updateData.startTime) : undefined,
        endTime: updateData.endTime ? new Date(updateData.endTime) : undefined,
        date: updateData.date ? new Date(updateData.date) : undefined,
      },
    });
    
    return NextResponse.json(term);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update term' },
      { status: 500 }
    );
  }
}

// DELETE /api/terms - Delete term
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    await prisma.term.delete({
      where: { id: id || '' },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete term' },
      { status: 500 }
    );
  }
}
