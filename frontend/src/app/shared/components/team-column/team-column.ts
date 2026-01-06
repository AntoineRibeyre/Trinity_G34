import {Component, OnInit} from '@angular/core';
import {NgClass} from "@angular/common";
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {Employee, TeamService} from '../../../services/team.service';
import {UserService} from '../../../services/user.service';
import {User} from '../../../models/user.model';
import {Team} from '../../../models/team.model';

@Component({
  selector: 'app-team-column',
  imports: [
    TranslatePipe,
    NgClass
  ],
  templateUrl: './team-column.html',
  styleUrl: './team-column.css'
})
export class TeamColumn implements OnInit {

  private isLoading: boolean = false;
  private currentUser: User | null = null;
  employeeList: Employee[] = [];
  currentTeam: Team | undefined;

  constructor(
    public teamService: TeamService,
    public translateService: TranslateService,
    public userService: UserService
  ) {}

  async ngOnInit() {
    await this.getCurrentUser()
    this.currentTeam = this.currentUser?.team

    this.getUserTeam()
  }

  getNameFontSize(employee: Employee): string {
    const fullName = `${employee.firstName} ${employee.lastName}`;
    const length = fullName.length;

    if (length > 20) {
      return '0.9rem';
    } else if (length > 15) {
      return '1.1rem';
    } else if (length > 12) {
      return '1.3rem';
    }
    return '1.5rem';
  }

  private async getCurrentUser() {
    try {
      this.isLoading = true;

      this.currentUser = await this.userService.loadCurrentUserFromServer();
      if (!this.currentUser) {
        throw new Error('Utilisateur non trouvé');
      }
      this.isLoading = false;

    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      this.isLoading = false;
    }
  }

  private getUserTeam(){
    const teamId = this.currentUser?.team?.id
    if (!teamId) return
    this.teamService.getTeamMembersByTeamId(Number(teamId)).subscribe({
      next: (response) => {
        const managers = response.filter(e => e.role === "manager");
        const autres = response.filter(e => e.role !== "manager");
        this.employeeList = [...managers, ...autres];
      }
    })
  }

  getStatusClass(employee: Employee): string {
    if (!employee.Calendar || employee.Calendar.length === 0) {
      return 'absent';
    }

    const today = new Date().toDateString();

    // Filtrer les entrées du calendrier pour aujourd'hui
    const todayEntries = employee.Calendar.filter(cal => {
      if (!cal.begin) return false;
      const calDate = new Date(cal.begin).toDateString();
      return calDate === today;
    });

    if (todayEntries.length === 0) {
      return 'absent';
    }

    // Vérifier s'il y a une entrée en cours (non terminée)
    const hasOngoing = todayEntries.some(cal => !cal.dayOver);
    return hasOngoing ? 'present' : 'finished';
  }

  getAvatarPath(employee: Employee): string {
    if (!employee || !employee.id) {
      return 'assets/avatar/avatar-1.svg';
    }

    const key = `avatar_${employee.id}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      const id = Number(saved);
      if (id >= 1 && id <= 18) {
        return `assets/avatar/avatar-${id}.svg`;
      }
    }

    // Utiliser l'ID ou le nom pour générer un hash
    const seed =
      employee.id?.toString() ||
      (employee as any).email ||
      `${employee.firstName}${employee.lastName}`;

    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % 18 + 1;
    return `assets/avatar/avatar-${index}.svg`;
  }
}
