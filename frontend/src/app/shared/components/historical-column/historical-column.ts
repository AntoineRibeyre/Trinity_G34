import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PointService} from '../../../services/point.service';
import {UserService} from '../../../services/user.service';
import {User} from '../../../models/user.model';
import {TodayCalendars} from '../../../services/service-interfaces';

interface DayInfo {
  dayNumber: number;
  dayName: string;
  isWeekend: boolean;
  isToday: boolean;
  workDay: WorkDayInfo;
}

interface WorkDayInfo {
  timeStart?: string;
  timeEnd?: string;
  timeWorked?: string;
}

@Component({
  selector: 'app-historical-column',
  imports: [CommonModule],
  templateUrl: './historical-column.html',
  styleUrl: './historical-column.css'
})
export class HistoricalColumn implements OnInit {

  constructor(private pointService: PointService,
              private userService: UserService
  ) {}

  userId: number | null = null;
  currentUser: User | null = null;
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

  currentMonthWork: TodayCalendars[] = [];
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';

  async ngOnInit() {

    try {
      this.isLoading = true;

      this.currentUser = await this.userService.loadCurrentUserFromServer();
      if (!this.currentUser) {
        throw new Error('Utilisateur non trouvé');
      }
      this.userId = Number(this.currentUser.id);

      this.date = new Date();
      const currentMonth = this.date.getMonth();
      const currentYear = this.date.getFullYear();

      if (currentMonth === 1 && this.isLeapYear(currentYear)) {
        this.monthDetail[1].number = 29;
      }

      this.month = this.monthDetail[currentMonth];

      await this.getMonthCalendar();

      this.generateDays(currentYear, currentMonth);

      this.isLoading = false;

    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      this.hasError = true;
      this.errorMessage = 'Impossible de charger les données';
      this.isLoading = false;
    }
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
        workDay: this.dayFromMonthCalendar(day)
      });
    }
  }

  private getMonthCalendar(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.userId) {
        return;
      }

      this.pointService.getMonthCalendar(this.userId).subscribe({
        next: result => {
          if (result) {
            this.currentMonthWork = result;
            resolve();
          } else {
            reject('Aucune donnée reçue');
          }
        },
        error: error => {
          console.error('❌ Erreur lors du chargement:', error);
          reject(error);
        }
      });
    });
  }

  private dayFromMonthCalendar(day: number): WorkDayInfo {
    const workDay = this.currentMonthWork.find(work => work.dayNumber === day);

    if (workDay) {
      return {
        timeStart: workDay.firstCheckInTime?.slice(0, -3),
        timeEnd: workDay.lastCheckOutTime?.slice(0, -3),
        timeWorked: workDay.totalDurationFormatted?.slice(0, -3)
      };
    }

    return {
      timeStart: undefined,
      timeEnd: undefined,
      timeWorked: undefined
    };
  }
}
