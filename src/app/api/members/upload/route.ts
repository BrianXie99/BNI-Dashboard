import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Read the Excel file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'Excel file is empty' },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];

      try {
        // Validate required fields
        if (!row.Phone_ID || !row.Member_Number || !row.Name || !row.Industry || !row.Join_Date || !row.Status) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Missing required fields`);
          continue;
        }

        // Parse join date
        let joinDate: Date;
        if (typeof row.Join_Date === 'number') {
          // Excel date serial number
          joinDate = XLSX.SSF.parse_date_code(row.Join_Date);
        } else {
          joinDate = new Date(row.Join_Date);
        }

        if (isNaN(joinDate.getTime())) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Invalid date format`);
          continue;
        }

        // Create or update member
        await prisma.member.upsert({
          where: { phoneId: String(row.Phone_ID) },
          update: {
            memberNumber: String(row.Member_Number),
            name: String(row.Name),
            industry: String(row.Industry),
            master: row.Master ? String(row.Master) : null,
            joinDate: joinDate,
            status: row.Status === 'ACTIVE' || row.Status === 'Active' ? 'ACTIVE' : 'INACTIVE',
          },
          create: {
            phoneId: String(row.Phone_ID),
            memberNumber: String(row.Member_Number),
            name: String(row.Name),
            industry: String(row.Industry),
            master: row.Master ? String(row.Master) : null,
            joinDate: joinDate,
            status: row.Status === 'ACTIVE' || row.Status === 'Active' ? 'ACTIVE' : 'INACTIVE',
          },
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    return NextResponse.json({
      message: `Upload completed. ${results.success} members imported, ${results.failed} failed.`,
      results,
    });
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process file: ' + error.message },
      { status: 500 }
    );
  }
}
