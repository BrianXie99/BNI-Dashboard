import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/activities/upload/weekly/mappings - Get saved mapping templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadType = searchParams.get('uploadType') || 'weekly';
    
    const templates = await prisma.columnMappingTemplate.findMany({
      where: { uploadType },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('Get mappings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch column mapping templates' },
      { status: 500 }
    );
  }
}
