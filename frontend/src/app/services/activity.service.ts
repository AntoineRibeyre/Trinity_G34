import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, fromEvent, merge } from 'rxjs';
import { debounceTime, takeUntil, distinctUntilChanged } from 'rxjs/operators';

export interface ActivityState {
  isActive: boolean;
  lastActivityTime: Date;
  inactiveSeconds: number;
  /** État de l'activité au niveau système (via Idle Detection API) */
  systemUserState?: 'active' | 'idle';
  /** État de verrouillage de l'écran */
  screenState?: 'locked' | 'unlocked';
  /** Indique si l'Idle Detection API est utilisée */
  usingIdleDetectionAPI: boolean;
  /** Indique si le Service Worker est utilisé */
  usingServiceWorker?: boolean;
}

// Déclaration TypeScript pour l'Idle Detection API (API expérimentale)
declare class IdleDetector {
  static requestPermission(): Promise<PermissionState>;
  userState: 'active' | 'idle';
  screenState: 'locked' | 'unlocked';
  onchange: ((this: IdleDetector, ev: Event) => any) | null;
  start(options: { threshold: number; signal?: AbortSignal }): Promise<void>;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService implements OnDestroy {
  // Timeout d'inactivité pour le fallback navigateur (quand Idle Detection API n'est pas disponible)
  // Note: L'Idle Detection API a un seuil minimum de 60 secondes
  private readonly INACTIVITY_TIMEOUT_MS = 60 * 1000; // 60 secondes - aligné avec l'Idle Detection API
  private readonly CHECK_INTERVAL_MS = 1000; // Vérifier toutes les secondes
  // Seuil minimum pour l'Idle Detection API (60 secondes minimum requis par l'API)
  private readonly IDLE_DETECTION_THRESHOLD_MS = 60 * 1000;
  // Intervalle de ping du Service Worker pour vérifier l'état même en arrière-plan
  private readonly WORKER_PING_INTERVAL_MS = 5000;

  private destroy$ = new Subject<void>();
  private activityState$ = new BehaviorSubject<ActivityState>({
    isActive: true,
    lastActivityTime: new Date(),
    inactiveSeconds: 0,
    usingIdleDetectionAPI: false,
    usingServiceWorker: false
  });

  private lastActivityTime: Date = new Date();
  private isActive: boolean = true;
  private checkInterval: any;
  private workerPingInterval: any;
  
  // Idle Detection API
  private idleDetector: IdleDetector | null = null;
  private idleDetectorAbortController: AbortController | null = null;
  private isIdleDetectionSupported: boolean = false;
  private systemUserState: 'active' | 'idle' = 'active';
  private screenState: 'locked' | 'unlocked' = 'unlocked';
  
  // Service Worker
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private isServiceWorkerActive: boolean = false;

  // Événements utilisateur à surveiller (fallback pour navigateurs sans Idle Detection API)
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
    this.initIdleDetection();
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

      // Initialiser l'Idle Detection dans le Service Worker
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
          this.systemUserState = payload.systemUserState;
          this.screenState = payload.screenState;
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
          const state = data.payload;
          if (state.isActive !== this.isActive) {
            console.log('[ActivityService] Synchronisation état depuis Worker:', state);
            this.systemUserState = state.systemUserState;
            this.screenState = state.screenState;
            this.isActive = state.isActive;
            if (this.isActive) {
              this.lastActivityTime = new Date();
            }
            this.emitState();
          }
          break;

        case 'INIT_RESULT':
          console.log('[ActivityService] Service Worker initialisé:', data.payload.success);
          break;
      }
    });
  }

  /**
   * Initialise l'Idle Detection API si disponible
   * Cette API permet de détecter l'activité au niveau du système d'exploitation
   */
  private async initIdleDetection(): Promise<void> {
    // Si le Service Worker gère déjà l'Idle Detection, on ne l'initialise pas ici
    if (this.isServiceWorkerActive) {
      console.log('[ActivityService] Idle Detection gérée par le Service Worker');
      return;
    }
    
    // Vérifier si l'API est disponible
    if (!('IdleDetector' in window)) {
      console.log('[ActivityService] Idle Detection API non disponible - utilisation du fallback navigateur');
      return;
    }

    try {
      // Demander la permission d'utiliser l'API
      const permission = await (window as any).IdleDetector.requestPermission();
      
      if (permission !== 'granted') {
        console.log('[ActivityService] Permission Idle Detection refusée - utilisation du fallback navigateur');
        return;
      }

      this.isIdleDetectionSupported = true;
      this.idleDetectorAbortController = new AbortController();

      this.idleDetector = new (window as any).IdleDetector();
      
      this.idleDetector!.onchange = () => {
        this.ngZone.run(() => {
          this.handleIdleDetectorChange();
        });
      };

      // Démarrer la détection avec un seuil minimum de 60 secondes (requis par l'API)
      await this.idleDetector!.start({
        threshold: this.IDLE_DETECTION_THRESHOLD_MS,
        signal: this.idleDetectorAbortController.signal
      });

      console.log('[ActivityService] Idle Detection API initialisée avec succès');
      console.log('[ActivityService] Détection d\'activité au niveau système activée');
      
      // Mettre à jour l'état initial
      this.handleIdleDetectorChange();
      
    } catch (error) {
      console.error('[ActivityService] Erreur lors de l\'initialisation de l\'Idle Detection API:', error);
      this.isIdleDetectionSupported = false;
    }
  }

  /**
   * Gère les changements détectés par l'Idle Detection API
   * Cette méthode est appelée par l'événement onchange de l'IdleDetector
   */
  private handleIdleDetectorChange(): void {
    if (!this.idleDetector) return;

    const previousUserState = this.systemUserState;
    const previousScreenState = this.screenState;

    this.systemUserState = this.idleDetector.userState;
    this.screenState = this.idleDetector.screenState;

    console.log('[ActivityService] État système détecté:', {
      userState: this.systemUserState,
      screenState: this.screenState,
      timestamp: new Date().toISOString()
    });

    this.updateActivityFromIdleState();
    
    // Envoyer l'état au Service Worker pour qu'il puisse le propager
    this.sendStateToServiceWorker();
  }

  /**
   * Envoie l'état actuel au Service Worker
   */
  private sendStateToServiceWorker(): void {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'STATE_UPDATE',
        payload: {
          isActive: this.isActive,
          systemUserState: this.systemUserState,
          screenState: this.screenState
        }
      });
    }
  }

  /**
   * Met à jour l'état d'activité basé sur l'Idle Detection API
   * Appelé lors des changements et périodiquement pour compenser le throttling
   */
  private updateActivityFromIdleState(): void {
    if (!this.isIdleDetectionSupported) return;

    // L'utilisateur est considéré comme actif si :
    // - L'écran n'est pas verrouillé ET
    // - L'utilisateur n'est pas idle au niveau système
    const wasActive = this.isActive;
    const isNowActive = this.screenState === 'unlocked' && this.systemUserState === 'active';

    if (isNowActive) {
      // L'utilisateur est actif au niveau système
      // Réinitialiser lastActivityTime continuellement tant qu'il est actif
      this.lastActivityTime = new Date();
      
      if (!wasActive) {
        this.isActive = true;
        console.log('[ActivityService] Utilisateur actif au niveau système');
        this.emitState();
      }
    } else if (!isNowActive && wasActive) {
      // L'utilisateur devient inactif
      this.isActive = false;
      if (this.screenState === 'locked') {
        console.log('[ActivityService] Écran verrouillé - utilisateur considéré comme inactif');
      } else {
        console.log('[ActivityService] Utilisateur inactif au niveau système');
      }
      this.emitState();
    }
  }

  /**
   * Vérifie si l'Idle Detection API est utilisée
   */
  isUsingIdleDetectionAPI(): boolean {
    return this.isIdleDetectionSupported;
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
    
    // Si l'Idle Detection API est disponible, synchroniser avec l'état système
    if (this.isIdleDetectionSupported && this.idleDetector) {
      // Lire l'état actuel de l'API et mettre à jour les variables d'état système
      this.systemUserState = this.idleDetector.userState;
      this.screenState = this.idleDetector.screenState;
      
      // Si l'utilisateur est actif selon l'API système, utiliser updateActivityFromIdleState()
      // pour mettre à jour isActive de manière cohérente
      if (this.screenState === 'unlocked' && this.systemUserState === 'active') {
        this.updateActivityFromIdleState();
      } else {
        // Si l'API dit que l'utilisateur est inactif mais qu'une activité est détectée,
        // forcer isActive = true car l'API pourrait avoir un délai de détection
        // Cela garantit que le pointage automatique se relance immédiatement
        if (!this.isActive) {
          this.isActive = true;
          console.log('[ActivityService] Utilisateur redevenu actif (activité détectée, API en retard)');
          this.emitState();
        }
      }
      
      // Envoyer l'état au Service Worker pour synchronisation
      this.sendStateToServiceWorker();
    } else {
      // Fallback : comportement original si l'Idle Detection API n'est pas disponible
      if (!this.isActive) {
        this.isActive = true;
        console.log('[ActivityService] Utilisateur redevenu actif');
        this.emitState();
      }
    }
  }

  /**
   * Initialise les écouteurs d'événements pour détecter l'activité
   * Utilisé comme fallback si l'Idle Detection API n'est pas disponible
   * ou en complément pour une détection plus réactive
   */
  private initActivityListeners(): void {
    // console.log('[ActivityService] Initialisation des écouteurs d\'activité navigateur');
    
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
              // Synchroniser immédiatement avec l'Idle Detection API si disponible
              if (this.isIdleDetectionSupported && this.idleDetector) {
                this.systemUserState = this.idleDetector.userState;
                this.screenState = this.idleDetector.screenState;
                this.updateActivityFromIdleState();
              }
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
            // Synchroniser immédiatement avec l'Idle Detection API si disponible
            if (this.isIdleDetectionSupported && this.idleDetector) {
              this.systemUserState = this.idleDetector.userState;
              this.screenState = this.idleDetector.screenState;
              this.updateActivityFromIdleState();
            }
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
   * Cette méthode est appelée toutes les secondes mais peut être throttled par le navigateur
   */
  private checkInactivity(): void {
    const now = new Date();
    const inactiveMs = now.getTime() - this.lastActivityTime.getTime();
    const inactiveSeconds = Math.floor(inactiveMs / 1000);

    if (this.isIdleDetectionSupported) {
      // Si l'Idle Detection API est active, on synchronise l'état avec l'API
      // Cela compense le throttling du navigateur en background
      if (this.idleDetector) {
        // Re-lire l'état actuel de l'API et mettre à jour
        this.systemUserState = this.idleDetector.userState;
        this.screenState = this.idleDetector.screenState;
        this.updateActivityFromIdleState();
      }
    } else {
      // Fallback navigateur : vérifier le timeout d'inactivité
      if (inactiveMs >= this.INACTIVITY_TIMEOUT_MS && this.isActive) {
        this.isActive = false;
        console.log('[ActivityService] Utilisateur inactif (navigateur) après', inactiveSeconds, 'secondes');
        this.emitState();
      }
    }

    // Mettre à jour le compteur d'inactivité pour l'état (uniquement si changement)
    const currentState = this.activityState$.getValue();
    const shouldUpdate = !this.isActive || 
                         inactiveSeconds !== currentState.inactiveSeconds ||
                         this.systemUserState !== currentState.systemUserState ||
                         this.screenState !== currentState.screenState;
    
    if (shouldUpdate) {
      this.activityState$.next({
        isActive: this.isActive,
        lastActivityTime: this.lastActivityTime,
        inactiveSeconds: inactiveSeconds,
        systemUserState: this.systemUserState,
        screenState: this.screenState,
        usingIdleDetectionAPI: this.isIdleDetectionSupported,
        usingServiceWorker: this.isServiceWorkerActive
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
      systemUserState: this.systemUserState,
      screenState: this.screenState,
      usingIdleDetectionAPI: this.isIdleDetectionSupported,
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

    // Arrêter l'Idle Detection API
    if (this.idleDetectorAbortController) {
      this.idleDetectorAbortController.abort();
      this.idleDetectorAbortController = null;
    }
    this.idleDetector = null;
  }
}