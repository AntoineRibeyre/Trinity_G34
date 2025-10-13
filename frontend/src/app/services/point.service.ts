import {Injectable} from '@angular/core';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {catchError, interval, Observable, throwError} from 'rxjs';
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

const GET_JOURNEE_EN_COURS = gql`
  query GetJourneeEnCours($userId: Int!) {
    journeeEnCours(userId: $userId) {
      id
      debut
      fin
      journeeFinie
      duree
    }
  }
`;

const POINTAGE_ARRIVEE = gql`
  query PointageArrivee($userId: Int!) {
    pointageArrivee(userId: $userId) {
      datetimeField
      durationField
    }
  }
`;

const POINTAGE_FIN = gql`
  query PointageFin($userId: Int!) {
    pointageFin(userId: $userId) {
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
  getJourneeEnCours(userId: number): Observable<any> {
    return this.apollo.query({
      query: GET_JOURNEE_EN_COURS,
      variables: { userId },
      fetchPolicy: 'network-only' // Force la récupération depuis le serveur
    }).pipe(
      map((result: any) => result.data.journeeEnCours)
    );
  }

  // Enregistrer l'arrivée
  enregistrerArrivee(userId: number): Observable<any> {
    return this.apollo.query({
      query: POINTAGE_ARRIVEE,
      variables: { userId }
    }).pipe(
      map((result: any) => result.data.pointageArrivee)
    );
  }

  // Enregistrer la sortie
  enregistrerSortie(userId: number): Observable<any> {
    return this.apollo.query({
      query: POINTAGE_FIN,
      variables: { userId }
    }).pipe(
      map((result: any) => result.data.pointageFin)
    );
  }

  // Calculer la durée en temps réel
  calculerDureeEnTempsReel(dateDebut: Date): Observable<string> {
    return interval(1000).pipe( // Mise à jour chaque seconde
      map(() => {
        const maintenant = new Date();
        const diff = maintenant.getTime() - dateDebut.getTime();

        const heures = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secondes = Math.floor((diff % (1000 * 60)) / 1000);

        return `${heures.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secondes.toString().padStart(2, '0')}`;
      })
    );
  }
}
