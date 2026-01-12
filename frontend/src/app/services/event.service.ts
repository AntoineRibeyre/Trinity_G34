// services/eventService.ts
import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { UserService } from './user.service';

import { User } from '../models/user.model';

// Interface pour les données GraphQL (avant conversion)
interface GraphQLUser {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface GraphQLEvent {
  id: number;
  subject: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  attendees?: GraphQLUser[];
}

interface Event {
  id: number;
  subject: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  attendees?: User[];
}

interface CreateEventResponse {
  createEvent: {
    event: Event;
    success: boolean;
    message: string;
  };
}

interface UpdateEventResponse {
  updateEvent: {
    event: Event;
    success: boolean;
    message: string;
  };
}

interface DeleteEventResponse {
  deleteEvent: {
    success: boolean;
    message: string;
  };
}

interface AllEventsResponse {
  allEvents: GraphQLEvent[];
}


interface UpdateAttendeesResponse {
  updateEventAttendees: {
    event: Event;
  };
}

interface AddAttendeeResponse {
  addAttendee: {
    event: Event;
  };
}

interface RemoveAttendeeResponse {
  removeAttendee: {
    event: Event;
  };
}

const GET_ALL_EVENTS = gql`
  query GetAllEvents {
    allEvents {
      id
      subject
      startTime
      endTime
      isAllDay
      attendees {
        id
        username
        email
        firstName
        lastName
      }
    }
  }
`;


const CREATE_EVENT = gql`
  mutation CreateEvent(
    $subject: String!
    $startTime: DateTime!
    $endTime: DateTime!
    $isAllDay: Boolean
    $attendeeIds: [Int]
  ) {
    createEvent(
      subject: $subject
      startTime: $startTime
      endTime: $endTime
      isAllDay: $isAllDay
      attendeeIds: $attendeeIds
    ) {
      event {
        id
        subject
        startTime
        endTime
        isAllDay
        attendees {
          id
          username
          email
        }
      }
      success
      message
    }
  }
`;

const UPDATE_EVENT = gql`
  mutation UpdateEvent(
    $eventId: Int!
    $subject: String!
    $startTime: DateTime!
    $endTime: DateTime!
    $isAllDay: Boolean
    $attendeeIds: [Int]
  ) {
    updateEvent(
      eventId: $eventId
      subject: $subject
      startTime: $startTime
      endTime: $endTime
      isAllDay: $isAllDay
      attendeeIds: $attendeeIds
    ) {
      event {
        id
        subject
        startTime
        endTime
        isAllDay
        attendees {
          id
          username
          email
        }
      }
      success
      message
    }
  }
`;

const DELETE_EVENT = gql`
  mutation DeleteEvent($eventId: Int!) {
    deleteEvent(eventId: $eventId) {
      success
      message
    }
  }
`;

const UPDATE_EVENT_ATTENDEES = gql`
  mutation UpdateEventAttendees($eventId: Int!, $attendeeIds: [Int]!) {
    updateEventAttendees(eventId: $eventId, attendeeIds: $attendeeIds) {
      event {
        id
        subject
        attendees {
          id
          username
          email
        }
      }
    }
  }
`;

const ADD_ATTENDEE = gql`
  mutation AddAttendee($eventId: Int!, $userId: Int!) {
    addAttendee(eventId: $eventId, userId: $userId) {
      event {
        id
        attendees {
          id
          username
          email
        }
      }
    }
  }
`;

const REMOVE_ATTENDEE = gql`
  mutation RemoveAttendee($eventId: Int!, $userId: Int!) {
    removeAttendee(eventId: $eventId, userId: $userId) {
      event {
        id
        attendees {
          id
          username
          email
        }
      }
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class EventService {
  
  constructor(private apollo: Apollo, private userService: UserService) {}
  
  
  
  // Fonction utilitaire pour convertir GraphQLEvent en Event
  private convertEvent(graphqlEvent: GraphQLEvent): Event {
    return {
      ...graphqlEvent,
      attendees: graphqlEvent.attendees?.map(u => this.userService.convertUser(u))
    };
  }
  
  async getAllEvents(): Promise<Event[]> {
    try {
      const response = await firstValueFrom(
        this.apollo.query<AllEventsResponse>({
          query: GET_ALL_EVENTS,
          fetchPolicy: 'network-only'
        })
      );
      
      const events = (response.data?.allEvents || []).map(event => 
        this.convertEvent(event)
      );
      
      return events;
    } catch (error) {
      // console.error('Erreur lors de la récupération des événements:', error);
      throw error;
    }
  }

  
  
  async createEvent(eventData: any, attendeeIds?: number[]) {
    try {
      const response = await firstValueFrom(
        this.apollo.mutate<CreateEventResponse>({
          mutation: CREATE_EVENT,
          variables: {
            subject: eventData.Subject,
            startTime: eventData.StartTime.toISOString(),
            endTime: eventData.EndTime.toISOString(),
            isAllDay: eventData.IsAllDay || false,
            attendeeIds: attendeeIds || []
          },
          refetchQueries: [{ query: GET_ALL_EVENTS }]
        })
      );
      return response.data?.createEvent;
    } catch (error) {
      // console.error('Erreur lors de la création de l\'événement:', error);
      throw error;
    }
  }

  async updateEvent(eventId: number, eventData: any, attendeeIds?: number[]) {
    try {
      const response = await firstValueFrom(
        this.apollo.mutate<UpdateEventResponse>({
          mutation: UPDATE_EVENT,
          variables: {
            eventId,
            subject: eventData.Subject,
            startTime: eventData.StartTime.toISOString(),
            endTime: eventData.EndTime.toISOString(),
            isAllDay: eventData.IsAllDay || false,
            attendeeIds: attendeeIds || []
          },
          refetchQueries: [{ query: GET_ALL_EVENTS }]
        })
      );
      return response.data?.updateEvent;
    } catch (error) {
      // console.error('Erreur lors de la mise à jour de l\'événement:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: number) {
    try {
      const response = await firstValueFrom(
        this.apollo.mutate<DeleteEventResponse>({
          mutation: DELETE_EVENT,
          variables: {
            eventId
          },
          refetchQueries: [{ query: GET_ALL_EVENTS }]
        })
      );
      return response.data?.deleteEvent;
    } catch (error) {
      // console.error('Erreur lors de la suppression de l\'événement:', error);
      throw error;
    }
  }

  async updateEventAttendees(eventId: number, attendeeIds: number[]) {
    try {
      const response = await firstValueFrom(
        this.apollo.mutate<UpdateAttendeesResponse>({
          mutation: UPDATE_EVENT_ATTENDEES,
          variables: {
            eventId,
            attendeeIds
          },
          refetchQueries: [{ query: GET_ALL_EVENTS }]
        })
      );
      return response.data?.updateEventAttendees.event;
    } catch (error) {
      // console.error('Erreur lors de la mise à jour des participants:', error);
      throw error;
    }
  }

  async addAttendee(eventId: number, userId: number) {
    try {
      const response = await firstValueFrom(
        this.apollo.mutate<AddAttendeeResponse>({
          mutation: ADD_ATTENDEE,
          variables: {
            eventId,
            userId
          },
          refetchQueries: [{ query: GET_ALL_EVENTS }]
        })
      );
      return response.data?.addAttendee.event;
    } catch (error) {
      // console.error('Erreur lors de l\'ajout du participant:', error);
      throw error;
    }
  }

  async removeAttendee(eventId: number, userId: number) {
    try {
      const response = await firstValueFrom(
        this.apollo.mutate<RemoveAttendeeResponse>({
          mutation: REMOVE_ATTENDEE,
          variables: {
            eventId,
            userId
          },
          refetchQueries: [{ query: GET_ALL_EVENTS }]
        })
      );
      return response.data?.removeAttendee.event;
    } catch (error) {
      // console.error('Erreur lors de la suppression du participant:', error);
      throw error;
    }
  }
}