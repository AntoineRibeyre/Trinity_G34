import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, fromEvent, merge } from 'rxjs';
import { debounceTime, takeUntil, distinctUntilChanged } from 'rxjs/operators';

export interface ActivityState {
  isActive: boolean;
  lastActivityTime: Date;
  inactiveSeconds: number;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService implements OnDestroy {
  // Timeout d'inactivité : 5 secondes pour les tests, 5 * 60 * 1000 pour 5 minutes en production
  private readonly INACTIVITY_TIMEOUT_MS = 5 * 1000;
  private readonly CHECK_INTERVAL_MS = 1000; // Vérifier toutes les secondes

  private destroy$ = new Subject<void>();
  private activityState$ = new BehaviorSubject<ActivityState>({
    isActive: true,
    lastActivityTime: new Date(),
    inactiveSeconds: 0
  });

  private lastActivityTime: Date = new Date();
  private isActive: boolean = true;
  private checkInterval: any;

  // Événements utilisateur à surveiller
  private readonly ACTIVITY_EVENTS = [
    'mousedown',
    'mousemove',
    'keydown',
    'scroll',
    'touchstart',
    'click',
    'wheel'
  ];

  constructor(private ngZone: NgZone) {
    this.initActivityListeners();
    this.startInactivityCheck();
  }

  /**
   * Observable pour écouter les changements d'état d'activité
   */
  getActivityState(): Observable<ActivityState> {
    return this.activityState$.asObservable().pipe(
      distinctUntilChanged((prev, curr) => prev.isActive === curr.isActive)
    );
  }

  /**
   * Retourne l'état actuel d'activité
   */
  getCurrentState(): ActivityState {
    return this.activityState$.getValue();
  }

  /**
   * Vérifie si l'utilisateur est actuellement actif
   */
  isUserActive(): boolean {
    return this.isActive;
  }

  /**
   * Réinitialise le timer d'inactivité (appelé lors d'une activité utilisateur)
   */
  resetActivityTimer(): void {
    this.lastActivityTime = new Date();
    
    if (!this.isActive) {
      this.isActive = true;
      console.log('[ActivityService] Utilisateur redevenu actif');
      this.emitState();
    }
  }

  /**
   * Initialise les écouteurs d'événements pour détecter l'activité
   */
  private initActivityListeners(): void {
    console.log('[ActivityService] Initialisation des écouteurs d\'activité');
    
    // Exécuter en dehors de la zone Angular pour éviter les détections de changement excessives
    this.ngZone.runOutsideAngular(() => {
      const activityEvents$ = this.ACTIVITY_EVENTS.map(event => 
        fromEvent(document, event, { passive: true, capture: true })
      );

      // Écouter aussi sur window pour capturer plus d'événements
      const windowEvents$ = this.ACTIVITY_EVENTS.map(event => 
        fromEvent(window, event, { passive: true, capture: true })
      );

      merge(...activityEvents$, ...windowEvents$)
        .pipe(
          debounceTime(50), // Réduire le debounce pour une meilleure réactivité
          takeUntil(this.destroy$)
        )
        .subscribe((event) => {
          this.ngZone.run(() => {
            console.log('[ActivityService] Activité détectée:', (event as Event).type);
            this.resetActivityTimer();
          });
        });

      // Écouter aussi les événements de visibilité de la page
      fromEvent(document, 'visibilitychange')
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.ngZone.run(() => {
            if (!document.hidden) {
              console.log('[ActivityService] Page redevenue visible');
              this.resetActivityTimer();
            }
          });
        });

      // Écouter le focus de la fenêtre
      fromEvent(window, 'focus')
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.ngZone.run(() => {
            console.log('[ActivityService] Fenêtre a reçu le focus');
            this.resetActivityTimer();
          });
        });
    });
  }

  /**
   * Démarre la vérification périodique de l'inactivité
   */
  private startInactivityCheck(): void {
    this.ngZone.runOutsideAngular(() => {
      this.checkInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.checkInactivity();
        });
      }, this.CHECK_INTERVAL_MS);
    });
  }

  /**
   * Vérifie si l'utilisateur est inactif
   */
  private checkInactivity(): void {
    const now = new Date();
    const inactiveMs = now.getTime() - this.lastActivityTime.getTime();
    const inactiveSeconds = Math.floor(inactiveMs / 1000);

    if (inactiveMs >= this.INACTIVITY_TIMEOUT_MS && this.isActive) {
      this.isActive = false;
      console.log('[ActivityService] Utilisateur inactif après', inactiveSeconds, 'secondes');
      this.emitState();
    }

    // Mettre à jour le compteur d'inactivité
    if (!this.isActive || inactiveSeconds !== this.activityState$.getValue().inactiveSeconds) {
      this.activityState$.next({
        isActive: this.isActive,
        lastActivityTime: this.lastActivityTime,
        inactiveSeconds: inactiveSeconds
      });
    }
  }

  /**
   * Émet le nouvel état d'activité
   */
  private emitState(): void {
    const now = new Date();
    const inactiveMs = now.getTime() - this.lastActivityTime.getTime();

    this.activityState$.next({
      isActive: this.isActive,
      lastActivityTime: this.lastActivityTime,
      inactiveSeconds: Math.floor(inactiveMs / 1000)
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}
