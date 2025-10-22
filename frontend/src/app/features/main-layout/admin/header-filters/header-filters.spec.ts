import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderFilters } from './header-filters';

describe('HeaderFilters', () => {
  let component: HeaderFilters;
  let fixture: ComponentFixture<HeaderFilters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderFilters]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderFilters);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
