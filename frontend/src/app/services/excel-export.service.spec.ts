import { TestBed } from '@angular/core/testing';
import { ExcelExportService, XLSX_TOKEN } from './excel-export.service';
import * as XLSX from 'xlsx';

describe('ExcelExportService', () => {
  let service: ExcelExportService;
  let writeFileSpy: jasmine.Spy;
  let mockXLSX: typeof XLSX;

  const mockData = [
    { name: 'John Doe', age: 30, email: 'john@example.com' },
    { name: 'Jane Smith', age: 25, email: 'jane@example.com' }
  ];

  beforeEach(() => {
    // Créer un mock de XLSX avec un spy sur writeFile
    writeFileSpy = jasmine.createSpy('writeFile').and.stub();
    mockXLSX = {
      ...XLSX,
      writeFile: writeFileSpy
    } as typeof XLSX;

    TestBed.configureTestingModule({
      providers: [
        ExcelExportService,
        { provide: XLSX_TOKEN, useValue: mockXLSX }
      ]
    });

    service = TestBed.inject(ExcelExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('exportToExcel', () => {
    it('should export data to Excel file', () => {
      const fileName = 'test-export';
      const sheetName = 'Sheet1';

      service.exportToExcel(mockData, fileName, sheetName);

      expect(writeFileSpy).toHaveBeenCalled();
      const callArgs = writeFileSpy.calls.mostRecent().args;
      expect(callArgs[1]).toBe('test-export.xlsx');

      const workbook = callArgs[0];
      expect(workbook.SheetNames).toContain(sheetName);
      expect(workbook.Sheets[sheetName]).toBeDefined();
    });

    it('should use default sheet name when not provided', () => {
      const fileName = 'test-export';

      service.exportToExcel(mockData, fileName);

      expect(writeFileSpy).toHaveBeenCalled();
      const callArgs = writeFileSpy.calls.mostRecent().args;
      const workbook = callArgs[0];
      expect(workbook.SheetNames).toContain('Sheet1');
    });

    it('should calculate column widths automatically', () => {
      const fileName = 'test-export';
      const longData = [
        { name: 'Very Long Name That Exceeds Default Width', age: 30 },
        { name: 'Short', age: 25 }
      ];

      service.exportToExcel(longData, fileName);

      expect(writeFileSpy).toHaveBeenCalled();
      const callArgs = writeFileSpy.calls.mostRecent().args;
      const workbook = callArgs[0];
      const worksheet = workbook.Sheets['Sheet1'];
      expect(worksheet['!cols']).toBeDefined();
      expect(worksheet['!cols'].length).toBeGreaterThan(0);
    });

    it('should handle empty data array', () => {
      const fileName = 'empty-export';

      service.exportToExcel([], fileName);

      expect(writeFileSpy).toHaveBeenCalled();
      const callArgs = writeFileSpy.calls.mostRecent().args;
      const workbook = callArgs[0];
      expect(workbook.Sheets['Sheet1']).toBeDefined();
    });
  });

  describe('exportMultipleSheets', () => {
    it('should export multiple sheets to single file', () => {
      const sheets = [
        { data: mockData, sheetName: 'Users' },
        { data: [{ id: 1, value: 'Test' }], sheetName: 'Data' }
      ];
      const fileName = 'multi-sheet-export';

      service.exportMultipleSheets(sheets, fileName);

      expect(writeFileSpy).toHaveBeenCalled();
      const callArgs = writeFileSpy.calls.mostRecent().args;
      expect(callArgs[1]).toBe('multi-sheet-export.xlsx');

      const workbook = callArgs[0];
      expect(workbook.SheetNames.length).toBe(2);
      expect(workbook.SheetNames).toContain('Users');
      expect(workbook.SheetNames).toContain('Data');
      expect(workbook.Sheets['Users']).toBeDefined();
      expect(workbook.Sheets['Data']).toBeDefined();
    });

    it('should calculate column widths for each sheet', () => {
      const sheets = [
        { data: mockData, sheetName: 'Sheet1' },
        { data: [{ longColumn: 'Very Long Value' }], sheetName: 'Sheet2' }
      ];
      const fileName = 'test';

      service.exportMultipleSheets(sheets, fileName);

      expect(writeFileSpy).toHaveBeenCalled();
      const callArgs = writeFileSpy.calls.mostRecent().args;
      const workbook = callArgs[0];
      expect(workbook.Sheets['Sheet1']['!cols']).toBeDefined();
      expect(workbook.Sheets['Sheet2']['!cols']).toBeDefined();
    });
  });

  describe('exportWithCustomColumns', () => {
    it('should export with custom column configuration', () => {
      const columns = [
        { header: 'Full Name', key: 'name', width: 20 },
        { header: 'Email Address', key: 'email', width: 30 },
        { header: 'Age', key: 'age' }
      ];
      const fileName = 'custom-export';

      service.exportWithCustomColumns(mockData, columns, fileName);

      expect(writeFileSpy).toHaveBeenCalled();
      const callArgs = writeFileSpy.calls.mostRecent().args;
      const workbook = callArgs[0];
      const worksheet = workbook.Sheets['Sheet1'];

      // Verify column widths are set
      expect(worksheet['!cols']).toBeDefined();
      expect(worksheet['!cols'].length).toBe(3);
      expect(worksheet['!cols'][0].wch).toBe(20);
      expect(worksheet['!cols'][1].wch).toBe(30);
    });

    it('should use default width when not specified', () => {
      const columns = [
        { header: 'Name', key: 'name' },
        { header: 'Age', key: 'age', width: 10 }
      ];
      const fileName = 'test';

      service.exportWithCustomColumns(mockData, columns, fileName);

      expect(writeFileSpy).toHaveBeenCalled();
      const callArgs = writeFileSpy.calls.mostRecent().args;
      const workbook = callArgs[0];
      const worksheet = workbook.Sheets['Sheet1'];

      expect(worksheet['!cols'][0].wch).toBe(15); // Default width
      expect(worksheet['!cols'][1].wch).toBe(10); // Specified width
    });

    it('should handle missing data fields gracefully', () => {
      const columns = [
        { header: 'Name', key: 'name' },
        { header: 'Missing', key: 'nonexistent' }
      ];
      const fileName = 'test';

      service.exportWithCustomColumns(mockData, columns, fileName);

      expect(writeFileSpy).toHaveBeenCalled();
      const callArgs = writeFileSpy.calls.mostRecent().args;
      const workbook = callArgs[0];
      const worksheet = workbook.Sheets['Sheet1'];
      expect(worksheet).toBeDefined();
    });

    // it('should not set column widths if no width specified', () => {
    //   const columns = [
    //     { header: 'Name', key: 'name' },
    //     { header: 'Age', key: 'age' }
    //   ];
    //   const fileName = 'test';
    //
    //   // Remove width from all columns
    //   columns.forEach(col => delete col.key);
    //
    //   service.exportWithCustomColumns(mockData, columns, fileName);
    //
    //   expect(writeFileSpy).toHaveBeenCalled();
    //   const callArgs = writeFileSpy.calls.mostRecent().args;
    //   const workbook = callArgs[0];
    //   const worksheet = workbook.Sheets['Sheet1'];
    //
    //   // When no widths are specified, !cols might not be set
    //   // This tests the conditional logic
    //   expect(worksheet).toBeDefined();
    // });
  });

  describe('calculateColumnWidths (private method)', () => {
    it('should calculate appropriate column widths', () => {
      const longData = [
        { short: 'A', veryLongColumnName: 'This is a very long value that should affect width calculation' },
        { short: 'B', veryLongColumnName: 'Another long value' }
      ];

      service.exportToExcel(longData, 'test');

      expect(writeFileSpy).toHaveBeenCalled();
      const callArgs = writeFileSpy.calls.mostRecent().args;
      const workbook = callArgs[0];
      const worksheet = workbook.Sheets['Sheet1'];

      expect(worksheet['!cols']).toBeDefined();
      const widths = worksheet['!cols'];
      expect(widths.length).toBe(2);

      // Width should account for the longest value plus padding
      const longColumnWidth = widths.find((w: any, i: number) => i === 1);
      expect(longColumnWidth.wch).toBeGreaterThan(10);
    });

    it('should limit maximum column width to 50', () => {
      const veryLongData = [
        { col: 'A'.repeat(100) } // Very long value
      ];

      service.exportToExcel(veryLongData, 'test');

      expect(writeFileSpy).toHaveBeenCalled();
      const callArgs = writeFileSpy.calls.mostRecent().args;
      const workbook = callArgs[0];
      const worksheet = workbook.Sheets['Sheet1'];

      expect(worksheet['!cols']).toBeDefined();
      expect(worksheet['!cols'][0].wch).toBeLessThanOrEqual(50);
    });

    it('should handle empty data', () => {
      service.exportToExcel([], 'test');

      expect(writeFileSpy).toHaveBeenCalled();
      const callArgs = writeFileSpy.calls.mostRecent().args;
      const workbook = callArgs[0];
      const worksheet = workbook.Sheets['Sheet1'];

      // Should not throw error, but might have empty !cols
      expect(worksheet).toBeDefined();
    });

    it('should consider header length in width calculation', () => {
      const data = [
        { veryLongColumnHeaderName: 'short' }
      ];

      service.exportToExcel(data, 'test');

      expect(writeFileSpy).toHaveBeenCalled();
      const callArgs = writeFileSpy.calls.mostRecent().args;
      const workbook = callArgs[0];
      const worksheet = workbook.Sheets['Sheet1'];

      expect(worksheet['!cols']).toBeDefined();
      // Width should be at least as wide as the header
      expect(worksheet['!cols'][0].wch).toBeGreaterThanOrEqual('veryLongColumnHeaderName'.length);
    });

    it('should handle null and undefined values', () => {
      const dataWithNulls = [
        { name: 'John', age: null, email: undefined },
        { name: 'Jane', age: 25, email: 'jane@test.com' }
      ];

      service.exportToExcel(dataWithNulls, 'test');

      expect(writeFileSpy).toHaveBeenCalled();
      // Should not throw error
      expect(true).toBe(true);
    });
  });
});

