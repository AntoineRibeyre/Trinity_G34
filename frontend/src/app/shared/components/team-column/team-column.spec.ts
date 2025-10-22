import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamColumn } from './team-column';

describe('TeamColumn', () => {
  let component: TeamColumn;
  let fixture: ComponentFixture<TeamColumn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamColumn]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamColumn);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
