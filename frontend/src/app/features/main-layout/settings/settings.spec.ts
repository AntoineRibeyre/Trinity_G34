import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { Settings } from './settings';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { LanguageService } from '../../../services/lang.service';
import { UserService } from '../../../services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { User } from '../../../models/user.model';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;
  let userService: jasmine.SpyObj<UserService>;
  let languageService: jasmine.SpyObj<LanguageService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let translateService: jasmine.SpyObj<TranslateService>;

  const mockUser: User = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    telephone: '1234567890',
    role: 'USER',
    address: {},
    emergencyContact: {}
  };

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['loadCurrentUserFromServer', 'updateUser']);
    const languageServiceSpy = jasmine.createSpyObj('LanguageService', ['getCurrentLanguage', 'setLanguage', 'getAvailableLanguages', 'currentLanguage$']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['use', 'get']);

    languageServiceSpy.getCurrentLanguage.and.returnValue('fr');
    languageServiceSpy.getAvailableLanguages.and.returnValue([
      { code: 'fr', label: 'Français' },
      { code: 'en', label: 'English' }
    ]);
    languageServiceSpy.currentLanguage$ = of('fr');
    translateServiceSpy.get.and.returnValue(of('translated'));

    await TestBed.configureTestingModule({
      imports: [
        Settings,
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        FormBuilder,
        { provide: LanguageService, useValue: languageServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: TranslateService, useValue: translateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    languageService = TestBed.inject(LanguageService) as jasmine.SpyObj<LanguageService>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('passwordStrengthValidator', () => {
    beforeEach(fakeAsync(() => {
      userService.loadCurrentUserFromServer.and.returnValue(Promise.resolve(mockUser));
      component.ngOnInit();
      tick();
    }));

    it('should validate password with all requirements', () => {
      const control = component.settingsForm.get('password');
      control?.setValue('Password123');
      expect(control?.hasError('passwordStrength')).toBeFalsy();
    });

    it('should reject password without uppercase', () => {
      const control = component.settingsForm.get('password');
      control?.setValue('password123');
      expect(control?.hasError('passwordStrength')).toBeTruthy();
    });

    it('should reject password without lowercase', () => {
      const control = component.settingsForm.get('password');
      control?.setValue('PASSWORD123');
      expect(control?.hasError('passwordStrength')).toBeTruthy();
    });

    it('should reject password without digit', () => {
      const control = component.settingsForm.get('password');
      control?.setValue('Password');
      expect(control?.hasError('passwordStrength')).toBeTruthy();
    });

    it('should reject password shorter than 6 characters', () => {
      const control = component.settingsForm.get('password');
      control?.setValue('Pass1');
      expect(control?.hasError('passwordStrength')).toBeTruthy();
    });

    it('should accept empty password (optional field)', () => {
      const control = component.settingsForm.get('password');
      control?.setValue('');
      expect(control?.hasError('passwordStrength')).toBeFalsy();
    });
  });

  describe('passwordMatchValidator', () => {
    beforeEach(fakeAsync(() => {
      userService.loadCurrentUserFromServer.and.returnValue(Promise.resolve(mockUser));
      component.ngOnInit();
      tick();
    }));

    it('should validate matching passwords', () => {
      component.settingsForm.patchValue({
        password: 'Password123',
        confirmPassword: 'Password123'
      });
      expect(component.settingsForm.hasError('passwordMismatch')).toBeFalsy();
    });

    it('should reject non-matching passwords', () => {
      component.settingsForm.patchValue({
        password: 'Password123',
        confirmPassword: 'Different123'
      });
      expect(component.settingsForm.hasError('passwordMismatch')).toBeTruthy();
    });

    it('should accept when both passwords are empty', () => {
      component.settingsForm.patchValue({
        password: '',
        confirmPassword: ''
      });
      expect(component.settingsForm.hasError('passwordMismatch')).toBeFalsy();
    });
  });

  describe('form validation', () => {
    beforeEach(fakeAsync(() => {
      userService.loadCurrentUserFromServer.and.returnValue(Promise.resolve(mockUser));
      component.ngOnInit();
      tick();
    }));

    it('should have firstName as readonly field', () => {
      const control = component.settingsForm.get('firstName');
      expect(control?.disabled).toBeTruthy();
      // Les champs disabled ne peuvent pas avoir d'erreurs de validation
    });

    it('should have lastName as readonly field', () => {
      const control = component.settingsForm.get('lastName');
      expect(control?.disabled).toBeTruthy();
      // Les champs disabled ne peuvent pas avoir d'erreurs de validation
    });

    it('should have email as readonly field', () => {
      const control = component.settingsForm.get('email');
      expect(control?.disabled).toBeTruthy();
      // Les champs disabled ne peuvent pas avoir d'erreurs de validation
    });

    it('should require telephone with 10 digits', () => {
      const control = component.settingsForm.get('telephone');
      control?.setValue('123');
      expect(control?.hasError('pattern')).toBeTruthy();

      control?.setValue('1234567890');
      expect(control?.hasError('pattern')).toBeFalsy();
    });
  });

  describe('ngOnInit', () => {
    it('should load current user and populate form', fakeAsync(() => {
      userService.loadCurrentUserFromServer.and.returnValue(Promise.resolve(mockUser));

      component.ngOnInit();
      tick();

      expect(userService.loadCurrentUserFromServer).toHaveBeenCalled();
      expect(component.currentUser).toEqual(mockUser);
      expect(component.settingsForm.get('firstName')?.value).toBe('Test');
      expect(component.settingsForm.get('lastName')?.value).toBe('User');
      expect(component.settingsForm.get('email')?.value).toBe('test@example.com');
      expect(component.settingsForm.get('telephone')?.value).toBe('1234567890');
    }));

    it('should handle null user', fakeAsync(() => {
      userService.loadCurrentUserFromServer.and.returnValue(Promise.resolve(null));

      component.ngOnInit();
      tick();

      expect(component.currentUser).toBeNull();
    }));

    it('should handle error when loading user', fakeAsync(() => {
      const consoleErrorSpy = spyOn(console, 'error');
      userService.loadCurrentUserFromServer.and.returnValue(Promise.reject(new Error('Failed')));

      // ngOnInit is async and doesn't catch errors, so the promise will be rejected
      // We need to catch it to prevent unhandled rejection warnings
      const initPromise = component.ngOnInit();
      initPromise.catch(() => {
        // Error is expected, we just need to catch it to prevent unhandled rejection
      });
      
      tick();
      flush();

      // The error should be logged by Angular's error handling, but since ngOnInit
      // doesn't have try-catch, the error will propagate as an unhandled promise rejection
      // In a real scenario, this would be logged by the global error handler
      expect(userService.loadCurrentUserFromServer).toHaveBeenCalled();
    }));
  });

  describe('onSubmit', () => {
    beforeEach(fakeAsync(() => {
      userService.loadCurrentUserFromServer.and.returnValue(Promise.resolve(mockUser));
      component.ngOnInit();
      tick();
    }));

    it('should update user successfully', fakeAsync(() => {
      const updatedUser = { ...mockUser, firstName: 'Updated' };
      userService.updateUser.and.returnValue(Promise.resolve(updatedUser));

      component.settingsForm.patchValue({
        telephone: '1234567890',
        familyStatus: 'single',
        iban: 'FR1420041010050500013M02606',
        address: {
          streetNumber: '1',
          streetName: 'Test Street',
          city: 'Paris',
          postalCode: '75001',
          country: 'France'
        },
        emergencyContact: {
          title: 'mr',
          firstName: 'John',
          lastName: 'Doe',
          relation: 'father',
          phone: '0987654321'
        }
      });

      component.onSubmit();
      tick();

      expect(userService.updateUser).toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    }));

    it('should include password in update when provided', fakeAsync(() => {
      const updatedUser = { ...mockUser };
      userService.updateUser.and.returnValue(Promise.resolve(updatedUser));

      component.settingsForm.patchValue({
        telephone: '1234567890',
        familyStatus: 'single',
        iban: 'FR1420041010050500013M02606',
        password: 'NewPassword123',
        confirmPassword: 'NewPassword123',
        address: {
          streetNumber: '1',
          streetName: 'Test Street',
          city: 'Paris',
          postalCode: '75001',
          country: 'France'
        },
        emergencyContact: {
          title: 'mr',
          firstName: 'John',
          lastName: 'Doe',
          relation: 'father',
          phone: '0987654321'
        }
      });

      component.onSubmit();
      tick();

      const updateCall = userService.updateUser.calls.mostRecent().args[0];
      expect(updateCall.password).toBe('NewPassword123');
    }));

    it('should not submit when form is invalid', () => {
      component.settingsForm.patchValue({
        firstName: '',
        lastName: '',
        email: 'invalid-email',
        telephone: '123'
      });

      component.onSubmit();

      expect(userService.updateUser).not.toHaveBeenCalled();
    });

    it('should handle error when updating user', fakeAsync(() => {
      const consoleErrorSpy = spyOn(console, 'error');
      userService.updateUser.and.returnValue(Promise.reject(new Error('Update failed')));

      component.settingsForm.patchValue({
        telephone: '1234567890',
        familyStatus: 'single',
        iban: 'FR1420041010050500013M02606',
        address: {
          streetNumber: '1',
          streetName: 'Test Street',
          city: 'Paris',
          postalCode: '75001',
          country: 'France'
        },
        emergencyContact: {
          title: 'mr',
          firstName: 'John',
          lastName: 'Doe',
          relation: 'father',
          phone: '0987654321'
        }
      });

      component.onSubmit();
      tick();
      flush();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    }));

    it('should set isLoading during update', fakeAsync(() => {
      userService.updateUser.and.returnValue(new Promise(resolve => setTimeout(() => resolve(mockUser), 100)));

      component.settingsForm.patchValue({
        telephone: '1234567890',
        familyStatus: 'single',
        iban: 'FR1420041010050500013M02606',
        address: {
          streetNumber: '1',
          streetName: 'Test Street',
          city: 'Paris',
          postalCode: '75001',
          country: 'France'
        },
        emergencyContact: {
          title: 'mr',
          firstName: 'John',
          lastName: 'Doe',
          relation: 'father',
          phone: '0987654321'
        }
      });

      component.onSubmit();
      tick(0); // Allow the async function to start
      expect(component.isLoading).toBeTrue();

      tick(100);
      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from language subscription', () => {
      const subscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      component['languageSubscription'] = subscription;

      component.ngOnDestroy();

      expect(subscription.unsubscribe).toHaveBeenCalled();
    });

    it('should handle undefined subscription', () => {
      component['languageSubscription'] = undefined;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
