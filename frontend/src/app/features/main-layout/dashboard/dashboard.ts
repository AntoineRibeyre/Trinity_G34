import { Component, OnInit, OnDestroy } from '@angular/core';
import {Subscription} from 'rxjs';
import {PointService} from '../../../services/point.service';
import {DatePipe} from '@angular/common';
import {AuthService} from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe
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
  journeeEnCours: any = null;
  dureeActuelle: string = '00:00:00';
  isPointeArrivee: boolean = false;

  private dureeSubscription?: Subscription;

  constructor(private pointService: PointService,
              private authService: AuthService,) {}

  ngOnInit() {
    this.userId = this.authService.getUserId();
    this.username = this.authService.getUsername();

    this.updateTime(); // Initialiser immédiatement
    this.intervalId = setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  updateTime() {
    this.date = new Date();

    this.year = this.date.getFullYear().toString();
    this.month = this.monthNames[this.date.getMonth() + 1];
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

    this.pointService.getJourneeEnCours(this.userId).subscribe({
      next: (journee) => {
        if (journee) {
          this.journeeEnCours = journee;
          this.isPointeArrivee = true;

          // Lancer le compteur en temps réel
          const dateDebut = new Date(journee.debut);
          this.dureeSubscription = this.pointService
            .calculerDureeEnTempsReel(dateDebut)
            .subscribe(duree => {
              this.dureeActuelle = duree;
            });
        } else {
          this.isPointeArrivee = false;
        }
      },
      error: (err) => console.error('Erreur lors du chargement:', err)
    });
  }

  pointerArrivee(): void {
    if (!this.userId) return;

    this.pointService.enregistrerArrivee(this.userId).subscribe({
      next: (result) => {
        console.log('Arrivée enregistrée:', result);
        this.chargerJourneeEnCours(); // Recharger après pointage
      },
      error: (err) => console.error('Erreur pointage arrivée:', err)
    });
  }

  pointerSortie(): void {
    if (!this.userId) return;

    this.pointService.enregistrerSortie(this.userId).subscribe({
      next: (result) => {
        console.log('Sortie enregistrée:', result);
        this.dureeSubscription?.unsubscribe(); // Arrêter le compteur
        this.isPointeArrivee = false;
        this.dureeActuelle = result[0].durationField || '00:00:00';
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
