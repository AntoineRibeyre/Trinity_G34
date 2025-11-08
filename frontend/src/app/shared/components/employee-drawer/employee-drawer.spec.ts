import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeDrawer } from './employee-drawer';

describe('EmployeeDrawer', () => {
  let component: EmployeeDrawer;
  let fixture: ComponentFixture<EmployeeDrawer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeDrawer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeDrawer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
