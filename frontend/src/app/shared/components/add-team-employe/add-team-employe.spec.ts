import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTeamEmploye } from './add-team-employe';

describe('AddTeamEmploye', () => {
  let component: AddTeamEmploye;
  let fixture: ComponentFixture<AddTeamEmploye>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTeamEmploye]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTeamEmploye);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
