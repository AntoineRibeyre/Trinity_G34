import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TranslateService } from '@ngx-translate/core';
import { DateUtilsService } from '../../../services/date-utils.service';

import { ExportPeriodDialog } from './export-period-dialog';

describe('ExportPeriodDialog', () => {
  let component: ExportPeriodDialog;
  let fixture: ComponentFixture<ExportPeriodDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ExportPeriodDialog>>;
  let translateServiceSpy: jasmine.SpyObj<TranslateService>;
  let dateUtilsServiceSpy: jasmine.SpyObj<DateUtilsService>;

  const mockDialogData = {
    title: 'Test Title',
    confirm: 'Confirm',
    cancel: 'Cancel',
    onConfirm: jasmine.createSpy('onConfirm'),
    onCancel: jasmine.createSpy('onCancel')
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);
    translateServiceSpy.instant.and.returnValue('Mocked Translation');
    dateUtilsServiceSpy = jasmine.createSpyObj('DateUtilsService', ['formatDateForInput']);
    dateUtilsServiceSpy.formatDateForInput.and.returnValue('2024-01-01');

    await TestBed.configureTestingModule({
      imports: [ExportPeriodDialog],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: DIALOG_DATA, useValue: mockDialogData },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: DateUtilsService, useValue: dateUtilsServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportPeriodDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

