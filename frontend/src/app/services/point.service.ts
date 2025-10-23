import {Injectable} from '@angular/core';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {catchError, interval, Observable, of, startWith, throwError} from 'rxjs';
import {map} from 'rxjs/operators';
import {TodayCalendars} from './service-interfaces';

const GET_PENDING_DAY = gql`
  query GetPendingDay($userId: Int!) {
    pendingDay(userId: $userId) {
      id
      begin
      end
      dayType
      duration
      dayOver
    }
  }
`;

const TODAY_CALENDARS_QUERY = gql`
  query TodayCalendars($userId: Int!) {
    todayCalendars(userId: $userId) {
      id
      begin
      end
      dayType
      dayOver
      duration
      durationFormatted
      employee {
        id
        username
        firstName
        lastName
      }
    }
  }
`;

export const GET_CURRENT_MONTH_WORK = gql`
  query GetCurrentMonthWork($userId: Int!) {
    currentMonthWork(userId: $userId) {
      date
      dayNumber
      firstCheckInTime
      lastCheckOutTime
      totalDurationFormatted
    }
  }
`;

const REGISTER_ARRIVAL = gql`
  mutation RegisterArrival($userId: Int!) {
    registerArrival(userId: $userId) {
      datetimeField
      durationField
    }
  }
`;

const REGISTER_END = gql`
  mutation RegisterEnd($userId: Int!) {
    registerEnd(userId: $userId) {
      datetimeField
      durationField
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class PointService {
  constructor(private apollo: Apollo) {}

  // Récupérer la journée en cours
  getPendingDay(userId: Number): Observable<any> {
    return this.apollo.query({
      query: GET_PENDING_DAY,
      variables: { userId },
      fetchPolicy: 'network-only' // Force la récupération depuis le serveur
    }).pipe(
      map((result: any) => result.data.pendingDay)
    );
  }

  getTodayCalendar(userId: Number): Observable<TodayCalendars[]> {
    return this.apollo.query({
      query: TODAY_CALENDARS_QUERY,
      variables: { userId },
      fetchPolicy: 'network-only'
    }).pipe(
      map((result: any) => {
        return result.data.todayCalendars || [];
      }),
      catchError(error => {
        console.error('Erreur GraphQL:', error);
        return of([]);
      })
    );
  }

  getMonthCalendar(userId: Number): Observable<any> {
    return this.apollo.query({
      query: GET_CURRENT_MONTH_WORK,
      variables: { userId },
      fetchPolicy: 'network-only'
    }).pipe(
      map((result: any) => {
        return result.data.currentMonthWork || [];
      })
    )
  }

  calculerDureeTotaleJournee(calendars: any[]): Observable<string> {
    if (!calendars || calendars.length === 0) {
      return of('00:00:00');
    }

    return interval(1000).pipe(
      map(() => {
        let totalSeconds = 0;

        // 1. Additionner toutes les durées des périodes terminées
        calendars.forEach(calendar => {
          if (calendar.duration) {
            totalSeconds += calendar.duration; // durée en secondes
          }
        });

        // 2. Si une période est en cours (dayOver = false), ajouter le temps écoulé
        const ongoingCalendar = calendars.find(cal => !cal.dayOver);
        if (ongoingCalendar && ongoingCalendar.begin) {
          const now = new Date();
          const begin = new Date(ongoingCalendar.begin);
          const elapsedSeconds = Math.floor((now.getTime() - begin.getTime()) / 1000);
          totalSeconds += elapsedSeconds;
        }

        // 3. Formater en HH:MM:SS
        return this.formatSecondsToTime(totalSeconds);
      })
    );
  }

  private formatSecondsToTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${this.padZero(hours)}:${this.padZero(minutes)}:${this.padZero(seconds)}`;
  }

  private padZero(value: number): string {
    return value < 10 ? '0' + value : value.toString();
  }

  enregistrerArrivee(userId: Number): Observable<any> {
    return this.apollo.mutate({
      mutation: REGISTER_ARRIVAL,
      variables: { userId }
    }).pipe(
      map((result: any) => result.data.registerArrival)
    );
  }

  enregistrerSortie(userId: Number): Observable<any> {
    return this.apollo.mutate({
      mutation: REGISTER_END,
      variables: { userId }
    }).pipe(
      map((result: any) => result.data.registerEnd)
    );
  }

  // Calculer la durée en temps réel
  calculerDureeEnTempsReel(dateDebut: Date): Observable<string> {
    return interval(1000).pipe(
      startWith(0),
      map(() => {
        const maintenant = new Date();
        const diffMs = maintenant.getTime() - dateDebut.getTime();

        const heures = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        // const secondes = Math.floor((diffMs % (1000 * 60)) / 1000);

        return `${this.pad(heures)}:${this.pad(minutes)}`;
      })
    );
  }

  private pad(num: number): string {
    return num.toString().padStart(2, '0');
  }
}
