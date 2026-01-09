import { TestBed } from '@angular/core/testing';
import { FilterService, Filter } from './filter.service';
import { TranslateService } from '@ngx-translate/core';

describe('FilterService', () => {
  let service: FilterService;
  let localStorageSpy: jasmine.Spy<(key: string) => string | null>;
  let localStorageSetItemSpy: jasmine.Spy;
  let localStorageRemoveItemSpy: jasmine.Spy;
  let translateServiceSpy: jasmine.SpyObj<TranslateService>;

  const mockFilter: Filter = {
    label: 'Test Filter',
    route: 'admin/test',
    value: 'test'
  };

  beforeEach(() => {
    // Mock TranslateService
    translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);
    translateServiceSpy.instant.and.returnValue('Mocked Translation');

    // Mock localStorage
    const store: { [key: string]: string } = {};
    localStorageSpy = spyOn(Storage.prototype, 'getItem').and.callFake((key: string) => {
      return store[key] || null;
    });
    localStorageSetItemSpy = spyOn(Storage.prototype, 'setItem').and.callFake((key: string, value: string) => {
      store[key] = value;
    });
    localStorageRemoveItemSpy = spyOn(Storage.prototype, 'removeItem').and.callFake((key: string) => {
      delete store[key];
    });

    TestBed.configureTestingModule({
      providers: [
        FilterService,
        { provide: TranslateService, useValue: translateServiceSpy }
      ]
    });

    service = TestBed.inject(FilterService);
  });

  afterEach(() => {
    // Clear localStorage mock
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with null filter when no saved filter exists', () => {
      localStorageSpy.and.returnValue(null);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          FilterService,
          { provide: TranslateService, useValue: translateServiceSpy }
        ]
      });
      const newService = TestBed.inject(FilterService);
      let currentFilter: Filter | null = null;

      newService.selectedFilter$.subscribe(filter => {
        currentFilter = filter;
      });

      expect(currentFilter).toBeNull();
    });

    it('should initialize with saved filter from localStorage', (done) => {
      const savedFilter = JSON.stringify(mockFilter);
      localStorageSpy.and.returnValue(savedFilter);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          FilterService,
          { provide: TranslateService, useValue: translateServiceSpy }
        ]
      });
      const newService = TestBed.inject(FilterService);
      let currentFilter: Filter | null = null;

      newService.selectedFilter$.subscribe(filter => {
        currentFilter = filter;
        expect(currentFilter).toEqual(mockFilter);
        expect(localStorageSpy).toHaveBeenCalledWith('selectedFilter');
        done();
      });
    });

    it('should handle invalid JSON in localStorage gracefully', () => {
      localStorageSpy.and.returnValue('invalid json');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          FilterService,
          { provide: TranslateService, useValue: translateServiceSpy }
        ]
      });

      expect(() => {
        TestBed.inject(FilterService);
      }).toThrow();
    });
  });

  describe('setSelectedFilter', () => {
    it('should set filter and save to localStorage', () => {
      let emittedFilter: Filter | null = null;

      service.selectedFilter$.subscribe(filter => {
        emittedFilter = filter;
      });

      // setSelectedFilter appelle localStorage.setItem de manière synchrone
      service.setSelectedFilter(mockFilter);

      // Vérifier immédiatement après l'appel (synchrone)
      expect(localStorageSetItemSpy).toHaveBeenCalledWith(
        'selectedFilter',
        JSON.stringify(mockFilter)
      );
      expect(emittedFilter).not.toBeNull();
      expect(emittedFilter as unknown as Filter).toEqual(mockFilter);
    });

    it('should update filter when called multiple times', () => {
      const filter1: Filter = { label: 'Filter 1', route: '/filter1', value: 'filter1' };
      const filter2: Filter = { label: 'Filter 2', route: '/filter2', value: 'filter2' };
      const emittedFilters: (Filter | null)[] = [];

      service.selectedFilter$.subscribe(filter => {
        emittedFilters.push(filter);
      });

      service.setSelectedFilter(filter1);
      service.setSelectedFilter(filter2);

      expect(emittedFilters.length).toBeGreaterThanOrEqual(2);
      expect(emittedFilters[emittedFilters.length - 1]).toEqual(filter2);
      expect(localStorageSetItemSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('getSelectedFilter', () => {
    it('should return filter from localStorage', () => {
      const savedFilter = JSON.stringify(mockFilter);
      localStorageSpy.and.returnValue(savedFilter);

      const result = service.getSelectedFilter();

      expect(result).toEqual(mockFilter);
      expect(localStorageSpy).toHaveBeenCalledWith('selectedFilter');
    });

    it('should return null when no filter in localStorage', () => {
      localStorageSpy.and.returnValue(null);

      const result = service.getSelectedFilter();

      expect(result).toBeNull();
    });

    it('should return null when localStorage returns empty string', () => {
      localStorageSpy.and.returnValue('');

      const result = service.getSelectedFilter();

      expect(result).toBeNull();
    });
  });

  describe('clearSelectedFilter', () => {
    it('should clear filter and remove from localStorage', () => {
      // Set a filter first
      service.setSelectedFilter(mockFilter);

      let emittedFilter: Filter | null = mockFilter;
      service.selectedFilter$.subscribe(filter => {
        emittedFilter = filter;
      });

      service.clearSelectedFilter();

      expect(emittedFilter).toBeNull();
      expect(localStorageRemoveItemSpy).toHaveBeenCalledWith('selectedFilter');
    });

    it('should handle clearing when no filter is set', () => {
      let emittedFilter: Filter | null = null;
      service.selectedFilter$.subscribe(filter => {
        emittedFilter = filter;
      });

      service.clearSelectedFilter();

      expect(emittedFilter).toBeNull();
      expect(localStorageRemoveItemSpy).toHaveBeenCalledWith('selectedFilter');
    });
  });

  describe('selectedFilter$ observable', () => {
    it('should emit initial filter value to new subscribers', (done) => {
      service.setSelectedFilter(mockFilter);

      service.selectedFilter$.subscribe(filter => {
        expect(filter).toEqual(mockFilter);
        done();
      });
    });

    it('should emit null to new subscribers when no filter is set', (done) => {
      service.clearSelectedFilter();

      service.selectedFilter$.subscribe(filter => {
        expect(filter).toBeNull();
        done();
      });
    });

    it('should emit updated filter values to all subscribers', (done) => {
      const filter1: Filter = { label: 'Filter 1', route: '/filter1', value: 'filter1' };
      const filter2: Filter = { label: 'Filter 2', route: '/filter2', value: 'filter2' };
      let emissionCount = 0;

      service.selectedFilter$.subscribe(filter => {
        emissionCount++;
        if (emissionCount === 1) {
          expect(filter).toBeNull(); // Initial value
        } else if (emissionCount === 2) {
          expect(filter).toEqual(filter1);
        } else if (emissionCount === 3) {
          expect(filter).toEqual(filter2);
          done();
        }
      });

      service.setSelectedFilter(filter1);
      service.setSelectedFilter(filter2);
    });
  });

  describe('integration with localStorage', () => {
    it('should persist filter across service instances', (done) => {
      const savedFilter = JSON.stringify(mockFilter);
      localStorageSpy.and.returnValue(savedFilter);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          FilterService,
          { provide: TranslateService, useValue: translateServiceSpy }
        ]
      });
      const service1 = TestBed.inject(FilterService);
      service1.setSelectedFilter(mockFilter);

      // Simulate page reload by creating new service instance
      localStorageSpy.and.returnValue(savedFilter);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          FilterService,
          { provide: TranslateService, useValue: translateServiceSpy }
        ]
      });
      const service2 = TestBed.inject(FilterService);

      let filterFromService2: Filter | null = null;
      service2.selectedFilter$.subscribe(filter => {
        filterFromService2 = filter;
        if (filterFromService2) {
          expect(filterFromService2).toEqual(mockFilter);
          done();
        }
      });
    });

    it('should handle filter with special characters', () => {
      const specialFilter: Filter = {
        label: 'Filter & Test "Special"',
        route: '/test?param=value&other=test',
        value: 'special'
      };

      service.setSelectedFilter(specialFilter);
      const result = service.getSelectedFilter();

      expect(result).toEqual(specialFilter);
    });
  });
});

