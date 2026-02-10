import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/activities/upload/weekly/save-mapping - Save column mapping template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, mapping, isDefault } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      );
    }
    
    if (!mapping || typeof mapping !== 'object') {
      return NextResponse.json(
        { error: 'Mapping is required and must be an object' },
        { status: 400 }
      );
    }
    
    // If setting as default, remove default flag from other templates
    if (isDefault) {
      await prisma.columnMappingTemplate.updateMany({
        where: { uploadType: 'weekly' },
        data: { isDefault: false },
      });
    }
    
    // Create or update template
    const existing = await prisma.columnMappingTemplate.findFirst({
      where: { name, uploadType: 'weekly' },
    });

    const template = existing
      ? await prisma.columnMappingTemplate.update({
          where: { id: existing.id },
          data: {
            mapping,
            isDefault: isDefault || false,
          },
        })
      : await prisma.columnMappingTemplate.create({
          data: {
            name,
            uploadType: 'weekly',
            mapping,
            isDefault: isDefault || false,
          },
        });
    
    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Save mapping error:', error);
    return NextResponse.json(
      { error: 'Failed to save column mapping template' },
      { status: 500 }
    );
  }
}
