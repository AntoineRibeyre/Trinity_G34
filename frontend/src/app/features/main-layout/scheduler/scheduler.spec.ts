import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Scheduler } from './scheduler';
import { EventService } from '../../../services/event.service';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';
import { of, throwError } from 'rxjs';

describe('Scheduler', () => {
  let component: Scheduler;
  let fixture: ComponentFixture<Scheduler>;
  let eventService: jasmine.SpyObj<EventService>;
  let userService: jasmine.SpyObj<UserService>;

  const mockUser: User = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER'
  };

  const mockUsers: User[] = [
    mockUser,
    { ...mockUser, id: '2', username: 'user2' }
  ];

  const mockEvents = [
    {
      id: 1,
      subject: 'Event 1',
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T12:00:00Z',
      isAllDay: false,
      attendees: [mockUser]
    },
    {
      id: 2,
      subject: 'Event 2',
      startTime: '2024-01-16T10:00:00Z',
      endTime: '2024-01-16T12:00:00Z',
      isAllDay: false,
      attendees: [{ ...mockUser, id: '2' }]
    }
  ];

  beforeEach(async () => {
    const eventServiceSpy = jasmine.createSpyObj('EventService', ['getAllEvents']);
    const userServiceSpy = jasmine.createSpyObj('UserService', [
      'loadCurrentUserFromServer',
      'getAllUsers'
    ]);

    await TestBed.configureTestingModule({
      imports: [Scheduler],
      providers: [
        { provide: EventService, useValue: eventServiceSpy },
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Scheduler);
    component = fixture.componentInstance;
    eventService = TestBed.inject(EventService) as jasmine.SpyObj<EventService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize user and load users and events', async () => {
      userService.loadCurrentUserFromServer.and.returnValue(Promise.resolve(mockUser));
      userService.getAllUsers.and.returnValue(Promise.resolve(mockUsers));
      eventService.getAllEvents.and.returnValue(Promise.resolve(mockEvents));

      await component.ngOnInit();

      expect(userService.loadCurrentUserFromServer).toHaveBeenCalled();
      expect(userService.getAllUsers).toHaveBeenCalled();
      expect(eventService.getAllEvents).toHaveBeenCalled();
      expect(component.currentUser).toEqual(mockUser);
      expect(component.allUsers).toEqual(mockUsers);
      expect(component.userId).toBe(1);
      expect(component.username).toBe('testuser');
    });

    it('should handle error when loading current user', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      userService.loadCurrentUserFromServer.and.returnValue(Promise.resolve(null));
      userService.getAllUsers.and.returnValue(Promise.resolve(mockUsers));
      eventService.getAllEvents.and.returnValue(Promise.resolve(mockEvents));

      await component.ngOnInit();

      expect(component.currentUser).toBeNull();
      expect(component.userId).toBeNull();
    });

    it('should handle error when loading users', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      userService.loadCurrentUserFromServer.and.returnValue(Promise.resolve(mockUser));
      userService.getAllUsers.and.returnValue(Promise.reject(new Error('Failed to load users')));
      eventService.getAllEvents.and.returnValue(Promise.resolve(mockEvents));

      await component.ngOnInit();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle error when loading events', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      userService.loadCurrentUserFromServer.and.returnValue(Promise.resolve(mockUser));
      userService.getAllUsers.and.returnValue(Promise.resolve(mockUsers));
      eventService.getAllEvents.and.returnValue(Promise.reject(new Error('Failed to load events')));

      await component.ngOnInit();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('loadUsers', () => {
    it('should load all users successfully', async () => {
      userService.getAllUsers.and.returnValue(Promise.resolve(mockUsers));

      await component.loadUsers();

      expect(component.allUsers).toEqual(mockUsers);
      expect(userService.getAllUsers).toHaveBeenCalled();
    });

    it('should handle error when loading users', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      userService.getAllUsers.and.returnValue(Promise.reject(new Error('Failed')));

      await component.loadUsers();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('loadEvents', () => {
    it('should load and transform events successfully', async () => {
      component.userId = 1;
      component.showOnlyMyEvents = true;
      eventService.getAllEvents.and.returnValue(Promise.resolve(mockEvents));

      await component.loadEvents();

      expect(eventService.getAllEvents).toHaveBeenCalled();
      expect(component.data.length).toBe(1); // Only events for user 1
      expect(component.data[0].Id).toBe(1);
      expect(component.data[0].Subject).toBe('Event 1');
    });

    it('should load all events when showOnlyMyEvents is false', async () => {
      component.userId = 1;
      component.showOnlyMyEvents = false;
      eventService.getAllEvents.and.returnValue(Promise.resolve(mockEvents));

      await component.loadEvents();

      expect(component.data.length).toBe(2); // All events
    });

    it('should transform event dates correctly', async () => {
      component.userId = 1;
      component.showOnlyMyEvents = true;
      eventService.getAllEvents.and.returnValue(Promise.resolve(mockEvents));

      await component.loadEvents();

      expect(component.data[0].StartTime).toBeInstanceOf(Date);
      expect(component.data[0].EndTime).toBeInstanceOf(Date);
    });

    it('should handle events without attendees', async () => {
      component.userId = 1;
      component.showOnlyMyEvents = false; // Show all events to see the one without attendees
      const eventsWithoutAttendees = [
        { ...mockEvents[0], attendees: undefined }
      ];
      eventService.getAllEvents.and.returnValue(Promise.resolve(eventsWithoutAttendees));

      await component.loadEvents();

      expect(component.data.length).toBe(1);
      expect(component.data[0].Attendees).toEqual([]);
      expect(component.data[0].AttendeeIds).toEqual([]);
    });

    it('should handle error when loading events', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      component.userId = 1;
      eventService.getAllEvents.and.returnValue(Promise.reject(new Error('Failed')));

      await component.loadEvents();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('initializeUser', () => {
    it('should use targetUserId when provided', async () => {
      component.targetUserId = 2;
      component.allUsers = mockUsers;
      eventService.getAllEvents.and.returnValue(Promise.resolve(mockEvents));

      await component.initializeUser();

      expect(component.userId).toBe(2);
      expect(component.username).toBe('user2');
      expect(eventService.getAllEvents).toHaveBeenCalled();
    });

    it('should load current user when targetUserId is not provided', async () => {
      component.targetUserId = undefined;
      userService.loadCurrentUserFromServer.and.returnValue(Promise.resolve(mockUser));
      eventService.getAllEvents.and.returnValue(Promise.resolve(mockEvents));

      await component.initializeUser();

      expect(userService.loadCurrentUserFromServer).toHaveBeenCalled();
      expect(component.userId).toBe(1);
      expect(component.username).toBe('testuser');
    });

    it('should handle case when user not found in allUsers', async () => {
      component.targetUserId = 999;
      component.allUsers = mockUsers;
      eventService.getAllEvents.and.returnValue(Promise.resolve(mockEvents));

      await component.initializeUser();

      expect(component.userId).toBe(999);
      expect(component.username).toBeNull();
    });
  });

  describe('ngOnChanges', () => {
    it('should reload user and events when targetUserId changes', async () => {
      // Setup: load users first
      await component.loadUsers();
      component.allUsers = mockUsers;
      
      const changes = {
        targetUserId: {
          previousValue: 1,
          currentValue: 2,
          firstChange: false
        }
      };

      // Set targetUserId before calling ngOnChanges
      component.targetUserId = 2;
      eventService.getAllEvents.and.returnValue(Promise.resolve(mockEvents));

      await component.ngOnChanges(changes as any);

      expect(component.userId).toBe(2);
      expect(eventService.getAllEvents).toHaveBeenCalled();
    });

    it('should not reload on first change', async () => {
      const changes = {
        targetUserId: {
          previousValue: undefined,
          currentValue: 2,
          firstChange: true
        }
      };

      await component.ngOnChanges(changes as any);

      // Should not call initializeUser on first change
      expect(component.userId).toBeNull();
    });
  });

  describe('setUserID', () => {
    it('should set user ID', async () => {
      await component.setUserID(5);

      expect(component.userId).toBe(5);
    });
  });

  describe('event filtering', () => {
    it('should filter events by userId when showOnlyMyEvents is true', async () => {
      component.userId = 1;
      component.showOnlyMyEvents = true;
      eventService.getAllEvents.and.returnValue(Promise.resolve(mockEvents));

      await component.loadEvents();

      expect(component.data.length).toBe(1);
      expect(component.data[0].Id).toBe(1);
    });

    it('should show all events when showOnlyMyEvents is false', async () => {
      component.userId = 1;
      component.showOnlyMyEvents = false;
      eventService.getAllEvents.and.returnValue(Promise.resolve(mockEvents));

      await component.loadEvents();

      expect(component.data.length).toBe(2);
    });

    it('should show all events when userId is null', async () => {
      component.userId = null;
      component.showOnlyMyEvents = true;
      eventService.getAllEvents.and.returnValue(Promise.resolve(mockEvents));

      await component.loadEvents();

      expect(component.data.length).toBe(2);
    });
  });
});
