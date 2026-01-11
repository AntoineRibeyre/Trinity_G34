import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimeUtilsService {
  /**
   * Parse une chaîne de temps (format "HH:MM:SS" ou "HH:MM") en secondes
   * @param timeString La chaîne de temps à parser
   * @returns Le nombre de secondes, ou null si le parsing échoue
   */
  parseTimeStringToSeconds(timeString: string | null | undefined): number | null {
    if (!timeString) {
      return null;
    }

    try {
      const trimmed = timeString.toString().trim();
      if (trimmed === '') {
        return null;
      }

      const parts = trimmed.split(':');
      const hours = Number.parseInt(parts[0]) || 0;
      const minutes = Number.parseInt(parts[1]) || 0;
      const seconds = Number.parseInt(parts[2]) || 0;

      if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) {
        return null;
      }

      return (hours * 3600) + (minutes * 60) + seconds;
    } catch (error) {
      // console.warn('Erreur lors du parsing de timeString:', timeString, error);
      return null;
    }
  }

  /**
   * Formate des secondes en format "XhYY" (ex: "8h30")
   * @param seconds Le nombre de secondes
   * @returns La chaîne formatée (ex: "8h30")
   */
  formatSecondsToHours(seconds: number): string {
    if (seconds <= 0) {
      return '0h00';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${hours}h${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Formate des secondes en format "HH:MM"
   * @param seconds Le nombre de secondes
   * @returns La chaîne formatée (ex: "08:30")
   */
  formatSecondsToTime(seconds: number): string {
    if (seconds < 0) {
      return '--:--';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Formate une date en format "HH:MM" pour l'heure
   * @param date La date à formater
   * @returns La chaîne formatée (ex: "08:30")
   */
  formatDateToTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Calcule la moyenne d'un tableau de minutes (représentant des heures d'arrivée/départ)
   * @param timesMinutes Tableau de minutes depuis minuit
   * @returns La chaîne formatée "HH:MM" ou "--:--" si le tableau est vide
   */
  calculateAverageTime(timesMinutes: number[]): string {
    if (timesMinutes.length === 0) {
      return '--:--';
    }

    const avgMinutes = timesMinutes.reduce((a, b) => a + b, 0) / timesMinutes.length;
    const hours = Math.floor(avgMinutes / 60);
    const minutes = Math.floor(avgMinutes % 60);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Convertit une date en minutes depuis minuit (pour calculs de moyenne)
   * @param date La date à convertir
   * @returns Le nombre de minutes depuis minuit
   */
  dateToMinutes(date: Date): number {
    return date.getHours() * 60 + date.getMinutes();
  }
}

