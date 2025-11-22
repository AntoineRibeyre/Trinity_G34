import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingEditPassword } from './setting-edit-password';

describe('SettingEditPassword', () => {
  let component: SettingEditPassword;
  let fixture: ComponentFixture<SettingEditPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingEditPassword]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingEditPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
