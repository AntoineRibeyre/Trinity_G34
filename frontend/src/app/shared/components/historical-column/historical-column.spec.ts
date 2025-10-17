import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoricalColumn } from './historical-column';

describe('HistoricalColumn', () => {
  let component: HistoricalColumn;
  let fixture: ComponentFixture<HistoricalColumn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoricalColumn]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoricalColumn);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
