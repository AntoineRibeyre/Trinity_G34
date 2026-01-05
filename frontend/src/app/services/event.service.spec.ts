import { TestBed } from '@angular/core/testing';
import { EventService } from './event.service';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { UserService } from './user.service';
import { User } from '../models/user.model';
import { GraphQLError } from 'graphql';

describe('EventService', () => {
  let service: EventService;
  let controller: ApolloTestingController;
  let userService: jasmine.SpyObj<UserService>;

  const mockGraphQLUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User'
  };

  const mockUser: User = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER'
  };

  const mockGraphQLEvent = {
    id: 1,
    subject: 'Test Event',
    startTime: '2024-01-15T10:00:00Z',
    endTime: '2024-01-15T12:00:00Z',
    isAllDay: false,
    attendees: [mockGraphQLUser]
  };

  const mockEvent = {
    id: 1,
    subject: 'Test Event',
    startTime: '2024-01-15T10:00:00Z',
    endTime: '2024-01-15T12:00:00Z',
    isAllDay: false,
    attendees: [mockUser]
  };

  beforeEach(() => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['convertUser']);
    userServiceSpy.convertUser.and.returnValue(mockUser);

    TestBed.configureTestingModule({
      imports: [ApolloTestingModule],
      providers: [
        EventService,
        { provide: UserService, useValue: userServiceSpy }
      ]
    });

    service = TestBed.inject(EventService);
    controller = TestBed.inject(ApolloTestingController);
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  afterEach(() => {
    controller.verify();
  });

  describe('getAllEvents', () => {
    it('should fetch and convert all events', async () => {
      const mockEvents = [mockGraphQLEvent, { ...mockGraphQLEvent, id: 2, subject: 'Event 2' }];

      const resultPromise = service.getAllEvents();

      const op = controller.expectOne('GetAllEvents');
      op.flush({
        data: {
          allEvents: mockEvents
        }
      });

      const result = await resultPromise;

      expect(result.length).toBe(2);
      expect(result[0].id).toBe(1);
      expect(result[0].subject).toBe('Test Event');
      expect(result[0].attendees).toEqual([mockUser]);
      expect(userService.convertUser).toHaveBeenCalledTimes(2);
    });

    it('should return empty array when no events', async () => {
      const resultPromise = service.getAllEvents();

      const op = controller.expectOne('GetAllEvents');
      op.flush({
        data: {
          allEvents: []
        }
      });

      const result = await resultPromise;

      expect(result).toEqual([]);
    });

    it('should handle events without attendees', async () => {
      const eventWithoutAttendees = { ...mockGraphQLEvent, attendees: undefined };

      const resultPromise = service.getAllEvents();

      const op = controller.expectOne('GetAllEvents');
      op.flush({
        data: {
          allEvents: [eventWithoutAttendees]
        }
      });

      const result = await resultPromise;

      expect(result[0].attendees).toBeUndefined();
    });

    it('should throw error on network failure', async () => {
      const consoleErrorSpy = spyOn(console, 'error');

      const resultPromise = service.getAllEvents();

      const op = controller.expectOne('GetAllEvents');
      op.graphqlErrors([new GraphQLError('Network error')]);

      await expectAsync(resultPromise).toBeRejected();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('createEvent', () => {
    it('should create event successfully', async () => {
      const eventData = {
        Subject: 'New Event',
        StartTime: new Date('2024-01-15T10:00:00Z'),
        EndTime: new Date('2024-01-15T12:00:00Z'),
        IsAllDay: false
      };

      const attendeeIds = [1, 2];

      const resultPromise = service.createEvent(eventData, attendeeIds);

      const op = controller.expectOne('CreateEvent');
      expect(op.operation.variables["subject"]).toBe('New Event');
      expect(op.operation.variables["startTime"]).toBe('2024-01-15T10:00:00.000Z');
      expect(op.operation.variables["endTime"]).toBe('2024-01-15T12:00:00.000Z');
      expect(op.operation.variables["isAllDay"]).toBe(false);
      expect(op.operation.variables["attendeeIds"]).toEqual([1, 2]);

      op.flush({
        data: {
          createEvent: {
            event: { ...mockEvent, subject: 'New Event' },
            success: true,
            message: 'Event created'
          }
        }
      });

      // Handle refetchQueries for GetAllEvents
      const refetchOp = controller.expectOne('GetAllEvents');
      refetchOp.flush({
        data: {
          allEvents: []
        }
      });

      const result = await resultPromise;

      expect(result?.success).toBe(true);
      expect(result?.event.subject).toBe('New Event');
    });

    it('should create event without attendees', async () => {
      const eventData = {
        Subject: 'New Event',
        StartTime: new Date('2024-01-15T10:00:00Z'),
        EndTime: new Date('2024-01-15T12:00:00Z'),
        IsAllDay: false
      };

      const resultPromise = service.createEvent(eventData);

      const op = controller.expectOne('CreateEvent');
      expect(op.operation.variables["attendeeIds"]).toEqual([]);

      op.flush({
        data: {
          createEvent: {
            event: mockEvent,
            success: true,
            message: 'Event created'
          }
        }
      });

      // Handle refetchQueries for GetAllEvents
      const refetchOp = controller.expectOne('GetAllEvents');
      refetchOp.flush({
        data: {
          allEvents: []
        }
      });

      const result = await resultPromise;
      expect(result?.success).toBe(true);
    });

    it('should handle all-day events', async () => {
      const eventData = {
        Subject: 'All Day Event',
        StartTime: new Date('2024-01-15T00:00:00Z'),
        EndTime: new Date('2024-01-15T23:59:59Z'),
        IsAllDay: true
      };

      const resultPromise = service.createEvent(eventData);

      const op = controller.expectOne('CreateEvent');
      expect(op.operation.variables["isAllDay"]).toBe(true);

      op.flush({
        data: {
          createEvent: {
            event: { ...mockEvent, isAllDay: true },
            success: true,
            message: 'Event created'
          }
        }
      });

      // Handle refetchQueries for GetAllEvents
      const refetchOp = controller.expectOne('GetAllEvents');
      refetchOp.flush({
        data: {
          allEvents: []
        }
      });

      const result = await resultPromise;
      expect(result?.event.isAllDay).toBe(true);
    });

    it('should throw error on creation failure', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const eventData = {
        Subject: 'New Event',
        StartTime: new Date(),
        EndTime: new Date(),
        IsAllDay: false
      };

      const resultPromise = service.createEvent(eventData);

      const op = controller.expectOne('CreateEvent');
      op.graphqlErrors([new GraphQLError('Creation failed')]);

      await expectAsync(resultPromise).toBeRejected();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('updateEvent', () => {
    it('should update event successfully', async () => {
      const eventId = 1;
      const eventData = {
        Subject: 'Updated Event',
        StartTime: new Date('2024-01-15T14:00:00Z'),
        EndTime: new Date('2024-01-15T16:00:00Z'),
        IsAllDay: false
      };
      const attendeeIds = [1];

      const resultPromise = service.updateEvent(eventId, eventData, attendeeIds);

      const op = controller.expectOne('UpdateEvent');
      expect(op.operation.variables["eventId"]).toBe(1);
      expect(op.operation.variables["subject"]).toBe('Updated Event');

      op.flush({
        data: {
          updateEvent: {
            event: { ...mockEvent, subject: 'Updated Event' },
            success: true,
            message: 'Event updated'
          }
        }
      });

      // Handle refetchQueries for GetAllEvents
      const refetchOp = controller.expectOne('GetAllEvents');
      refetchOp.flush({
        data: {
          allEvents: []
        }
      });

      const result = await resultPromise;

      expect(result?.success).toBe(true);
      expect(result?.event.subject).toBe('Updated Event');
    });

    it('should throw error on update failure', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const eventId = 1;
      const eventData = {
        Subject: 'Updated Event',
        StartTime: new Date(),
        EndTime: new Date(),
        IsAllDay: false
      };

      const resultPromise = service.updateEvent(eventId, eventData);

      const op = controller.expectOne('UpdateEvent');
      op.graphqlErrors([new GraphQLError('Update failed')]);

      await expectAsync(resultPromise).toBeRejected();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('deleteEvent', () => {
    it('should delete event successfully', async () => {
      const eventId = 1;

      const resultPromise = service.deleteEvent(eventId);

      const op = controller.expectOne('DeleteEvent');
      expect(op.operation.variables["eventId"]).toBe(1);

      op.flush({
        data: {
          deleteEvent: {
            success: true,
            message: 'Event deleted'
          }
        }
      });

      // Handle refetchQueries for GetAllEvents
      const refetchOp = controller.expectOne('GetAllEvents');
      refetchOp.flush({
        data: {
          allEvents: []
        }
      });

      const result = await resultPromise;

      expect(result?.success).toBe(true);
      expect(result?.message).toBe('Event deleted');
    });

    it('should throw error on deletion failure', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const eventId = 1;

      const resultPromise = service.deleteEvent(eventId);

      const op = controller.expectOne('DeleteEvent');
      op.graphqlErrors([new GraphQLError('Deletion failed')]);

      await expectAsync(resultPromise).toBeRejected();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('updateEventAttendees', () => {
    it('should update event attendees successfully', async () => {
      const eventId = 1;
      const attendeeIds = [1, 2, 3];

      const resultPromise = service.updateEventAttendees(eventId, attendeeIds);

      const op = controller.expectOne('UpdateEventAttendees');
      expect(op.operation.variables["eventId"]).toBe(1);
      expect(op.operation.variables["attendeeIds"]).toEqual([1, 2, 3]);

      op.flush({
        data: {
          updateEventAttendees: {
            event: mockEvent
          }
        }
      });

      // Handle refetchQueries for GetAllEvents
      const refetchOp = controller.expectOne('GetAllEvents');
      refetchOp.flush({
        data: {
          allEvents: []
        }
      });

      const result = await resultPromise;

      expect(result).toEqual(mockEvent);
    });

    it('should throw error on update attendees failure', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const eventId = 1;
      const attendeeIds = [1, 2];

      const resultPromise = service.updateEventAttendees(eventId, attendeeIds);

      const op = controller.expectOne('UpdateEventAttendees');
      op.graphqlErrors([new GraphQLError('Update failed')]);

      await expectAsync(resultPromise).toBeRejected();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('addAttendee', () => {
    it('should add attendee successfully', async () => {
      const eventId = 1;
      const userId = 2;

      const resultPromise = service.addAttendee(eventId, userId);

      const op = controller.expectOne('AddAttendee');
      expect(op.operation.variables["eventId"]).toBe(1);
      expect(op.operation.variables["userId"]).toBe(2);

      op.flush({
        data: {
          addAttendee: {
            event: mockEvent
          }
        }
      });

      // Handle refetchQueries for GetAllEvents
      const refetchOp = controller.expectOne('GetAllEvents');
      refetchOp.flush({
        data: {
          allEvents: []
        }
      });

      const result = await resultPromise;

      expect(result).toEqual(mockEvent);
    });

    it('should throw error on add attendee failure', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const eventId = 1;
      const userId = 2;

      const resultPromise = service.addAttendee(eventId, userId);

      const op = controller.expectOne('AddAttendee');
      op.graphqlErrors([new GraphQLError('Add failed')]);

      await expectAsync(resultPromise).toBeRejected();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('removeAttendee', () => {
    it('should remove attendee successfully', async () => {
      const eventId = 1;
      const userId = 2;

      const resultPromise = service.removeAttendee(eventId, userId);

      const op = controller.expectOne('RemoveAttendee');
      expect(op.operation.variables["eventId"]).toBe(1);
      expect(op.operation.variables["userId"]).toBe(2);

      op.flush({
        data: {
          removeAttendee: {
            event: mockEvent
          }
        }
      });

      // Handle refetchQueries for GetAllEvents
      const refetchOp = controller.expectOne('GetAllEvents');
      refetchOp.flush({
        data: {
          allEvents: []
        }
      });

      const result = await resultPromise;

      expect(result).toEqual(mockEvent);
    });

    it('should throw error on remove attendee failure', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const eventId = 1;
      const userId = 2;

      const resultPromise = service.removeAttendee(eventId, userId);

      const op = controller.expectOne('RemoveAttendee');
      op.graphqlErrors([new GraphQLError('Remove failed')]);

      await expectAsync(resultPromise).toBeRejected();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});

