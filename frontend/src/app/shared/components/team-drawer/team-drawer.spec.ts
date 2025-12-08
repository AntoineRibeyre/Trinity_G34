import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamDrawer } from './team-drawer';

describe('TeamDrawer', () => {
  let component: TeamDrawer;
  let fixture: ComponentFixture<TeamDrawer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamDrawer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamDrawer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
