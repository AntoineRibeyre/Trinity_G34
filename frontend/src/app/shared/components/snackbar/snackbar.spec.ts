import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SnackBarComponent } from './snackbar';
import { SnackBarService } from '../../../services/snackbar.service';
import { BehaviorSubject } from 'rxjs';

describe('SnackBarComponent', () => {
  let component: SnackBarComponent;
  let fixture: ComponentFixture<SnackBarComponent>;
  let snackBarService: SnackBarService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnackBarComponent],
      providers: [SnackBarService]
    }).compileComponents();

    fixture = TestBed.createComponent(SnackBarComponent);
    component = fixture.componentInstance;
    snackBarService = TestBed.inject(SnackBarService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

