import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportPeriodDialog } from './export-period-dialog';

describe('ExportPeriodDialog', () => {
  let component: ExportPeriodDialog;
  let fixture: ComponentFixture<ExportPeriodDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportPeriodDialog]
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

