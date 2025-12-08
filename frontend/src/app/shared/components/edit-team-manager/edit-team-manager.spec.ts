import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTeamManager } from './edit-team-manager';

describe('EditTeamManager', () => {
  let component: EditTeamManager;
  let fixture: ComponentFixture<EditTeamManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTeamManager]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditTeamManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
