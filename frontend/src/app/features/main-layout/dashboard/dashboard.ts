import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {
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

  ngOnInit() {
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

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
