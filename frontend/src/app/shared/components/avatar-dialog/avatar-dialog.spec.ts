import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvatarDailog } from './avatar-dialog';

describe('AvatarDailog', () => {
  let component: AvatarDailog;
  let fixture: ComponentFixture<AvatarDailog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarDailog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvatarDailog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
