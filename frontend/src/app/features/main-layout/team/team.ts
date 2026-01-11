import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TeamService, ManagerViewResponse } from '../../../services/team.service';
import { UserService } from '../../../services/user.service';
import { EmployeeDrawer } from '../../../shared/components/employee-drawer/employee-drawer';
import { User } from '../../../models/user.model';
import {DeleteDialog} from '../../../shared/components/delete-dialog/delete-dialog';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {EditTeamManager} from '../../../shared/components/edit-team-manager/edit-team-manager';
import {BasicTextButton} from '../../../shared/components/basic-text-button/basic-text-button';
import {ExportPeriodDialog} from '../../../shared/components/export-period-dialog/export-period-dialog';
import {ExcelExportService} from '../../../services/excel-export.service';
import { TimeUtilsService } from '../../../services/time-utils.service';
import { DateUtilsService } from '../../../services/date-utils.service';

interface TeamMember {
  userDetails: {
    id: number;
    firstName: string;
    lastName: string;
    role?: string;
  };
  planning: Array<{
    date: string;
    totalHours: string;
    calendar: Array<{
      id: number;
      begin: string;
      end: string;
      dayType: string;
      duration: number;
      dayOver: boolean;
    }>;
  }>;
}

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, TranslateModule, EmployeeDrawer, BasicTextButton],
  templateUrl: './team.html',
  styleUrl: './team.css'
})
export class Team implements OnInit {
  managerView: ManagerViewResponse['managerView'] | null = null;
  loading = true;
  error: string | null = null;

  // Statistiques calculées
  avgWeeklyHours: string = '0h00';
  avgMonthlyHours: string = '0h00';
  avgArrivalTime: string = '--:--';
  avgDepartureTime: string = '--:--';

  // Employee drawer
  selectedEmployee: User | undefined = undefined;
  isEmployeeDrawerOpen: boolean = false;
  allUsers: User[] = [];

  private translate: TranslateService = inject(TranslateService);
  private excelExportService: ExcelExportService = inject(ExcelExportService);

  constructor(
    private teamService: TeamService,
    private userService: UserService,
    private dialog: MatDialog,
    private timeUtils: TimeUtilsService,
    private dateUtils: DateUtilsService
  ) {}

  async ngOnInit() {
    await this.loadTeamData();
    await this.loadUsers();
  }

