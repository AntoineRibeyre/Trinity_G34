import { TestBed } from '@angular/core/testing';
import { SnackBarService, SnackBarConfig, SnackBarType } from './snackbar.service';

describe('SnackBarService', () => {
  let service: SnackBarService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SnackBarService]
    });
    service = TestBed.inject(SnackBarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('showSuccess', () => {
    it('should display success notification with default duration', (done) => {
      const message = 'Operation successful';
      
      service.snackBar$.subscribe(config => {
        if (config) {
          expect(config.message).toBe(message);
          expect(config.type).toBe('success');
          expect(config.duration).toBe(3000);
          done();
        }
      });

      service.showSuccess(message);
    });

    it('should display success notification with custom duration', (done) => {
      const message = 'Operation successful';
      const customDuration = 5000;
      
      service.snackBar$.subscribe(config => {
        if (config) {
          expect(config.message).toBe(message);
          expect(config.type).toBe('success');
          expect(config.duration).toBe(customDuration);
          done();
        }
      });

      service.showSuccess(message, customDuration);
    });
  });

  describe('showError', () => {
    it('should display error notification with default duration', (done) => {
      const message = 'An error occurred';
      
      service.snackBar$.subscribe(config => {
        if (config) {
          expect(config.message).toBe(message);
          expect(config.type).toBe('error');
          expect(config.duration).toBe(4000);
          done();
        }
      });

      service.showError(message);
    });

    it('should display error notification with custom duration', (done) => {
      const message = 'An error occurred';
      const customDuration = 6000;
      
      service.snackBar$.subscribe(config => {
        if (config) {
          expect(config.message).toBe(message);
          expect(config.type).toBe('error');
          expect(config.duration).toBe(customDuration);
          done();
        }
      });

      service.showError(message, customDuration);
    });
  });

  describe('showWarning', () => {
    it('should display warning notification with default duration', (done) => {
      const message = 'Warning message';
      
      service.snackBar$.subscribe(config => {
        if (config) {
          expect(config.message).toBe(message);
          expect(config.type).toBe('warning');
          expect(config.duration).toBe(3000);
          done();
        }
      });

      service.showWarning(message);
    });

    it('should display warning notification with custom duration', (done) => {
      const message = 'Warning message';
      const customDuration = 2000;
      
      service.snackBar$.subscribe(config => {
        if (config) {
          expect(config.message).toBe(message);
          expect(config.type).toBe('warning');
          expect(config.duration).toBe(customDuration);
          done();
        }
      });

      service.showWarning(message, customDuration);
    });
  });

  describe('showInfo', () => {
    it('should display info notification with default duration', (done) => {
      const message = 'Information message';
      
      service.snackBar$.subscribe(config => {
        if (config) {
          expect(config.message).toBe(message);
          expect(config.type).toBe('info');
          expect(config.duration).toBe(3000);
          done();
        }
      });

      service.showInfo(message);
    });

    it('should display info notification with custom duration', (done) => {
      const message = 'Information message';
      const customDuration = 1000;
      
      service.snackBar$.subscribe(config => {
        if (config) {
          expect(config.message).toBe(message);
          expect(config.type).toBe('info');
          expect(config.duration).toBe(customDuration);
          done();
        }
      });

      service.showInfo(message, customDuration);
    });
  });

  describe('show', () => {
    it('should display custom notification with all properties', (done) => {
      const config: SnackBarConfig = {
        message: 'Custom message',
        type: 'success',
        duration: 5000
      };
      
      service.snackBar$.subscribe(snackConfig => {
        if (snackConfig) {
          expect(snackConfig.message).toBe(config.message);
          expect(snackConfig.type).toBe(config.type);
          expect(snackConfig.duration).toBe(config.duration);
          done();
        }
      });

      service.show(config);
    });

    it('should display notification without type (optional)', (done) => {
      const config: SnackBarConfig = {
        message: 'Message without type',
        duration: 2000
      };
      
      service.snackBar$.subscribe(snackConfig => {
        if (snackConfig) {
          expect(snackConfig.message).toBe(config.message);
          expect(snackConfig.type).toBeUndefined();
          expect(snackConfig.duration).toBe(config.duration);
          done();
        }
      });

      service.show(config);
    });

    it('should display notification without duration (optional)', (done) => {
      const config: SnackBarConfig = {
        message: 'Message without duration',
        type: 'info'
      };
      
      service.snackBar$.subscribe(snackConfig => {
        if (snackConfig) {
          expect(snackConfig.message).toBe(config.message);
          expect(snackConfig.type).toBe(config.type);
          expect(snackConfig.duration).toBeUndefined();
          done();
        }
      });

      service.show(config);
    });

    it('should display notification with duration 0 (no auto-close)', (done) => {
      const config: SnackBarConfig = {
        message: 'Persistent message',
        type: 'warning',
        duration: 0
      };
      
      service.snackBar$.subscribe(snackConfig => {
        if (snackConfig) {
          expect(snackConfig.message).toBe(config.message);
          expect(snackConfig.duration).toBe(0);
          done();
        }
      });

      service.show(config);
    });

    it('should handle all notification types', (done) => {
      const types: SnackBarType[] = ['success', 'error', 'warning', 'info'];
      let typeIndex = 0;
      
      service.snackBar$.subscribe(snackConfig => {
        if (snackConfig && snackConfig.type) {
          expect(snackConfig.type).toBe(types[typeIndex]);
          typeIndex++;
          
          if (typeIndex < types.length) {
            service.show({ message: 'Test', type: types[typeIndex] });
          } else {
            done();
          }
        }
      });

      service.show({ message: 'Test', type: types[0] });
    });
  });

  describe('hide', () => {
    it('should hide notification by emitting null', (done) => {
      // First show a notification
      service.showSuccess('Test message');
      
      // Then hide it
      let emissionCount = 0;
      service.snackBar$.subscribe(config => {
        emissionCount++;
        if (emissionCount === 1) {
          // First emission: the notification
          expect(config).not.toBeNull();
          service.hide();
        } else if (emissionCount === 2) {
          // Second emission: null (hidden)
          expect(config).toBeNull();
          done();
        }
      });
    });

    it('should hide notification even when no notification is shown', () => {
      let emissionCount = 0;
      service.snackBar$.subscribe(config => {
        emissionCount++;
        if (emissionCount === 1) {
          // Initial emission (null)
          expect(config).toBeNull();
        } else if (emissionCount === 2) {
          // After hide() call
          expect(config).toBeNull();
        }
      });

      service.hide();
      
      // Wait a bit to ensure the emission happens
      setTimeout(() => {
        expect(emissionCount).toBeGreaterThanOrEqual(1);
      }, 10);
    });
  });

  describe('snackBar$ observable', () => {
    it('should emit initial null value to new subscribers', (done) => {
      service.snackBar$.subscribe(config => {
        expect(config).toBeNull();
        done();
      });
    });

    it('should emit multiple notifications sequentially', (done) => {
      const messages: string[] = [];
      let emissionCount = 0;
      
      service.snackBar$.subscribe(config => {
        emissionCount++;
        if (config) {
          messages.push(config.message);
        }
        
        if (emissionCount === 1) {
          service.showSuccess('First');
        } else if (emissionCount === 2) {
          service.showError('Second');
        } else if (emissionCount === 3) {
          service.showWarning('Third');
        } else if (emissionCount === 4) {
          expect(messages).toEqual(['First', 'Second', 'Third']);
          done();
        }
      });
    });

    it('should emit to all subscribers when notification is shown', (done) => {
      let subscriber1Count = 0;
      let subscriber2Count = 0;
      
      service.snackBar$.subscribe(() => subscriber1Count++);
      service.snackBar$.subscribe(() => subscriber2Count++);
      
      service.showSuccess('Test');
      
      setTimeout(() => {
        expect(subscriber1Count).toBeGreaterThan(0);
        expect(subscriber2Count).toBeGreaterThan(0);
        done();
      }, 10);
    });
  });
});

