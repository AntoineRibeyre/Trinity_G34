import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicDropdown } from './basic-dropdown';

describe('BasicDropdown', () => {
  let component: BasicDropdown;
  let fixture: ComponentFixture<BasicDropdown>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicDropdown]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BasicDropdown);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
