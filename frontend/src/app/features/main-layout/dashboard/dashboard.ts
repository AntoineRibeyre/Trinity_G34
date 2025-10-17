import { Component, OnInit, OnDestroy } from '@angular/core';
import {Subscription} from 'rxjs';
import {PointService} from '../../../services/point.service';
import {DatePipe} from '@angular/common';
import {AuthService} from '../../../services/auth.service';
import {HistoricalColumn} from '../../../shared/components/historical-column/historical-column';

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    HistoricalColumn
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

  private dayNames = [
    'Dimanche',
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi'
  ];
  private monthNames = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Aout',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ]

  private intervalId: any;

  //Pointage
  userId: number | null = null;
  username: string | null = null;
  pendingDay: any = null;
  dureeActuelle: string = '00:00:00';
  dureeTotaleJournee: string = '00:00:00';
  isPointeArrivee: boolean = false;
  todayCalendars: any[] = [];
  isLoading: boolean = false;
  error: any;

  private dureeSubscription?: Subscription;
  private dureeTotaleSubscription?: Subscription;

  constructor(private pointService: PointService,
              private authService: AuthService,
              ) {}

  ngOnInit() {
    this.userId = this.authService.getUserId();
    this.username = this.authService.getUsername();

    this.updateTime();
    this.intervalId = setInterval(() => {
      this.updateTime();
    }, 1000);

    this.chargerJourneeEnCours();
    this.loadTodayCalendars();
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
        console.log('Calendriers du jour chargés:', this.todayCalendars);

        // ✅ Démarrer le calcul de la durée totale en temps réel
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
    console.log('pointer arrivee', this.userId);
    if (!this.userId) return;
    this.pointService.enregistrerArrivee(this.userId).subscribe({
      next: (result) => {
        console.log('Arrivée enregistrée:', result);
        this.loadTodayCalendars();
      },
      error: (err) => console.error('Erreur pointage arrivée:', err)
    });
  }

  pointerSortie(): void {
    if (!this.userId) return;

    this.pointService.enregistrerSortie(this.userId).subscribe({
      next: (result) => {
        console.log('Sortie enregistrée:', result);
        this.loadTodayCalendars();
        this.isPointeArrivee = false;
        this.dureeActuelle = '00:00';
      },
      error: (err) => console.error('Erreur pointage sortie:', err)
    });
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.dureeSubscription?.unsubscribe();
  }
}
