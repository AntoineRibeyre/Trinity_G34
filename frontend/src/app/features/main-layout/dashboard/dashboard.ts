import {Component, OnInit, OnDestroy, inject, HostListener} from '@angular/core';
import {Subscription} from 'rxjs';
import {PointService} from '../../../services/point.service';
import {Router} from '@angular/router';
import {UserService} from '../../../services/user.service';
import { User } from '../../../models/user.model';
import {HistoricalColumn} from '../../../shared/components/historical-column/historical-column';
import {TeamColumn} from '../../../shared/components/team-column/team-column';
import {MatDialog} from '@angular/material/dialog';
import {DropdownOption} from '../../../shared/components/basic-dropdown/basic-dropdown';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {PendingDay, TodayCalendar} from '../../../services/service-interfaces';
import { TeamService } from '../../../services/team.service';
import { ActivityService, ActivityState } from '../../../services/activity.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    HistoricalColumn,
    TeamColumn,
    TranslatePipe,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {
  //Horloge
  date: Date = new Date();
  day: string = '';
  month: string = '';
  year: string = '';
  hour: string = '';
  minute: string = '';
  second: string = '';
  dayOfWeek: string = '';
  currentUser: User | null = null;

  private translateService: TranslateService = inject(TranslateService);

  private dayNames = [
    this.translateService.instant('DASHBOARD.SUNDAY'),
    this.translateService.instant('DASHBOARD.MONDAY'),
    this.translateService.instant('DASHBOARD.TUESDAY'),
    this.translateService.instant('DASHBOARD.WEDNESDAY'),
    this.translateService.instant('DASHBOARD.THURSDAY'),
    this.translateService.instant('DASHBOARD.FRIDAY'),
    this.translateService.instant('DASHBOARD.SATURDAY')
  ];
  private monthNames = [
    this.translateService.instant('DASHBOARD.JANUARY'),
    this.translateService.instant('DASHBOARD.FEBRUARY'),
    this.translateService.instant('DASHBOARD.MARCH'),
    this.translateService.instant('DASHBOARD.APRIL'),
    this.translateService.instant('DASHBOARD.MAY'),
    this.translateService.instant('DASHBOARD.JUNE'),
    this.translateService.instant('DASHBOARD.JULY'),
    this.translateService.instant('DASHBOARD.AUGUST'),
    this.translateService.instant('DASHBOARD.SEPTEMBER'),
    this.translateService.instant('DASHBOARD.OCTOBER'),
    this.translateService.instant('DASHBOARD.NOVEMBER'),
    this.translateService.instant('DASHBOARD.DECEMBER'),
  ]

  public intervalId: any;

  //Pointage
  userId: number | null = null;
  username: string | null = null;
  pendingDay: PendingDay | null = null;
  dureeActuelle: string = '00:00:00';
  dureeTotaleJournee: string = '00:00:00';
  isPointeArrivee: boolean = false;
  todayCalendars: TodayCalendar[] = [];
  isLoading: boolean = false;
  error: any;
  isTelework: boolean = false; // false = Présentiel, true = Télétravail
  //TEMP
  dropdownOptions: DropdownOption[] = [
    { label: 'Ryan Wittert', value: 1 },
    { label: 'Antoine Ribeyre ', value: 2 },
    { label: 'Joan Guillard', value: 3 }
  ];

  private dureeSubscription?: Subscription;
  private dureeTotaleSubscription?: Subscription;
  private activitySubscription?: Subscription;

  // État du pointage automatique
  isAutoPointageEnabled: boolean = true;
  isUserCurrentlyActive: boolean = true;
  private hasAutoPointedOnInit: boolean = false;

  constructor(
    private pointService: PointService,
    private userService: UserService,
    private dialog : MatDialog,
    private teamService: TeamService,
    private router: Router,
    private activityService: ActivityService
  ) {}

  async ngOnInit() {
    this.currentUser = await this.userService.loadCurrentUserFromServer();
    if (this.currentUser){
      this.userId = Number(this.currentUser.id);
      this.username = this.currentUser.username;
    }

    this.updateTime();
    this.intervalId = setInterval(() => {
      this.updateTime();
    }, 1000);

    this.chargerJourneeEnCours();
    this.loadTodayCalendars();
    
    // Initialiser le suivi d'activité et le pointage automatique
    this.initAutoPointage();
  }

  /**
   * Initialise le système de pointage automatique basé sur l'activité utilisateur
   */
  private initAutoPointage(): void {
    // Pointer automatiquement à l'arrivée sur le dashboard (connexion)
    this.autoPointerArrivee();

    // S'abonner aux changements d'état d'activité
    this.activitySubscription = this.activityService.getActivityState().subscribe(
      (state: ActivityState) => {
        this.handleActivityChange(state);
      }
    );
  }

  /**
   * Gère les changements d'état d'activité de l'utilisateur
   */
  private handleActivityChange(state: ActivityState): void {
    const wasActive = this.isUserCurrentlyActive;
    this.isUserCurrentlyActive = state.isActive;

    if (!this.isAutoPointageEnabled) return;

    if (wasActive && !state.isActive) {
      // L'utilisateur devient inactif après 60 secondes -> pointer sortie
      console.log('Utilisateur inactif, pointage sortie automatique');
      this.autoPointerSortie();
    } else if (!wasActive && state.isActive) {
      // L'utilisateur redevient actif -> pointer arrivée et relancer le compteur
      console.log('Utilisateur redevenu actif, pointage arrivée automatique');
      this.autoPointerArrivee();
      // Relancer le calcul du temps de travail même si le navigateur n'a pas le focus
      this.loadTodayCalendars();
    }
  }

  /**
   * Pointer arrivée automatiquement si pas déjà pointé
   */
  private autoPointerArrivee(): void {
    if (!this.userId) return;
    
    // Vérifier d'abord si on n'est pas déjà pointé
    this.pointService.getPendingDay(this.userId).subscribe({
      next: (day) => {
        if (!day) {
          // Pas de pointage en cours, on pointe l'arrivée
          this.pointerArrivee();
          console.log('Pointage arrivée automatique effectué');
        } else {
          console.log('Déjà pointé, pas de pointage automatique');
          this.isPointeArrivee = true;
          // Relancer le calcul du temps même si déjà pointé
          this.demarrerCalculDureeTotale();
        }
        this.hasAutoPointedOnInit = true;
      },
      error: (err) => console.error('Erreur vérification pointage:', err)
    });
  }

  /**
   * Pointer sortie automatiquement si actuellement pointé
   */
  private autoPointerSortie(): void {
    if (!this.userId || !this.isPointeArrivee) return;
    
    this.pointerSortie();
    console.log('Pointage sortie automatique effectué (inactivité)');
  }

  updateTime() {
    this.date = new Date();

    this.year = this.date.getFullYear().toString();
    this.month = this.monthNames[this.date.getMonth()];
    this.day = this.padZero(this.date.getDate());
    this.hour = this.padZero(this.date.getHours());
    this.minute = this.padZero(this.date.getMinutes());
    this.second = this.padZero(this.date.getSeconds());
    this.dayOfWeek = this.dayNames[this.date.getDay()];
  }

  // Fonction pour ajouter un zéro devant si < 10
  padZero(value: number): string {
    return value < 10 ? '0' + value : value.toString();
  }

  //Pointage
  chargerJourneeEnCours(): void {
    if (!this.userId) return;

    this.pointService.getPendingDay(this.userId).subscribe({
      next: (day) => {
        if (day) {
          this.pendingDay = day;
          this.isPointeArrivee = true;
        } else {
          this.isPointeArrivee = false;
        }
      },
      error: (err) => console.error('Erreur lors du chargement:', err)
    });
  }

  loadTodayCalendars(): void {
    if (!this.userId) {
      console.warn('Pas d\'userId disponible');
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.pointService.getTodayCalendar(this.userId).subscribe({
      next: (data) => {
        this.todayCalendars = data;
        this.demarrerCalculDureeTotale();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des données';
        console.error('Erreur:', error);
        this.isLoading = false;
      }
    });
  }

  private demarrerCalculDureeTotale(): void {
    // Nettoyer l'ancienne subscription si elle existe
    this.dureeTotaleSubscription?.unsubscribe();

    // Lancer le calcul en temps réel
    this.dureeTotaleSubscription = this.pointService
      .calculerDureeTotaleJournee(this.todayCalendars)
      .subscribe(duree => {
        this.dureeTotaleJournee = duree;
      });

    // Mettre à jour l'état "pointé arrivée"
    const ongoingCalendar = this.todayCalendars.find(cal => !cal.dayOver);
    this.isPointeArrivee = !!ongoingCalendar;

    // Calculer aussi la durée de la période en cours
    if (ongoingCalendar) {
      this.dureeSubscription?.unsubscribe();
      const dateDebut = new Date(ongoingCalendar.begin);
      this.dureeSubscription = this.pointService
        .calculerDureeEnTempsReel(dateDebut)
        .subscribe(duree => {
          this.dureeActuelle = duree;
        });
    }
  }

  pointerArrivee(): void {
    if (!this.userId) return;
    this.pointService.enregistrerArrivee(this.userId).subscribe({
      next: (result) => {
        this.loadTodayCalendars();
      },
      error: (err) => console.error('Erreur pointage arrivée:', err)
    });
  }

  pointerSortie(): void {
    if (!this.userId) return;

    this.pointService.enregistrerSortie(this.userId).subscribe({
      next: (result) => {
        this.loadTodayCalendars();
        this.isPointeArrivee = false;
        this.dureeActuelle = '00:00';
      },
      error: (err) => console.error('Erreur pointage sortie:', err)
    });
  }

  /**
   * Rafraîchit le temps de travail quand la page redevient visible
   * Compense le throttling des timers en arrière-plan
   */
  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (!document.hidden) {
      console.log('[Dashboard] Page visible - rafraîchissement du temps de travail');
      // Redémarrer le calcul de durée totale pour afficher le temps correct
      this.demarrerCalculDureeTotale();
    }
  }

  /**
   * Rafraîchit le temps de travail quand la fenêtre reprend le focus
   */
  @HostListener('window:focus')
  onWindowFocus(): void {
    console.log('[Dashboard] Focus fenêtre - rafraîchissement du temps de travail');
    // Redémarrer le calcul de durée totale pour afficher le temps correct
    this.demarrerCalculDureeTotale();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.dureeSubscription?.unsubscribe();
    this.dureeTotaleSubscription?.unsubscribe();
    this.activitySubscription?.unsubscribe();
  }

  getAvatarPath(): string {
    if (!this.currentUser) {
      return 'assets/avatar/avatar-1.svg';
    }

    const key = `avatar_${this.currentUser.id}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      const id = Number(saved);
      if (id >= 1 && id <= 18) {
        return `assets/avatar/avatar-${id}.svg`;
      }
    }

    const seed =
      this.currentUser.id ||
      this.currentUser.email ||
      `${this.currentUser.firstName}${this.currentUser.lastName}`;

    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % 18 + 1;
    return `assets/avatar/avatar-${index}.svg`;
  }

  toggleWorkMode(): void {
    this.isTelework = !this.isTelework;
    // TODO: Implémenter la logique de changement de mode de travail
  }
}