  async loadUsers() {
    try {
      this.allUsers = await this.userService.getAllUsers();
    } catch (error) {
      // console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  }

  async loadTeamData() {
    try {
      this.loading = true;
      this.error = null;

      // Récupérer l'ID du manager connecté
      const currentUser = this.userService.currentUser;
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      const managerId = Number.parseInt(currentUser.id);

      // Charger les données de l'équipe
      this.teamService.getManagerView(managerId).subscribe({
        next: (data) => {
          this.managerView = data;
          this.calculateStatistics();
          this.loading = false;
        },
        error: (err) => {
          // console.error('Erreur lors du chargement des données:', err);
          this.error = 'team.impossibledecharger';
          this.loading = false;
        }
      });

    } catch (err) {
      // console.error('Erreur:', err);
      this.error = 'team.erreursurvenue';
      this.loading = false;
    }
  }

  calculateStatistics() {
    if (!this.managerView || !this.managerView.members) {
      return;
    }

    const allMembers = [
      ...this.managerView.members,
      { userDetails: this.managerView.manager.userDetails, planning: this.managerView.manager.planning }
    ];

    // Calculer moyenne hebdomadaire (7 derniers jours)
    this.avgWeeklyHours = this.calculateAvgHours(allMembers, 7);

    // Calculer moyenne mensuelle (30 derniers jours)
    this.avgMonthlyHours = this.calculateAvgHours(allMembers, 30);

    // Calculer heures moyennes d'arrivée et départ
    this.calculateAvgTimes(allMembers);
  }

calculateAvgHours(members: any[], days: number): string {
  let totalSeconds = 0;
  let count = 0;

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days);

  members.forEach(member => {
    if (member.planning && Array.isArray(member.planning)) {
      member.planning.forEach((day: any) => {
        const dayDate = new Date(day.date);
        if (dayDate >= startDate && dayDate <= today && day.totalHours) {
          const seconds = this.timeUtils.parseTimeStringToSeconds(day.totalHours);
          if (seconds !== null) {
            totalSeconds += seconds;
            count++;
          }
        }
      });
    }
  });

  // Retourner 0h00 si aucune donnée
  if (count === 0 || totalSeconds === 0) {
    return '0h00';
  }

  const avgSeconds = totalSeconds / count;
  return this.timeUtils.formatSecondsToHours(avgSeconds);
}

  calculateAvgTimes(members: any[]) {
    const arrivalTimes: number[] = [];
    const departureTimes: number[] = [];

    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    members.forEach(member => {
      if (member.planning) {
        member.planning.forEach((day: any) => {
          const dayDate = new Date(day.date);
          if (dayDate >= weekAgo && dayDate <= today && day.calendar) {
            day.calendar.forEach((cal: any) => {
              if (cal.begin) {
                const beginTime = new Date(cal.begin);
                arrivalTimes.push(this.timeUtils.dateToMinutes(beginTime));
              }
              if (cal.end) {
                const endTime = new Date(cal.end);
                departureTimes.push(this.timeUtils.dateToMinutes(endTime));
              }
            });
          }
        });
      }
    });

    this.avgArrivalTime = this.timeUtils.calculateAverageTime(arrivalTimes);
    this.avgDepartureTime = this.timeUtils.calculateAverageTime(departureTimes);
  }

  getStatusClass(member: TeamMember): string {
    if (!member.planning || member.planning.length === 0) {
      return 'absent';
    }

    const today = member.planning.find(p => {
      const planDate = new Date(p.date).toDateString();
      const todayDate = new Date().toDateString();
      return planDate === todayDate;
    });

    if (!today || !today.calendar || today.calendar.length === 0) {
      return 'absent';
    }

    const hasOngoing = today.calendar.some(cal => !cal.dayOver);
    return hasOngoing ? 'present' : 'finished';
  }

  getStatusText(member: TeamMember): string {
    const status = this.getStatusClass(member);
    return `team.statuts.${status === 'present' ? 'present' : status === 'finished' ? 'termine' : 'absent'}`;
  }

  getTodayHours(member: TeamMember): string {
    if (!member.planning) return '0h00';

    const today = member.planning.find(p => {
      const planDate = new Date(p.date).toDateString();
      const todayDate = new Date().toDateString();
      return planDate === todayDate;
    });

    if (!today || !today.totalHours) return '0h00';

    // Gestion plus robuste
    const match = today.totalHours.match(/^(\d+):?(\d*)$/);

    if (!match) return '0h00';

    const hours = Number(match[1]) || 0;
    const minutes = Number(match[2]) || 0;

    return `${hours}h${minutes.toString().padStart(2, '0')}`;
  }

  getRoleTranslationKey(role?: string): string {
    const roleMap: { [key: string]: string } = {
      'manager': 'team.roles.manager',
      'employee': 'team.roles.employee',
      'admin': 'team.roles.admin'
    };
    return roleMap[role?.toLowerCase() || 'employee'] || 'team.roles.employee';
  }

  openMemberDetails(memberId: number, event: Event): void {
    event.stopPropagation();
    this.selectedEmployee = this.allUsers.find((user) => user.id === String(memberId));
    this.isEmployeeDrawerOpen = true;
  }

  closeEmployeeDrawer(): void {
    this.isEmployeeDrawerOpen = false;
    this.selectedEmployee = undefined;
  }

  export(): void {
    if (!this.managerView) {
      return;
    }

    const dialogRef = this.dialog.open(ExportPeriodDialog, {
      width: '500px',
      data: {
        title: this.translate.instant('TEAM.DIALOG.EXPORT-PERIOD.TITLE'),
        confirm: this.translate.instant('TEAM.DIALOG.EXPORT-PERIOD.CONFIRM'),
        cancel: this.translate.instant('TEAM.DIALOG.EXPORT-PERIOD.CANCEL'),
        onConfirm: (dialog: MatDialogRef<ExportPeriodDialog>, startDate: string | null, endDate: string | null) => {
          if (startDate && endDate) {
            this.performExport(startDate, endDate);
            dialog.close();
          }
        },
        onCancel: (dialog: MatDialogRef<ExportPeriodDialog>) => {
          dialog.close();
        }
      } as ExportPeriodDialog
    });
  }

  private performExport(startDateStr: string, endDateStr: string): void {
    if (!this.managerView) {
      return;
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999); // Inclure toute la journée de fin

    // Récupérer tous les membres (manager + membres)
    const allMembers = [
      ...this.managerView.members,
      { userDetails: this.managerView.manager.userDetails, planning: this.managerView.manager.planning }
    ];

    // Filtrer les données selon la période
    const filteredMembers = allMembers.map(member => ({
      ...member,
      planning: member.planning.filter((day: any) => {
        const dayDate = new Date(day.date);
        return dayDate >= startDate && dayDate <= endDate;
      })
    }));

    // Calculer les KPI pour la période
    const kpiData = this.calculateKPIsForPeriod(filteredMembers, startDate, endDate);

    // Préparer les données par utilisateur
    const userData = this.prepareUserDataForExport(filteredMembers, startDate, endDate);

    // Créer les feuilles Excel
    const sheets = [
      {
        data: kpiData,
        sheetName: 'KPI Équipe'
      },
      {
        data: userData,
        sheetName: 'Données par Utilisateur'
      }
    ];

    // Générer le nom du fichier
    const teamName = this.managerView.teamDetails.name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Export_Equipe_${teamName}_${this.dateUtils.formatDateForFileName(startDate)}_${this.dateUtils.formatDateForFileName(endDate)}`;

    // Exporter
    this.excelExportService.exportMultipleSheets(sheets, fileName);
  }

  private calculateKPIsForPeriod(members: any[], startDate: Date, endDate: Date): any[] {
    const kpiData: any[] = [];

    // Calculer le nombre total de jours dans la période
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Total heures travaillées
    let totalSeconds = 0;
    let totalDays = 0;
    let arrivalTimes: number[] = [];
    let departureTimes: number[] = [];

    members.forEach(member => {
      if (member.planning && Array.isArray(member.planning)) {
        member.planning.forEach((day: any) => {
          if (day.totalHours) {
            const seconds = this.timeUtils.parseTimeStringToSeconds(day.totalHours);
            if (seconds !== null) {
              totalSeconds += seconds;
              totalDays++;
            }
          }

          if (day.calendar && Array.isArray(day.calendar)) {
            day.calendar.forEach((cal: any) => {
              if (cal.begin) {
                const beginTime = new Date(cal.begin);
                arrivalTimes.push(this.timeUtils.dateToMinutes(beginTime));
              }
              if (cal.end) {
                const endTime = new Date(cal.end);
                departureTimes.push(this.timeUtils.dateToMinutes(endTime));
              }
            });
          }
        });
      }
    });

    // Formater les heures totales
    const totalHoursFormatted = this.timeUtils.formatSecondsToHours(totalSeconds);

    // Moyenne par jour
    const avgSecondsPerDay = totalDays > 0 ? totalSeconds / totalDays : 0;
    const avgHoursPerDayFormatted = this.timeUtils.formatSecondsToHours(avgSecondsPerDay);

    // Heure moyenne d'arrivée
    const avgArrivalFormatted = this.timeUtils.calculateAverageTime(arrivalTimes);

    // Heure moyenne de départ
    const avgDepartureFormatted = this.timeUtils.calculateAverageTime(departureTimes);

    kpiData.push({
      'Indicateur': 'Nom de l\'équipe',
      'Valeur': this.managerView?.teamDetails.name || 'N/A'
    });
    kpiData.push({
      'Indicateur': 'Période',
      'Valeur': `${this.dateUtils.formatDateForDisplay(startDate)} - ${this.dateUtils.formatDateForDisplay(endDate)}`
    });
    kpiData.push({
      'Indicateur': 'Nombre de jours',
      'Valeur': daysDiff
    });
    kpiData.push({
      'Indicateur': 'Nombre de membres',
      'Valeur': members.length
    });
    kpiData.push({
      'Indicateur': 'Total heures travaillées',
      'Valeur': totalHoursFormatted
    });
    kpiData.push({
      'Indicateur': 'Moyenne heures par jour',
      'Valeur': avgHoursPerDayFormatted
    });
    kpiData.push({
      'Indicateur': 'Heure moyenne d\'arrivée',
      'Valeur': avgArrivalFormatted
    });
    kpiData.push({
      'Indicateur': 'Heure moyenne de départ',
      'Valeur': avgDepartureFormatted
    });

    return kpiData;
  }

  private prepareUserDataForExport(members: any[], startDate: Date, endDate: Date): any[] {
    const userData: any[] = [];

    members.forEach(member => {
      const userName = `${member.userDetails.firstName} ${member.userDetails.lastName}`;
      const userId = member.userDetails.id;
      const role = member.userDetails.role || 'employee';

      // Calculer les statistiques pour cet utilisateur
      let totalSeconds = 0;
      let daysWorked = 0;
      const dailyData: any[] = [];

      if (member.planning && Array.isArray(member.planning)) {
        member.planning.forEach((day: any) => {
          const dayDate = new Date(day.date);
          const dateStr = this.dateUtils.formatDateForDisplay(dayDate);

          let dayHours = '0h00';
          let arrivalTime = '--:--';
          let departureTime = '--:--';
          let dayType = 'Normal';

          if (day.totalHours) {
            const seconds = this.timeUtils.parseTimeStringToSeconds(day.totalHours);
            if (seconds !== null) {
              totalSeconds += seconds;
              daysWorked++;
              dayHours = this.timeUtils.formatSecondsToHours(seconds);
            }
          }

          if (day.calendar && Array.isArray(day.calendar) && day.calendar.length > 0) {
            const firstEntry = day.calendar[0];
            const lastEntry = day.calendar[day.calendar.length - 1];

            if (firstEntry.begin) {
              const beginTime = new Date(firstEntry.begin);
              arrivalTime = this.timeUtils.formatDateToTime(beginTime);
            }

            if (lastEntry.end) {
              const endTime = new Date(lastEntry.end);
              departureTime = this.timeUtils.formatDateToTime(endTime);
            }

            if (firstEntry.dayType) {
              dayType = firstEntry.dayType;
            }
          }

          dailyData.push({
            'Date': dateStr,
            'Heures travaillées': dayHours,
            'Arrivée': arrivalTime,
            'Départ': departureTime,
            'Type de jour': dayType
          });
        });
      }

      // Calculer le total pour cet utilisateur
      const totalHoursFormatted = this.timeUtils.formatSecondsToHours(totalSeconds);

      // Ajouter une ligne de séparation avec les totaux de l'utilisateur
      userData.push({
        'Utilisateur': userName,
        'ID': userId,
        'Rôle': role,
        'Date': 'TOTAL',
        'Heures travaillées': totalHoursFormatted,
        'Arrivée': '--',
        'Départ': '--',
        'Type de jour': `Jours travaillés: ${daysWorked}`
      });

      // Ajouter les données quotidiennes
      dailyData.forEach(day => {
        userData.push({
          'Utilisateur': userName,
          'ID': userId,
          'Rôle': role,
          'Date': day['Date'],
          'Heures travaillées': day['Heures travaillées'],
          'Arrivée': day['Arrivée'],
          'Départ': day['Départ'],
          'Type de jour': day['Type de jour']
        });
      });

      // Ligne vide pour séparer les utilisateurs
      userData.push({
        'Utilisateur': '',
        'ID': '',
        'Rôle': '',
        'Date': '',
        'Heures travaillées': '',
        'Arrivée': '',
        'Départ': '',
        'Type de jour': ''
      });
    });

    return userData;
  }

}
