import {Injectable} from '@angular/core';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {catchError, Observable, throwError} from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class PointService {

  // Mutation pour enregistrer l'arrivée
  private ENREGISTRER_ARRIVEE_MUTATION = gql`
    mutation EnregistrerArrivee {
      enregistrerArrivee {
        success
        message
        calendrier {
          dateTimeData {
            hour
            minute
            second
            year
            month
            day
          }
        }
      }
    }
  `;

  // Mutation pour enregistrer la sortie
  private ENREGISTRER_SORTIE_MUTATION = gql`
    mutation EnregistrerSortie {
      enregistrerSortie {
        success
        message
        calendrier {
          dateTimeData {
            hour
            minute
            second
            year
            month
            day
          }
          dureeData {
            hours
            minutes
            seconds
          }
        }
      }
    }
  `;

  constructor(private apollo: Apollo) {}

  /**
   * Enregistre l'arrivée de l'utilisateur
   */
  enregistrerArrivee(): Observable<PointageResponse> {
    return this.apollo.mutate({
      mutation: this.ENREGISTRER_ARRIVEE_MUTATION
    }).pipe(
      map((result: any) => {
        const data = result?.data?.enregistrerArrivee;
        return {
          success: data?.success || false,
          message: data?.message || 'Erreur inconnue',
          calendrier: data?.calendrier || null
        };
      }),
      catchError((error) => {
        console.error('Erreur lors de l\'enregistrement de l\'arrivée:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Enregistre la sortie de l'utilisateur
   */
  enregistrerSortie(): Observable<PointageResponse> {
    return this.apollo.mutate({
      mutation: this.ENREGISTRER_SORTIE_MUTATION
    }).pipe(
      map((result: any) => {
        const data = result?.data?.enregistrerSortie;
        return {
          success: data?.success || false,
          message: data?.message || 'Erreur inconnue',
          calendrier: data?.calendrier || null
        };
      }),
      catchError((error) => {
        console.error('Erreur lors de l\'enregistrement de la sortie:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Formate les données de date/heure pour l'affichage
   */
  formatDateTime(dateTimeData: DateTimeData): string {
    const { day, month, year, hour, minute, second } = dateTimeData;
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year} à ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
  }

  /**
   * Formate la durée pour l'affichage
   */
  formatDuree(dureeData: DureeData): string {
    const { hours, minutes, seconds } = dureeData;
    return `${hours}h ${minutes.toString().padStart(2, '0')}min ${seconds.toString().padStart(2, '0')}s`;
  }

  /**
   * Crée un objet Date JavaScript à partir de DateTimeData
   */
  toDate(dateTimeData: DateTimeData): Date {
    return new Date(
      dateTimeData.year,
      dateTimeData.month - 1, // Les mois en JS commencent à 0
      dateTimeData.day,
      dateTimeData.hour,
      dateTimeData.minute,
      dateTimeData.second
    );
  }
}
