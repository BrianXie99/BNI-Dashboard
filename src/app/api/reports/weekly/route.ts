import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/reports/weekly - Get weekly reports
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();

    const weeklyReports = await prisma.weeklyReport.findMany({
      where: { year },
      orderBy: [{ weekNumber: 'asc' }],
    });

    return NextResponse.json(weeklyReports);
  } catch (error) {
    console.error('Weekly reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly reports' },
      { status: 500 }
    );
  }
}
