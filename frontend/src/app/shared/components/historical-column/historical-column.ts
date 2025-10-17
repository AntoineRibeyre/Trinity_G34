import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';

interface DayInfo {
  dayNumber: number;
  dayName: string;
  isWeekend: boolean;
  isToday: boolean;
  hours?: string; // Tu pourras ajouter les heures travaillées ici
}

@Component({
  selector: 'app-historical-column',
  imports: [CommonModule],
  templateUrl: './historical-column.html',
  styleUrl: './historical-column.css'
})
export class HistoricalColumn implements OnInit {

  private date: Date = new Date();
  month: {name: string; number: number} = {name: "", number: 0};
  days: DayInfo[] = [];

  private monthDetail: {name: string, number: number}[] = [
    { name: "Janvier", number: 31 },
    { name: "Février", number: 28 },
    { name: "Mars", number: 31 },
    { name: "Avril", number: 30 },
    { name: "Mai", number: 31 },
    { name: "Juin", number: 30 },
    { name: "Juillet", number: 31 },
    { name: "Août", number: 31 },
    { name: "Septembre", number: 30 },
    { name: "Octobre", number: 31 },
    { name: "Novembre", number: 30 },
    { name: "Décembre", number: 31 }
  ];

  private dayNames: string[] = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];

  ngOnInit(): void {
    this.date = new Date();
    const currentMonth = this.date.getMonth();
    const currentYear = this.date.getFullYear();

    // Gérer les années bissextiles
    if (currentMonth === 1 && this.isLeapYear(currentYear)) {
      this.monthDetail[1].number = 29;
    }

    this.month = this.monthDetail[currentMonth];
    this.generateDays(currentYear, currentMonth);
  }

  private isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  private generateDays(year: number, month: number): void {
    this.days = [];
    const today = this.date.getDate();

    for (let day = 1; day <= this.month.number; day++) {
      const currentDate = new Date(year, month, day);
      const dayOfWeek = currentDate.getDay();

      this.days.push({
        dayNumber: day,
        dayName: this.dayNames[dayOfWeek],
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isToday: day === today,
        hours: this.getMockHours(day) // À remplacer par tes vraies données
      });
    }
  }

  // Fonction temporaire pour simuler des données
  private getMockHours(day: number): string {
    // Tu remplaceras ça par tes vraies données depuis ton API
    if (day <= this.date.getDate() && day > this.date.getDate() - 7) {
      return '8:32';
    }
    return '';
  }
}
