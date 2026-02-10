import { NextRequest, NextResponse } from 'next/server';
import { parseExcelFile, getExcelColumns } from '@/lib/excel-parser';

// POST /api/activities/upload/weekly/parse - Parse Excel and return columns for mapping
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Parse Excel file
    const data = await parseExcelFile(file);
    
    if (data.length === 0) {
      return NextResponse.json(
        { error: 'Excel file is empty or could not be parsed' },
        { status: 400 }
      );
    }
    
    // Get columns from Excel
    const columns = getExcelColumns(data);
    
    // Return sample data for preview (first 5 rows)
    const sampleData = data.slice(0, 5);
    
    return NextResponse.json({
      success: true,
      columns,
      sampleData,
      totalRows: data.length,
    });
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: 'Failed to parse Excel file' },
      { status: 500 }
    );
  }
}
