import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar';

describe('AvatarComponent', () => {
  let component: AvatarComponent;
  let fixture: ComponentFixture<AvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initials', () => {
    it('should return uppercase initials from firstName and lastName', () => {
      component.firstName = 'John';
      component.lastName = 'Doe';
      fixture.detectChanges();

      expect(component.initials).toBe('JD');
    });

    it('should return single initial when only firstName is provided', () => {
      component.firstName = 'John';
      component.lastName = '';
      fixture.detectChanges();

      expect(component.initials).toBe('J');
    });

    it('should return single initial when only lastName is provided', () => {
      component.firstName = '';
      component.lastName = 'Doe';
      fixture.detectChanges();

      expect(component.initials).toBe('D');
    });

    it('should return empty string when both names are empty', () => {
      component.firstName = '';
      component.lastName = '';
      fixture.detectChanges();

      expect(component.initials).toBe('');
    });

    it('should return empty string when both names are undefined', () => {
      component.firstName = undefined as any;
      component.lastName = undefined as any;
      fixture.detectChanges();

      expect(component.initials).toBe('');
    });

    it('should handle names with multiple words correctly', () => {
      component.firstName = 'Jean-Pierre';
      component.lastName = 'Dupont-Martin';
      fixture.detectChanges();

      expect(component.initials).toBe('JD');
    });

    it('should handle lowercase names and convert to uppercase', () => {
      component.firstName = 'john';
      component.lastName = 'doe';
      fixture.detectChanges();

      expect(component.initials).toBe('JD');
    });

    it('should handle special characters in names', () => {
      component.firstName = 'José';
      component.lastName = 'García';
      fixture.detectChanges();

      expect(component.initials).toBe('JG');
    });

    it('should handle null values gracefully', () => {
      component.firstName = null as any;
      component.lastName = null as any;
      fixture.detectChanges();

      expect(component.initials).toBe('');
    });
  });

  describe('Input properties', () => {
    it('should have default empty string values', () => {
      expect(component.firstName).toBe('');
      expect(component.lastName).toBe('');
    });

    it('should accept and store firstName input', () => {
      component.firstName = 'Test';
      fixture.detectChanges();

      expect(component.firstName).toBe('Test');
    });

    it('should accept and store lastName input', () => {
      component.lastName = 'User';
      fixture.detectChanges();

      expect(component.lastName).toBe('User');
    });
  });
});

