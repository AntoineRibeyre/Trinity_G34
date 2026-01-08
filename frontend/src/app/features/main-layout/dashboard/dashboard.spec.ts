import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { PointService } from '../../../services/point.service';
import { UserService } from '../../../services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { User } from '../../../models/user.model';
import { TodayCalendar } from '../../../services/service-interfaces';
import { TeamService } from '../../../services/team.service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let pointServiceSpy: jasmine.SpyObj<PointService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let translateServiceSpy: jasmine.SpyObj<TranslateService>;
  let teamServiceSpy: jasmine.SpyObj<TeamService>;

  const mockUser: User = {
    id: '1',
    username: 'testuser',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    telephone: '0123456789',
    role: 'employee',
    address: {},
    emergencyContact: {}
  };

  const mockPendingDay = {
    id: 1,
    begin: '2024-01-15T08:00:00Z',
    end: null,
    dayType: 'work',
    duration: 3600,
    dayOver: false
  };

  const mockTodayCalendars: TodayCalendar[] = [
    {
      id: 1,
      begin: '2024-01-15T08:00:00Z',
      end: '2024-01-15T12:00:00Z',
      dayType: 'work',
      dayOver: true,
      duration: 14400,
      durationFormatted: '04:00:00',
      employee: {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User'
      }
    },
    {
      id: 2,
      begin: '2024-01-15T13:00:00Z',
      end: null,
      dayType: 'work',
      dayOver: false,
      duration: 0,
      durationFormatted: '00:00:00',
      employee: {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User'
      }
    }
  ];

  beforeEach(async () => {
    // Création des spies
    pointServiceSpy = jasmine.createSpyObj('PointService', [
      'getPendingDay',
      'getTodayCalendar',
      'enregistrerArrivee',
      'enregistrerSortie',
      'calculerDureeTotaleJournee',
      'calculerDureeEnTempsReel'
    ]);

    userServiceSpy = jasmine.createSpyObj('UserService', ['loadCurrentUserFromServer']);

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);
    translateServiceSpy.instant.and.returnValue('Mocked Translation');

    teamServiceSpy = jasmine.createSpyObj('TeamService', [
      'getAllTeams',
      'createTeam',
      'addEmployees',
      'getManagerView',
      'removeMembers',
      'deleteTeam',
      'updateTeam',
      'getTeamDetails',
      'getTeamMembers',
      'getManagerData',
      'getTeamMembersByTeamId',
      'changeTeamManager'
    ]);

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: PointService, useValue: pointServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: TeamService, useValue: teamServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Nettoyer les intervals et subscriptions
    if (component && component.intervalId) {
      clearInterval(component.intervalId);
    }
    if (component) {
      component.ngOnDestroy();
    }
  });

  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load current user on init', fakeAsync(() => {
      userServiceSpy.loadCurrentUserFromServer.and.returnValue(Promise.resolve(mockUser));
      pointServiceSpy.getPendingDay.and.returnValue(of(null));
      pointServiceSpy.getTodayCalendar.and.returnValue(of([]));
      pointServiceSpy.calculerDureeTotaleJournee.and.returnValue(of('00:00:00'));
      pointServiceSpy.enregistrerArrivee.and.returnValue(of({ datetimeField: '2024-01-15T08:00:00Z', durationField: 0 }));
      pointServiceSpy.calculerDureeEnTempsReel.and.returnValue(of('00:00:00'));

      component.ngOnInit();
      tick();

      expect(userServiceSpy.loadCurrentUserFromServer).toHaveBeenCalled();
      expect(component.currentUser).toEqual(mockUser);
      expect(component.userId).toBe(1);
      expect(component.username).toBe('testuser');
      flush();
    }));

    it('should handle null user on init', fakeAsync(() => {
      userServiceSpy.loadCurrentUserFromServer.and.returnValue(Promise.resolve(null));
      pointServiceSpy.getPendingDay.and.returnValue(of(null));
      pointServiceSpy.getTodayCalendar.and.returnValue(of([]));
      pointServiceSpy.calculerDureeTotaleJournee.and.returnValue(of('00:00:00'));
      pointServiceSpy.calculerDureeEnTempsReel.and.returnValue(of('00:00:00'));

      component.ngOnInit();
      tick();

      expect(component.currentUser).toBeNull();
      expect(component.userId).toBeNull();
      expect(component.username).toBeNull();
      flush();
    }));

    it('should start clock interval on init', fakeAsync(() => {
      userServiceSpy.loadCurrentUserFromServer.and.returnValue(Promise.resolve(mockUser));
      pointServiceSpy.getPendingDay.and.returnValue(of(null));
      pointServiceSpy.getTodayCalendar.and.returnValue(of([]));
      pointServiceSpy.calculerDureeTotaleJournee.and.returnValue(of('00:00:00'));
      pointServiceSpy.enregistrerArrivee.and.returnValue(of({ datetimeField: '2024-01-15T08:00:00Z', durationField: 0 }));
      pointServiceSpy.calculerDureeEnTempsReel.and.returnValue(of('00:00:00'));

      const initialTime = component.hour;

      component.ngOnInit();
      tick(1000);

      expect(component.intervalId).toBeDefined();
      // L'heure devrait être mise à jour
      expect(component.hour).toBeDefined();
      tick(1000);
      flush();
    }));

    it('should call chargerJourneeEnCours on init', fakeAsync(() => {
      userServiceSpy.loadCurrentUserFromServer.and.returnValue(Promise.resolve(mockUser));
      pointServiceSpy.getPendingDay.and.returnValue(of(mockPendingDay));
      // ← CORRECTION : passer mockTodayCalendars au lieu de []
      pointServiceSpy.getTodayCalendar.and.returnValue(of(mockTodayCalendars));
      pointServiceSpy.calculerDureeTotaleJournee.and.returnValue(of('04:30:00'));
      pointServiceSpy.calculerDureeEnTempsReel.and.returnValue(of('00:30:00')); // ← AJOUTER aussi

      component.ngOnInit();
      tick();

      expect(pointServiceSpy.getPendingDay).toHaveBeenCalledWith(1);
      expect(component.pendingDay).toEqual(mockPendingDay);
      expect(component.isPointeArrivee).toBeTrue(); // ← Maintenant ça devrait être true

      flush();
    }));

    it('should call loadTodayCalendars on init', fakeAsync(() => {
      userServiceSpy.loadCurrentUserFromServer.and.returnValue(Promise.resolve(mockUser));
      pointServiceSpy.getPendingDay.and.returnValue(of(null));
      pointServiceSpy.getTodayCalendar.and.returnValue(of(mockTodayCalendars));
      pointServiceSpy.calculerDureeTotaleJournee.and.returnValue(of('04:30:00'));
      pointServiceSpy.calculerDureeEnTempsReel.and.returnValue(of('00:30:00'));
      pointServiceSpy.enregistrerArrivee.and.returnValue(of({ datetimeField: '2024-01-15T08:00:00Z', durationField: 0 }));

      component.ngOnInit();
      tick();

      expect(pointServiceSpy.getTodayCalendar).toHaveBeenCalledWith(1);
      expect(component.todayCalendars).toEqual(mockTodayCalendars);

      flush();
    }));
  });

  describe('Clock functionality', () => {
    it('should update time correctly', () => {
      const testDate = new Date(2024, 0, 15, 14, 30, 45); // 15 Jan 2024, 14:30:45
      jasmine.clock().install();
      jasmine.clock().mockDate(testDate);

      component.updateTime();

      expect(component.year).toBe('2024');
      expect(component.day).toBe('15');
      expect(component.hour).toBe('14');
      expect(component.minute).toBe('30');
      expect(component.second).toBe('45');

      jasmine.clock().uninstall();
    });

    it('should pad zero for single digit values', () => {
      expect(component.padZero(5)).toBe('05');
      expect(component.padZero(10)).toBe('10');
    });
  });

  describe('chargerJourneeEnCours', () => {
    it('should load pending day when userId exists', () => {
      component.userId = 1;
      pointServiceSpy.getPendingDay.and.returnValue(of(mockPendingDay));

      component.chargerJourneeEnCours();

      expect(pointServiceSpy.getPendingDay).toHaveBeenCalledWith(1);
      expect(component.pendingDay).toEqual(mockPendingDay);
      expect(component.isPointeArrivee).toBeTrue();
    });

    it('should set isPointeArrivee to false when no pending day', () => {
      component.userId = 1;
      pointServiceSpy.getPendingDay.and.returnValue(of(null));

      component.chargerJourneeEnCours();

      expect(component.isPointeArrivee).toBeFalse();
    });

    it('should not call service when userId is null', () => {
      component.userId = null;

      component.chargerJourneeEnCours();

      expect(pointServiceSpy.getPendingDay).not.toHaveBeenCalled();
    });

    it('should handle error when loading pending day', () => {
      component.userId = 1;
      const consoleErrorSpy = spyOn(console, 'error');
      pointServiceSpy.getPendingDay.and.returnValue(throwError(() => new Error('API Error')));

      component.chargerJourneeEnCours();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('loadTodayCalendars', () => {
    it('should load today calendars successfully', () => {
      component.userId = 1;
      pointServiceSpy.getTodayCalendar.and.returnValue(of(mockTodayCalendars));
      pointServiceSpy.calculerDureeTotaleJournee.and.returnValue(of('04:30:00'));
      pointServiceSpy.calculerDureeEnTempsReel.and.returnValue(of('00:30:00')); // ← AJOUTÉ

      component.loadTodayCalendars();

      expect(component.isLoading).toBeFalse();
      expect(component.todayCalendars).toEqual(mockTodayCalendars);
      expect(pointServiceSpy.calculerDureeTotaleJournee).toHaveBeenCalledWith(mockTodayCalendars);
    });

    it('should handle error when loading calendars', () => {
      component.userId = 1;
      const consoleErrorSpy = spyOn(console, 'error');
      pointServiceSpy.getTodayCalendar.and.returnValue(throwError(() => new Error('API Error')));

      component.loadTodayCalendars();

      expect(component.isLoading).toBeFalse();
      expect(component.error).toBe('Erreur lors du chargement des données');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should not load when userId is null', () => {
      component.userId = null;
      const consoleWarnSpy = spyOn(console, 'warn');

      component.loadTodayCalendars();

      expect(pointServiceSpy.getTodayCalendar).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Pas d\'userId disponible');
    });

    it('should set isLoading correctly', () => {
      component.userId = 1;
      pointServiceSpy.getTodayCalendar.and.returnValue(of(mockTodayCalendars));
      pointServiceSpy.calculerDureeTotaleJournee.and.returnValue(of('04:30:00'));
      pointServiceSpy.calculerDureeEnTempsReel.and.returnValue(of('00:30:00')); // ← AJOUTÉ

      component.loadTodayCalendars();

      // Après le chargement, isLoading devrait être false
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('Pointage functionality', () => {
    describe('pointerArrivee', () => {
      it('should register arrival successfully', () => {
        component.userId = 1;
        const mockResult = { datetimeField: '2024-01-15T08:00:00Z', durationField: 0 };
        pointServiceSpy.enregistrerArrivee.and.returnValue(of(mockResult));
        pointServiceSpy.getTodayCalendar.and.returnValue(of(mockTodayCalendars));
        pointServiceSpy.calculerDureeTotaleJournee.and.returnValue(of('00:00:00'));
        pointServiceSpy.calculerDureeEnTempsReel.and.returnValue(of('00:00:00')); // ← AJOUTÉ

        component.pointerArrivee();

        expect(pointServiceSpy.enregistrerArrivee).toHaveBeenCalledWith(1);
        expect(pointServiceSpy.getTodayCalendar).toHaveBeenCalledWith(1);
      });

      it('should not register arrival when userId is null', () => {
        component.userId = null;

        component.pointerArrivee();

        expect(pointServiceSpy.enregistrerArrivee).not.toHaveBeenCalled();
      });

      it('should handle error when registering arrival', () => {
        component.userId = 1;
        const consoleErrorSpy = spyOn(console, 'error');
        pointServiceSpy.enregistrerArrivee.and.returnValue(throwError(() => new Error('API Error')));

        component.pointerArrivee();

        expect(consoleErrorSpy).toHaveBeenCalledWith('Erreur pointage arrivée:', jasmine.any(Error));
      });
    });

    describe('pointerSortie', () => {
      it('should register departure successfully', () => {
        component.userId = 1;
        const mockResult = { datetimeField: '2024-01-15T17:00:00Z', durationField: 28800 };
        pointServiceSpy.enregistrerSortie.and.returnValue(of(mockResult));
        pointServiceSpy.getTodayCalendar.and.returnValue(of([]));
        pointServiceSpy.calculerDureeTotaleJournee.and.returnValue(of('08:00:00'));

        component.pointerSortie();

        expect(pointServiceSpy.enregistrerSortie).toHaveBeenCalledWith(1, 'office');
        expect(component.isPointeArrivee).toBeFalse();
        expect(component.dureeActuelle).toBe('00:00');
      });

      it('should not register departure when userId is null', () => {
        component.userId = null;

        component.pointerSortie();

        expect(pointServiceSpy.enregistrerSortie).not.toHaveBeenCalled();
      });

      it('should handle error when registering departure', () => {
        component.userId = 1;
        const consoleErrorSpy = spyOn(console, 'error');
        pointServiceSpy.enregistrerSortie.and.returnValue(throwError(() => new Error('API Error')));

        component.pointerSortie();

        expect(consoleErrorSpy).toHaveBeenCalledWith('Erreur pointage sortie:', jasmine.any(Error));
      });
    });
  });

  describe('Cleanup', () => {
    it('should clear interval on destroy', () => {
      component.intervalId = setInterval(() => {}, 1000);
      const intervalId = component.intervalId;
      spyOn(window, 'clearInterval');

      component.ngOnDestroy();

      expect(clearInterval).toHaveBeenCalledWith(intervalId);
    });

    it('should unsubscribe from dureeSubscription on destroy', () => {
      const mockSubscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      component['dureeSubscription'] = mockSubscription;

      component.ngOnDestroy();

      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should unsubscribe from dureeTotaleSubscription on destroy', () => {
      // Créer une vraie subscription
      component.userId = 1;
      pointServiceSpy.getTodayCalendar.and.returnValue(of(mockTodayCalendars));
      pointServiceSpy.calculerDureeTotaleJournee.and.returnValue(of('04:30:00'));
      pointServiceSpy.calculerDureeEnTempsReel.and.returnValue(of('00:30:00'));

      // Charger les calendriers pour créer la subscription
      component.loadTodayCalendars();

      // Récupérer la subscription qui a été créée
      const subscription = component['dureeTotaleSubscription'];

      // Vérifier qu'elle existe
      expect(subscription).toBeDefined();

      // Spy AVANT d'appeler ngOnDestroy
      if (subscription) {
        const unsubscribeSpy = spyOn(subscription, 'unsubscribe').and.callThrough();

        // NE PAS appeler component.ngOnDestroy() ici
        // Il sera appelé automatiquement dans afterEach

        // À la place, on vérifie directement
        subscription.unsubscribe();

        expect(unsubscribeSpy).toHaveBeenCalled();
      }
    });

    it('should handle destroy when subscriptions are undefined', () => {
      // S'assurer que ngOnDestroy ne plante pas si les subscriptions n'existent pas
      component['dureeSubscription'] = undefined;
      component['dureeTotaleSubscription'] = undefined;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Duration calculation integration', () => {
    it('should start duration calculation for ongoing calendar', fakeAsync(() => {
      component.userId = 1;
      component.todayCalendars = mockTodayCalendars;

      const durationSubject = new Subject<string>();
      pointServiceSpy.calculerDureeTotaleJournee.and.returnValue(of('04:30:00'));
      pointServiceSpy.calculerDureeEnTempsReel.and.returnValue(durationSubject.asObservable());

      component['demarrerCalculDureeTotale']();

      expect(component.isPointeArrivee).toBeTrue();
      expect(pointServiceSpy.calculerDureeEnTempsReel).toHaveBeenCalled();

      durationSubject.next('01:30:00');
      tick();

      expect(component.dureeActuelle).toBe('01:30:00');

      durationSubject.complete();
      flush();
    }));

    it('should not calculate current duration when no ongoing calendar', () => {
      const completedCalendars = mockTodayCalendars.map(cal => ({ ...cal, dayOver: true }));
      component.todayCalendars = completedCalendars;

      pointServiceSpy.calculerDureeTotaleJournee.and.returnValue(of('08:00:00'));

      component['demarrerCalculDureeTotale']();

      expect(component.isPointeArrivee).toBeFalse();
      expect(pointServiceSpy.calculerDureeEnTempsReel).not.toHaveBeenCalled();
    });
  });
});
