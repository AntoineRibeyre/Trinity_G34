import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, fromEvent, merge } from 'rxjs';
import { debounceTime, takeUntil, distinctUntilChanged } from 'rxjs/operators';

export interface ActivityState {
  isActive: boolean;
  lastActivityTime: Date;
  inactiveSeconds: number;
  /** Indique si le Service Worker est utilisé */
  usingServiceWorker?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService implements OnDestroy {
  // Timeout d'inactivité - 60 secondes sans activité
  private readonly INACTIVITY_TIMEOUT_MS = 60 * 1000; // 60 secondes
  private readonly CHECK_INTERVAL_MS = 1000; // Vérifier toutes les secondes
  // Intervalle de ping du Service Worker pour vérifier l'état même en arrière-plan
  private readonly WORKER_PING_INTERVAL_MS = 5000;

  private destroy$ = new Subject<void>();
  private activityState$ = new BehaviorSubject<ActivityState>({
    isActive: true,
    lastActivityTime: new Date(),
    inactiveSeconds: 0,
    usingServiceWorker: false
  });

  private lastActivityTime: Date = new Date();
  private isActive: boolean = true;
  private checkInterval: any;
  private workerPingInterval: any;
  
  // Service Worker
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private isServiceWorkerActive: boolean = false;

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
    this.initServiceWorker();
    this.initActivityListeners();
    this.startInactivityCheck();
  }

  /**
   * Initialise le Service Worker pour la détection d'activité en arrière-plan
   */
  private async initServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('[ActivityService] Service Worker non supporté');
      return;
    }

    try {
      // Enregistrer le Service Worker
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/activity-worker.js', {
        scope: '/'
      });

      console.log('[ActivityService] Service Worker enregistré');

      // Attendre que le Service Worker soit actif
      const sw = this.serviceWorkerRegistration.active || 
                 this.serviceWorkerRegistration.waiting || 
                 this.serviceWorkerRegistration.installing;

      if (sw) {
        await this.waitForServiceWorker(sw);
      }

      // Écouter les messages du Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });

      // Initialiser le Service Worker pour la synchronisation entre onglets
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'INIT' });
        this.isServiceWorkerActive = true;
        
        // Démarrer le ping périodique pour récupérer l'état même en arrière-plan
        this.startWorkerPing();
        
        console.log('[ActivityService] Service Worker actif pour la détection en arrière-plan');
      }

    } catch (error) {
      console.error('[ActivityService] Erreur enregistrement Service Worker:', error);
    }
  }

  /**
   * Attend que le Service Worker soit prêt
   */
  private waitForServiceWorker(sw: ServiceWorker): Promise<void> {
    return new Promise((resolve) => {
      if (sw.state === 'activated') {
        resolve();
        return;
      }

      sw.addEventListener('statechange', () => {
        if (sw.state === 'activated') {
          resolve();
        }
      });
    });
  }

  /**
   * Démarre le ping périodique du Service Worker
   */
  private startWorkerPing(): void {
    this.workerPingInterval = setInterval(() => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'PING' });
      }
    }, this.WORKER_PING_INTERVAL_MS);
  }

  /**
   * Gère les messages reçus du Service Worker
   */
  private handleServiceWorkerMessage(data: any): void {
    this.ngZone.run(() => {
      switch (data.type) {
        case 'ACTIVITY_CHANGE':
          // Changement d'activité reçu d'un autre onglet via le Service Worker
          const payload = data.payload;
          console.log('[ActivityService] Changement d\'activité reçu du Worker:', payload);
          
          const wasActive = this.isActive;
          this.isActive = payload.isActive;
          
          if (this.isActive) {
            this.lastActivityTime = new Date();
          }
          
          // Émettre le changement d'état seulement si c'est un vrai changement
          if (wasActive !== this.isActive) {
            console.log('[ActivityService] État changé via Worker:', this.isActive ? 'ACTIF' : 'INACTIF');
            this.emitState();
          }
          break;

        case 'PONG':
        case 'STATE_RESPONSE':
          // Réponse à un ping - vérifier si l'état a changé
          // IMPORTANT: Ne pas réactiver l'utilisateur si on a détecté une inactivité localement
          // car le Worker peut avoir un état obsolète
          const state = data.payload;
          // Seulement traiter si le Worker indique une inactivité (plus fiable)
          // ou si on n'a pas détecté d'inactivité localement
          if (!state.isActive && this.isActive) {
            // Le Worker dit inactif et on pensait actif -> accepter
            console.log('[ActivityService] Synchronisation état depuis Worker (inactif):', state);
            this.isActive = false;
            this.emitState();
          }
          // Ignorer si le Worker dit actif mais on a déjà détecté une inactivité
          // L'activation ne doit venir que d'une vraie activité utilisateur (souris, clavier)
          break;

        case 'INIT_RESULT':
          console.log('[ActivityService] Service Worker initialisé:', data.payload.success);
          break;
      }
    });
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
    const oldTime = this.lastActivityTime;
    this.lastActivityTime = new Date();
    
    if (!this.isActive) {
      this.isActive = true;
      console.log('[ActivityService] Utilisateur redevenu actif - lastActivityTime réinitialisé:', this.lastActivityTime);
      this.emitState();
      this.sendStateToServiceWorker();
    } else {
      // Déjà actif, juste réinitialiser le timer silencieusement
      console.log('[ActivityService] Timer réinitialisé - dernière activité:', this.lastActivityTime);
    }
  }

  /**
   * Initialise les écouteurs d'événements pour détecter l'activité
   */
  private initActivityListeners(): void {
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
   * Cette méthode est appelée toutes les secondes
   */
  private checkInactivity(): void {
    const now = new Date();
    const inactiveMs = now.getTime() - this.lastActivityTime.getTime();
    const inactiveSeconds = Math.floor(inactiveMs / 1000);

    // Log périodique pour debug (toutes les 10 secondes)
    if (inactiveSeconds > 0 && inactiveSeconds % 10 === 0) {
      console.log('[ActivityService] Check inactivité - secondes écoulées:', inactiveSeconds, '/ isActive:', this.isActive);
    }

    // Vérifier le timeout d'inactivité (60 secondes)
    if (inactiveMs >= this.INACTIVITY_TIMEOUT_MS && this.isActive) {
      this.isActive = false;
      console.log('[ActivityService] Utilisateur inactif après', inactiveSeconds, 'secondes');
      this.emitState();
      this.sendStateToServiceWorker();
    }

    // Mettre à jour le compteur d'inactivité pour l'état (uniquement si changement)
    const currentState = this.activityState$.getValue();
    const shouldUpdate = !this.isActive || inactiveSeconds !== currentState.inactiveSeconds;
    
    if (shouldUpdate) {
      this.activityState$.next({
        isActive: this.isActive,
        lastActivityTime: this.lastActivityTime,
        inactiveSeconds: inactiveSeconds,
        usingServiceWorker: this.isServiceWorkerActive
      });
    }
  }

  /**
   * Envoie l'état actuel au Service Worker
   */
  private sendStateToServiceWorker(): void {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'STATE_UPDATE',
        payload: {
          isActive: this.isActive
        }
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
      inactiveSeconds: Math.floor(inactiveMs / 1000),
      usingServiceWorker: this.isServiceWorkerActive
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    if (this.workerPingInterval) {
      clearInterval(this.workerPingInterval);
    }
  }
}
