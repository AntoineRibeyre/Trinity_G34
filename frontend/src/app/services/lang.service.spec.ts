import { TestBed } from '@angular/core/testing';
import { LanguageService } from './lang.service';
import { TranslateService } from '@ngx-translate/core';
import { PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';

describe('LanguageService', () => {
  let service: LanguageService;
  let translateService: jasmine.SpyObj<TranslateService>;
  let localStorageSpy: jasmine.Spy;
  let localStorageGetItemSpy: jasmine.Spy;
  let localStorageSetItemSpy: jasmine.Spy;
  let getBrowserLangSpy: jasmine.Spy;

  const mockStore: { [key: string]: string } = {};

  beforeEach(() => {
    // Mock localStorage
    mockStore['selectedLanguage'] = '';
    localStorageGetItemSpy = spyOn(Storage.prototype, 'getItem').and.callFake((key: string) => {
      return mockStore[key] || null;
    });
    localStorageSetItemSpy = spyOn(Storage.prototype, 'setItem').and.callFake((key: string, value: string) => {
      mockStore[key] = value;
    });
    localStorageSpy = localStorageGetItemSpy;

    // Mock TranslateService
    const translateSpy = jasmine.createSpyObj('TranslateService', [
      'addLangs',
      'setDefaultLang',
      'use',
      'getBrowserLang'
    ]);

    getBrowserLangSpy = translateSpy.getBrowserLang.and.returnValue(null); // Return null to use default
    translateSpy.use.and.returnValue(of(''));
    translateService = translateSpy;

    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: TranslateService, useValue: translateService },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(LanguageService);
  });

  afterEach(() => {
    // Clear mock store
    Object.keys(mockStore).forEach(key => delete mockStore[key]);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with default language when no saved language', () => {
      localStorageGetItemSpy.and.returnValue(null);
      getBrowserLangSpy.and.returnValue(null);

      const newService = new LanguageService(translateService, 'browser');
      
      expect(translateService.addLangs).toHaveBeenCalledWith(['fr', 'en']);
      expect(translateService.setDefaultLang).toHaveBeenCalledWith('fr');
      expect(translateService.use).toHaveBeenCalledWith('fr');
    });

    it('should initialize with saved language from localStorage', () => {
      mockStore['selectedLanguage'] = 'en';
      localStorageGetItemSpy.and.returnValue('en');

      const newService = new LanguageService(translateService, 'browser');
      
      expect(translateService.use).toHaveBeenCalledWith('en');
    });

    it('should use browser language when no saved language and browser language is valid', () => {
      localStorageGetItemSpy.and.returnValue(null);
      getBrowserLangSpy.and.returnValue('en');

      const newService = new LanguageService(translateService, 'browser');
      
      expect(translateService.use).toHaveBeenCalledWith('en');
    });

    it('should fallback to default language when browser language is invalid', () => {
      localStorageGetItemSpy.and.returnValue(null);
      getBrowserLangSpy.and.returnValue('es'); // Invalid language

      const newService = new LanguageService(translateService, 'browser');
      
      expect(translateService.use).toHaveBeenCalledWith('fr');
    });

    it('should prioritize saved language over browser language', () => {
      mockStore['selectedLanguage'] = 'en';
      localStorageGetItemSpy.and.returnValue('en');
      getBrowserLangSpy.and.returnValue('fr');

      const newService = new LanguageService(translateService, 'browser');
      
      expect(translateService.use).toHaveBeenCalledWith('en');
    });

    it('should not access localStorage on server platform', () => {
      // Reset the spy before creating the service
      localStorageGetItemSpy.calls.reset();
      const serverService = new LanguageService(translateService, 'server');
      
      expect(localStorageGetItemSpy).not.toHaveBeenCalled();
    });
  });

  describe('setLanguage', () => {
    it('should set valid language and save to localStorage', () => {
      service.setLanguage('en');

      expect(translateService.use).toHaveBeenCalledWith('en');
      expect(localStorageSetItemSpy).toHaveBeenCalledWith('selectedLanguage', 'en');
      
      let currentLang = '';
      service.currentLanguage$.subscribe(lang => {
        currentLang = lang;
      });
      expect(currentLang).toBe('en');
    });

    it('should set French language correctly', () => {
      service.setLanguage('fr');

      expect(translateService.use).toHaveBeenCalledWith('fr');
      expect(localStorageSetItemSpy).toHaveBeenCalledWith('selectedLanguage', 'fr');
    });

    it('should fallback to default language when invalid language is provided', () => {
      const consoleWarnSpy = spyOn(console, 'warn');
      
      service.setLanguage('invalid');

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(translateService.use).toHaveBeenCalledWith('fr');
      expect(localStorageSetItemSpy).toHaveBeenCalledWith('selectedLanguage', 'fr');
    });

    it('should not save to localStorage on server platform', () => {
      // Reset the spy before creating the service
      localStorageSetItemSpy.calls.reset();
      const serverService = new LanguageService(translateService, 'server');
      
      serverService.setLanguage('en');

      expect(translateService.use).toHaveBeenCalledWith('en');
      expect(localStorageSetItemSpy).not.toHaveBeenCalled();
    });

    it('should emit new language value to subscribers', (done) => {
      let emissionCount = 0;
      service.currentLanguage$.subscribe(lang => {
        emissionCount++;
        if (emissionCount === 1) {
          // Initial emission
          expect(lang).toBeDefined();
        } else if (emissionCount === 2 && lang === 'en') {
          // Updated emission
          done();
        }
      });

      service.setLanguage('en');
    });
  });

  describe('getCurrentLanguage', () => {
    it('should return current language', () => {
      service.setLanguage('en');
      expect(service.getCurrentLanguage()).toBe('en');
    });

    it('should return current language initially', () => {
      // The service initializes with the browser language or default
      const currentLang = service.getCurrentLanguage();
      expect(['fr', 'en']).toContain(currentLang);
    });

    it('should return updated language after change', () => {
      service.setLanguage('fr');
      expect(service.getCurrentLanguage()).toBe('fr');
      
      service.setLanguage('en');
      expect(service.getCurrentLanguage()).toBe('en');
    });
  });

  describe('getAvailableLanguages', () => {
    it('should return available languages with labels', () => {
      const languages = service.getAvailableLanguages();

      expect(languages.length).toBe(2);
      expect(languages).toContain({ code: 'fr', label: 'Français' });
      expect(languages).toContain({ code: 'en', label: 'English' });
    });

    it('should return correct language codes', () => {
      const languages = service.getAvailableLanguages();

      const codes = languages.map(lang => lang.code);
      expect(codes).toContain('fr');
      expect(codes).toContain('en');
    });

    it('should return correct language labels', () => {
      const languages = service.getAvailableLanguages();

      const frLang = languages.find(lang => lang.code === 'fr');
      const enLang = languages.find(lang => lang.code === 'en');

      expect(frLang?.label).toBe('Français');
      expect(enLang?.label).toBe('English');
    });
  });

  describe('currentLanguage$ observable', () => {
    it('should emit initial language value to new subscribers', (done) => {
      service.currentLanguage$.subscribe(lang => {
        // The service initializes with browser lang or default
        expect(['fr', 'en']).toContain(lang);
        done();
      });
    });

    it('should emit updated language values', (done) => {
      let emissionCount = 0;
      
      service.currentLanguage$.subscribe(lang => {
        emissionCount++;
        if (emissionCount === 1) {
          // Initial emission
          expect(['fr', 'en']).toContain(lang);
          service.setLanguage('en');
        } else if (emissionCount === 2) {
          expect(lang).toBe('en'); // Updated
          done();
        }
      });
    });

    it('should emit to all subscribers when language changes', (done) => {
      let subscriber1Lang = '';
      let subscriber2Lang = '';
      
      service.currentLanguage$.subscribe(lang => {
        subscriber1Lang = lang;
      });
      
      service.currentLanguage$.subscribe(lang => {
        subscriber2Lang = lang;
      });
      
      service.setLanguage('en');
      
      setTimeout(() => {
        expect(subscriber1Lang).toBe('en');
        expect(subscriber2Lang).toBe('en');
        done();
      }, 10);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string as invalid language', () => {
      const consoleWarnSpy = spyOn(console, 'warn');
      
      service.setLanguage('');

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(translateService.use).toHaveBeenCalledWith('fr');
    });

    it('should handle null saved language gracefully', () => {
      localStorageGetItemSpy.and.returnValue(null);
      getBrowserLangSpy.and.returnValue(null);

      expect(() => {
        new LanguageService(translateService, 'browser');
      }).not.toThrow();
    });

    it('should handle case sensitivity for language codes', () => {
      const consoleWarnSpy = spyOn(console, 'warn');
      
      service.setLanguage('FR'); // Uppercase
      
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(translateService.use).toHaveBeenCalledWith('fr');
    });

    it('should handle multiple rapid language changes', () => {
      // Reset the spy to only count calls from this test
      translateService.use.calls.reset();
      
      service.setLanguage('fr');
      service.setLanguage('en');
      service.setLanguage('fr');
      service.setLanguage('en');

      expect(translateService.use).toHaveBeenCalledTimes(4);
      expect(service.getCurrentLanguage()).toBe('en');
    });
  });

  describe('platform-specific behavior', () => {
    it('should work correctly in browser platform', () => {
      const browserService = new LanguageService(translateService, 'browser');
      
      browserService.setLanguage('en');
      
      expect(localStorageSetItemSpy).toHaveBeenCalled();
    });

    it('should work correctly in server platform', () => {
      // Reset the spy before creating the service
      localStorageSetItemSpy.calls.reset();
      const serverService = new LanguageService(translateService, 'server');
      
      serverService.setLanguage('en');
      
      expect(translateService.use).toHaveBeenCalledWith('en');
      // localStorage should not be called on server
      expect(localStorageSetItemSpy).not.toHaveBeenCalled();
    });
  });
});

