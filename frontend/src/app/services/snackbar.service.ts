import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type SnackBarType = 'success' | 'error' | 'warning' | 'info';

export interface SnackBarConfig {
  message: string;
  type?: SnackBarType;
  duration?: number; // en millisecondes, 0 = pas de fermeture automatique
}

@Injectable({
  providedIn: 'root'
})
export class SnackBarService {
  private snackBarSubject = new BehaviorSubject<SnackBarConfig | null>(null);
  public snackBar$: Observable<SnackBarConfig | null> = this.snackBarSubject.asObservable();

  /**
   * Affiche une notification de succès
   */
  showSuccess(message: string, duration: number = 3000): void {
    this.show({ message, type: 'success', duration });
  }

  /**
   * Affiche une notification d'erreur
   */
  showError(message: string, duration: number = 4000): void {
    this.show({ message, type: 'error', duration });
  }

  /**
   * Affiche une notification d'avertissement
   */
  showWarning(message: string, duration: number = 3000): void {
    this.show({ message, type: 'warning', duration });
  }

  /**
   * Affiche une notification d'information
   */
  showInfo(message: string, duration: number = 3000): void {
    this.show({ message, type: 'info', duration });
  }

  /**
   * Affiche une notification personnalisée
   */
  show(config: SnackBarConfig): void {
    this.snackBarSubject.next(config);
  }

  /**
   * Ferme la notification
   */
  hide(): void {
    this.snackBarSubject.next(null);
  }
}

