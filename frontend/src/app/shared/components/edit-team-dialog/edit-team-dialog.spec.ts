import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTeamDialog } from './edit-team-dialog';

describe('EditTeamDialog', () => {
  let component: EditTeamDialog;
  let fixture: ComponentFixture<EditTeamDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTeamDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditTeamDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
