import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateTeamDialog } from './create-team-dialog';

describe('CreateTeamDialog', () => {
  let component: CreateTeamDialog;
  let fixture: ComponentFixture<CreateTeamDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateTeamDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateTeamDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
