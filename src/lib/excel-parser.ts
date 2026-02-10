import * as XLSX from 'xlsx';

export interface ExcelColumn {
  name: string;
  index: number;
}

export interface ColumnMapping {
  excelColumn: string;
  databaseField: string;
}

export interface MemberRow {
  Phone_ID: string;
  Member_Number: string;
  Name: string;
  Industry: string;
  Master?: string;
  Join_Date: string | Date;
  Status: string;
}

export interface ActivityRow {
  名称: string;
  身份?: string;
  出席情况: string;
  提供内部引荐: number;
  提供外部引荐: number;
  收到内部引荐: number;
  收到外部引荐: number;
  来宾: number;
  一对一会面: number;
  交易价值: number;
  CEU: number;
}

// Interface for mapped activity data with English field names
export interface MappedActivityRow {
  memberName: string;
  identity?: string;
  attendance: string;
  provideInsideRef: number;
  provideOutsideRef: number;
  receivedInsideRef: number;
  receivedOutsideRef: number;
  visitors: number;
  oneToOneVisit: number;
  tyfcb: number;
  ceu: number;
}

export interface TermRow {
  terms: string;
  'start time': string | Date;
  'end time': string | Date;
  weekNumber: number;
  date: string | Date;
  'meeting or not': boolean;
  remarks?: string;
}

export function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function getExcelColumns(data: any[]): ExcelColumn[] {
  if (data.length === 0) return [];
  const firstRow = data[0];
  return Object.keys(firstRow).map((name, index) => ({
    name,
    index,
  }));
}

export function mapColumns<T>(
  data: any[],
  mapping: ColumnMapping[],
  defaultMapping: Record<string, string>
): T[] {
  return data.map((row) => {
    const mapped: any = {};
    // First, apply the custom mapping - this renames columns
    mapping.forEach(({ excelColumn, databaseField }) => {
      mapped[databaseField] = row[excelColumn];
    });
    // Then apply default mapping for unmapped fields
    Object.keys(defaultMapping).forEach((dbField) => {
      if (mapped[dbField] === undefined) {
        mapped[dbField] = defaultMapping[dbField];
      }
    });
    return mapped as T;
  });
}

export function validateMemberRow(row: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!row.Phone_ID) errors.push('Phone_ID is required');
  if (!row.Member_Number) errors.push('Member_Number is required');
  if (!row.Name) errors.push('Name is required');
  if (!row.Industry) errors.push('Industry is required');
  if (!row.Join_Date) errors.push('Join_Date is required');
  if (!row.Status) errors.push('Status is required');
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateActivityRow(row: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!row.名称) errors.push('名称 (Name) is required');
  if (!row.出席情况) errors.push('出席情况 (Attendance) is required');
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Validation for mapped activity data with English field names
export function validateMappedActivityRow(row: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!row.memberName) errors.push('memberName is required');
  if (!row.attendance) errors.push('attendance is required');
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateTermRow(row: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!row.terms) errors.push('terms is required');
  if (!row['start time']) errors.push('start time is required');
  if (!row['end time']) errors.push('end time is required');
  if (!row.weekNumber) errors.push('weekNumber is required');
  if (!row.date) errors.push('date is required');
  if (row['meeting or not'] === undefined) errors.push('meeting or not is required');
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
