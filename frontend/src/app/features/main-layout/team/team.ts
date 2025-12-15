import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TeamService, ManagerViewResponse } from '../../../services/team.service';
import { UserService } from '../../../services/user.service';
import { EmployeeDrawer } from '../../../shared/components/employee-drawer/employee-drawer';
import { User } from '../../../models/user.model';
import {DeleteDialog} from '../../../shared/components/delete-dialog/delete-dialog';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {EditTeamManager} from '../../../shared/components/edit-team-manager/edit-team-manager';

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
  imports: [CommonModule, TranslateModule, EmployeeDrawer],
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
  selectedEmployee: User | null = null;
  isEmployeeDrawerOpen: boolean = false;
  allUsers: User[] = [];

  constructor(
    private teamService: TeamService,
    private userService: UserService
  ) {}

  async ngOnInit() {
    await this.loadTeamData();
    await this.loadUsers();
  }

  async loadUsers() {
    try {
      this.allUsers = await this.userService.getAllUsers();
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
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

      const managerId = parseInt(currentUser.id);

      // Charger les données de l'équipe
      this.teamService.getManagerView(managerId).subscribe({
        next: (data) => {
          this.managerView = data;
          this.calculateStatistics();
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des données:', err);
          this.error = 'team.impossibledecharger';
          this.loading = false;
        }
      });

    } catch (err) {
      console.error('Erreur:', err);
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
      if (member.planning) {
        member.planning.forEach((day: any) => {
          const dayDate = new Date(day.date);
          if (dayDate >= startDate && dayDate <= today) {
            // Convertir totalHours (format "HH:MM:SS") en secondes
            const [hours, minutes, seconds] = day.totalHours.split(':').map(Number);
            totalSeconds += (hours * 3600) + (minutes * 60) + (seconds || 0);
            count++;
          }
        });
      }
    });

    if (count === 0) return '0h00';

    const avgSeconds = totalSeconds / count;
    const hours = Math.floor(avgSeconds / 3600);
    const minutes = Math.floor((avgSeconds % 3600) / 60);

    return `${hours}h${minutes.toString().padStart(2, '0')}`;
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
                arrivalTimes.push(beginTime.getHours() * 60 + beginTime.getMinutes());
              }
              if (cal.end) {
                const endTime = new Date(cal.end);
                departureTimes.push(endTime.getHours() * 60 + endTime.getMinutes());
              }
            });
          }
        });
      }
    });

    if (arrivalTimes.length > 0) {
      const avgArrival = arrivalTimes.reduce((a, b) => a + b, 0) / arrivalTimes.length;
      const hours = Math.floor(avgArrival / 60);
      const minutes = Math.floor(avgArrival % 60);
      this.avgArrivalTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    if (departureTimes.length > 0) {
      const avgDeparture = departureTimes.reduce((a, b) => a + b, 0) / departureTimes.length;
      const hours = Math.floor(avgDeparture / 60);
      const minutes = Math.floor(avgDeparture % 60);
      this.avgDepartureTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
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
    this.selectedEmployee = this.allUsers.find((user) => user.id === String(memberId)) || null;
    this.isEmployeeDrawerOpen = true;
  }

  closeEmployeeDrawer(): void {
    this.isEmployeeDrawerOpen = false;
    this.selectedEmployee = null;
  }
}
