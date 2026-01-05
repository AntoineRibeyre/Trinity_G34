import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SnackBarComponent } from './snackbar';
import { SnackBarService, SnackBarConfig } from '../../../services/snackbar.service';
import { BehaviorSubject } from 'rxjs';

describe('SnackBarComponent', () => {
  let component: SnackBarComponent;
  let fixture: ComponentFixture<SnackBarComponent>;
  let snackBarService: SnackBarService;
  let snackBarSubject: BehaviorSubject<SnackBarConfig | null>;

  beforeEach(async () => {
    snackBarSubject = new BehaviorSubject<SnackBarConfig | null>(null);
    
    await TestBed.configureTestingModule({
      imports: [SnackBarComponent],
      providers: [SnackBarService]
    }).compileComponents();

    fixture = TestBed.createComponent(SnackBarComponent);
    component = fixture.componentInstance;
    snackBarService = TestBed.inject(SnackBarService);
    
    // Replace the snackBar$ property with our mock observable
    Object.defineProperty(snackBarService, 'snackBar$', {
      get: () => snackBarSubject.asObservable(),
      configurable: true
    });
    
    fixture.detectChanges();
  });

  afterEach(() => {
    if (component['timeoutId']) {
      clearTimeout(component['timeoutId']);
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should subscribe to snackBarService on init', () => {
      expect(component['subscription']).toBeDefined();
    });

    it('should show snackbar when config is received', () => {
      const config: SnackBarConfig = {
        message: 'Test message',
        type: 'success',
        duration: 3000
      };

      snackBarSubject.next(config);
      fixture.detectChanges();

      expect(component.config).toEqual(config);
      expect(component.isVisible).toBe(true);
    });

    it('should hide snackbar when null is received', () => {
      const config: SnackBarConfig = {
        message: 'Test message',
        type: 'success'
      };

      snackBarSubject.next(config);
      fixture.detectChanges();
      expect(component.isVisible).toBe(true);

      snackBarSubject.next(null);
      fixture.detectChanges();
      expect(component.isVisible).toBe(false);
    });
  });

  describe('show', () => {
    it('should set config and make snackbar visible', () => {
      const config: SnackBarConfig = {
        message: 'Test message',
        type: 'info'
      };

      snackBarSubject.next(config);
      fixture.detectChanges();

      expect(component.config).toEqual(config);
      expect(component.isVisible).toBe(true);
    });

    it('should set timeout for auto-close when duration is provided', fakeAsync(() => {
      const config: SnackBarConfig = {
        message: 'Test message',
        type: 'success',
        duration: 1000
      };

      snackBarSubject.next(config);
      fixture.detectChanges();

      expect(component.isVisible).toBe(true);
      expect(component['timeoutId']).toBeDefined();

      tick(1000);
      fixture.detectChanges();

      expect(component.isVisible).toBe(false);
    }));

    it('should not set timeout when duration is 0', () => {
      const config: SnackBarConfig = {
        message: 'Test message',
        type: 'warning',
        duration: 0
      };

      snackBarSubject.next(config);
      fixture.detectChanges();

      expect(component.isVisible).toBe(true);
      // Should not auto-close
    });

    it('should not set timeout when duration is not provided', () => {
      const config: SnackBarConfig = {
        message: 'Test message',
        type: 'error'
      };

      snackBarSubject.next(config);
      fixture.detectChanges();

      expect(component.isVisible).toBe(true);
    });

    it('should clear previous timeout when new config is received', fakeAsync(() => {
      const config1: SnackBarConfig = {
        message: 'First message',
        type: 'info',
        duration: 5000
      };

      const config2: SnackBarConfig = {
        message: 'Second message',
        type: 'success',
        duration: 2000
      };

      snackBarSubject.next(config1);
      fixture.detectChanges();
      const firstTimeoutId = component['timeoutId'];

      snackBarSubject.next(config2);
      fixture.detectChanges();
      const secondTimeoutId = component['timeoutId'];

      expect(secondTimeoutId).not.toBe(firstTimeoutId);
      expect(component.config?.message).toBe('Second message');

      tick(2000);
      fixture.detectChanges();

      expect(component.isVisible).toBe(false);
    }));
  });

  describe('hide', () => {
    it('should hide snackbar and clear config after delay', fakeAsync(() => {
      const config: SnackBarConfig = {
        message: 'Test message',
        type: 'info'
      };

      snackBarSubject.next(config);
      fixture.detectChanges();
      expect(component.isVisible).toBe(true);

      snackBarSubject.next(null);
      fixture.detectChanges();
      expect(component.isVisible).toBe(false);

      tick(300);
      fixture.detectChanges();

      expect(component.config).toBeNull();
    }));

    it('should not clear config if snackbar becomes visible again during delay', fakeAsync(() => {
      const config1: SnackBarConfig = {
        message: 'First message',
        type: 'info'
      };

      const config2: SnackBarConfig = {
        message: 'Second message',
        type: 'success'
      };

      snackBarSubject.next(config1);
      fixture.detectChanges();

      snackBarSubject.next(null);
      fixture.detectChanges();
      expect(component.isVisible).toBe(false);

      // Show again before delay completes
      tick(100);
      snackBarSubject.next(config2);
      fixture.detectChanges();
      expect(component.isVisible).toBe(true);

      tick(200);
      fixture.detectChanges();

      // Config should still be set because snackbar is visible again
      expect(component.config).not.toBeNull();
      expect(component.config?.message).toBe('Second message');
    }));
  });

  describe('close', () => {
    it('should call snackBarService.hide', () => {
      spyOn(snackBarService, 'hide');

      component.close();

      expect(snackBarService.hide).toHaveBeenCalled();
    });
  });

  describe('getIconClass', () => {
    it('should return icon-success for success type', () => {
      const config: SnackBarConfig = {
        message: 'Success',
        type: 'success'
      };

      snackBarSubject.next(config);
      fixture.detectChanges();

      expect(component.getIconClass()).toBe('icon-success');
    });

    it('should return icon-error for error type', () => {
      const config: SnackBarConfig = {
        message: 'Error',
        type: 'error'
      };

      snackBarSubject.next(config);
      fixture.detectChanges();

      expect(component.getIconClass()).toBe('icon-error');
    });

    it('should return icon-warning for warning type', () => {
      const config: SnackBarConfig = {
        message: 'Warning',
        type: 'warning'
      };

      snackBarSubject.next(config);
      fixture.detectChanges();

      expect(component.getIconClass()).toBe('icon-warning');
    });

    it('should return icon-info for info type', () => {
      const config: SnackBarConfig = {
        message: 'Info',
        type: 'info'
      };

      snackBarSubject.next(config);
      fixture.detectChanges();

      expect(component.getIconClass()).toBe('icon-info');
    });

    it('should return icon-info as default when type is not provided', () => {
      const config: SnackBarConfig = {
        message: 'No type'
      };

      snackBarSubject.next(config);
      fixture.detectChanges();

      expect(component.getIconClass()).toBe('icon-info');
    });

    it('should return empty string when config is null', () => {
      snackBarSubject.next(null);
      fixture.detectChanges();

      expect(component.getIconClass()).toBe('');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from snackBarService', () => {
      const subscription = component['subscription'];
      spyOn(subscription!, 'unsubscribe');

      component.ngOnDestroy();

      expect(subscription!.unsubscribe).toHaveBeenCalled();
    });

    it('should clear timeout if exists', () => {
      const config: SnackBarConfig = {
        message: 'Test',
        type: 'info',
        duration: 5000
      };

      snackBarSubject.next(config);
      fixture.detectChanges();

      const timeoutId = component['timeoutId'];
      spyOn(window, 'clearTimeout');

      component.ngOnDestroy();

      expect(window.clearTimeout).toHaveBeenCalledWith(timeoutId);
    });

    it('should not throw error if timeout does not exist', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should not throw error if subscription does not exist', () => {
      component['subscription'] = undefined;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});

