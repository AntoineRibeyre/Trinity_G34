import {Injectable} from '@angular/core';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {catchError, interval, Observable, startWith, throwError} from 'rxjs';
import {map} from 'rxjs/operators';

export interface DateTimeData {
  hour: number;
  minute: number;
  second: number;
  year: number;
  month: number;
  day: number;
}

export interface DureeData {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface CalendrierData {
  dateTimeData: DateTimeData;
  dureeData?: DureeData | null;
}

export interface PointageResponse {
  success: boolean;
  message: string;
  calendrier: CalendrierData | null;
}

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
  getPendingDay(userId: number): Observable<any> {
    return this.apollo.query({
      query: GET_PENDING_DAY,
      variables: { userId },
      fetchPolicy: 'network-only' // Force la récupération depuis le serveur
    }).pipe(
      map((result: any) => result.data.pendingDay)
    );
  }

  enregistrerArrivee(userId: number): Observable<any> {
    return this.apollo.mutate({
      mutation: REGISTER_ARRIVAL,  // ✅ mutation (pas query)
      variables: { userId }
    }).pipe(
      map((result: any) => result.data.registerArrival)
    );
  }

  enregistrerSortie(userId: number): Observable<any> {
    return this.apollo.mutate({
      mutation: REGISTER_END,  // ✅ mutation (pas query)
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
