import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseExcelFile, mapColumns, validateMappedActivityRow, type MappedActivityRow } from '@/lib/excel-parser';
import { getWeek, getYear } from 'date-fns';

// POST /api/activities/upload/weekly/with-mapping - Upload weekly activity Excel with custom mapping
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const activityDateStr = formData.get('activityDate') as string; // YYYYMMDD format
    const uploadedBy = formData.get('uploadedBy') as string || 'admin';
    const mappingStr = formData.get('mapping') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    if (!activityDateStr) {
      return NextResponse.json(
        { error: 'Activity date is required (YYYYMMDD format)' },
        { status: 400 }
      );
    }
    
    if (!mappingStr) {
      return NextResponse.json(
        { error: 'Column mapping is required' },
        { status: 400 }
      );
    }
    
    // Parse mapping from JSON string
    const mapping = JSON.parse(mappingStr);
    
    // Parse activity date from YYYYMMDD format
    const year = parseInt(activityDateStr.substring(0, 4));
    const month = parseInt(activityDateStr.substring(4, 6)) - 1; // 0-indexed
    const day = parseInt(activityDateStr.substring(6, 8));
    const activityDate = new Date(year, month, day);
    const weekNumber = getWeek(activityDate);
    
    // Parse Excel file
    const data = await parseExcelFile(file);
    
    // Get all members for matching
    const allMembers = await prisma.member.findMany();
    const memberMap = new Map<string, { id: string; phoneId: string; name: string }>();
    allMembers.forEach(member => {
      memberMap.set(member.name, {
        id: member.id,
        phoneId: member.phoneId,
        name: member.name,
      });
    });
    
    // Convert mapping to ColumnMapping[] format
    const columnMappings = Object.entries(mapping).map(([dbField, excelColumn]) => ({
      excelColumn: excelColumn as string,
      databaseField: dbField,
    }));
    
    // Map columns using custom mapping
    const mappedData = mapColumns<MappedActivityRow>(data, columnMappings, {});
    
    // Map and validate activities
    const activities = mappedData.map((row) => {
      // Validate using the English field names from MappedActivityRow
      const validation = validateMappedActivityRow(row);
      if (!validation.valid) {
        console.error('Validation errors:', validation.errors);
        return null;
      }
      
      // Match member by name
      const member = memberMap.get(row.memberName);
      if (!member) {
        console.error(`Member not found: ${row.memberName}`);
        return null;
      }
      
      return {
        memberId: member.id,
        phoneId: member.phoneId,
        memberName: row.memberName,
        identity: row.identity || null,
        activityDate,
        weekNumber,
        year,
        attendance: row.attendance || '出席',
        provideInsideRef: row.provideInsideRef || 0,
        provideOutsideRef: row.provideOutsideRef || 0,
        receivedInsideRef: row.receivedInsideRef || 0,
        receivedOutsideRef: row.receivedOutsideRef || 0,
        visitors: row.visitors || 0,
        oneToOneVisit: row.oneToOneVisit || 0,
        tyfcb: row.tyfcb || 0,
        ceu: row.ceu || 0,
        uploadedBy,
      };
    }).filter(Boolean); // Remove null entries
    
    // Create activities in batch
    const result = await prisma.activity.createMany({
      data: activities as any,
      skipDuplicates: true,
    });
    
    // Generate weekly report
    await generateWeeklyReport(weekNumber, year);
    
    return NextResponse.json({
      success: true,
      uploaded: result.count,
      weekNumber,
      year,
      activityDate,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload activities' },
      { status: 500 }
    );
  }
}

async function generateWeeklyReport(weekNumber: number, year: number) {
  // Calculate week start and end dates
  const startDate = new Date(year, 0, 1 + (weekNumber - 1) * 7);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  // Get all activities for the week
  const activities = await prisma.activity.findMany({
    where: {
      weekNumber,
      year,
    },
  });
  
  // Calculate statistics
  const totalMembers = new Set(activities.map(a => a.memberId)).size;
  const totalInsideReferrals = activities.reduce((sum, a) => sum + a.provideInsideRef, 0);
  const totalOutsideReferrals = activities.reduce((sum, a) => sum + a.provideOutsideRef, 0);
  const totalTYFCB = activities.reduce((sum, a) => sum + a.tyfcb, 0);
  const totalOneToOneVisits = activities.reduce((sum, a) => sum + a.oneToOneVisit, 0);
  const totalVisitors = activities.reduce((sum, a) => sum + a.visitors, 0);
  const totalCEU = activities.reduce((sum, a) => sum + a.ceu, 0);
  const attendanceCount = activities.filter(a => a.attendance === '出席').length;
  const attendanceRate = activities.length > 0 ? (attendanceCount / activities.length) * 100 : 0;
  
  // Get top performers
  const memberStats = new Map<string, { referrals: number; tyfcb: number; oneToOnes: number }>();
  activities.forEach(a => {
    const stats = memberStats.get(a.memberId) || { referrals: 0, tyfcb: 0, oneToOnes: 0 };
    stats.referrals += a.provideInsideRef + a.provideOutsideRef;
    stats.tyfcb += a.tyfcb;
    stats.oneToOnes += a.oneToOneVisit;
    memberStats.set(a.memberId, stats);
  });
  
  const topReferrers = Array.from(memberStats.entries())
    .sort((a, b) => b[1].referrals - a[1].referrals)
    .slice(0, 5)
    .map(([memberId, stats]) => ({ memberId, referrals: stats.referrals }));
  
  const topTYFCB = Array.from(memberStats.entries())
    .sort((a, b) => b[1].tyfcb - a[1].tyfcb)
    .slice(0, 5)
    .map(([memberId, stats]) => ({ memberId, tyfcb: stats.tyfcb }));
  
  const topOneToOnes = Array.from(memberStats.entries())
    .sort((a, b) => b[1].oneToOnes - a[1].oneToOnes)
    .slice(0, 5)
    .map(([memberId, stats]) => ({ memberId, oneToOnes: stats.oneToOnes }));
  
  // Create or update weekly report
  await prisma.weeklyReport.upsert({
    where: {
      weekNumber_year: {
        weekNumber,
        year,
      },
    },
    update: {
      startDate,
      endDate,
      totalMembers,
      totalInsideReferrals,
      totalOutsideReferrals,
      totalTYFCB,
      totalOneToOneVisits,
      totalVisitors,
      attendanceRate,
      totalCEU,
      topReferrers,
      topTYFCB,
      topOneToOnes,
    },
    create: {
      weekNumber,
      year,
      startDate,
      endDate,
      totalMembers,
      totalInsideReferrals,
      totalOutsideReferrals,
      totalTYFCB,
      totalOneToOneVisits,
      totalVisitors,
      attendanceRate,
      totalCEU,
      topReferrers,
      topTYFCB,
      topOneToOnes,
    },
  });
}
