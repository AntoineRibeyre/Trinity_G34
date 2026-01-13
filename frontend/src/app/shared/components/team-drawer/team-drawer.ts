import {Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges, inject} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BasicTextButton } from '../basic-text-button/basic-text-button';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Team } from '../../../models/team.model';
import { User } from '../../../models/user.model';
import {BasicTextField} from '../basic-text-field/basic-text-field';
import { TeamService } from '../../../services/team.service';
import { DeleteDialog } from '../delete-dialog/delete-dialog';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../../services/user.service';
import { AddTeamEmploye } from '../add-team-employe/add-team-employe';
import { DropdownOption } from '../basic-dropdown/basic-dropdown';
import {EditTeamManager} from '../edit-team-manager/edit-team-manager';
import { SnackBarService } from '../../../services/snackbar.service';
import { PointService } from '../../../services/point.service';
import { TimeUtilsService } from '../../../services/time-utils.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-team-drawer',
  templateUrl: './team-drawer.html',
  styleUrls: ['./team-drawer.css'],
  imports: [
    FormsModule,
    CommonModule,
    BasicTextButton,
    TranslatePipe,
    BasicTextField
  ],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)' }))
      ])
    ])
  ]
})
export class TeamDrawer implements OnChanges {

  @Input() isOpen: boolean = false;
  @Input() team: Team | undefined = undefined;

  @Output() closeDrawer = new EventEmitter<void>();
  @Output() memberClick = new EventEmitter<number>();
  @Output() teamDeleted = new EventEmitter<number>();
  @Output() teamUpdated = new EventEmitter<Team>();

  private snackBarService = inject(SnackBarService);

  constructor(
    private teamService: TeamService,
    private dialog : MatDialog,
    private translateService: TranslateService,
    private userService: UserService,
    private pointService: PointService,
    private timeUtils: TimeUtilsService) {}

  dropdownOptionsUsers: DropdownOption[] = []
  isEditable: boolean = false;
  teamManager: User | undefined;

  // Créer une copie mutable pour l'édition
  editableTeam: Team | undefined;
  private originalTeam: Team | undefined;

  // KPI
  totalHours: string = '0h00';
  attendanceRate: number = 0;
  isLoadingKPIs: boolean = false;

  // Supprimer ngOnInit et garder uniquement ngOnChanges
  ngOnChanges(changes: SimpleChanges): void {
    // console.log('ngOnChanges appelé', changes);

    // Initialiser dès que team change ou au premier chargement
    if (changes['team']) {
      // console.log('Team changé:', changes['team'].currentValue);
      this.initializeTeam();
      this.loadKPIs();
    }

    // Réinitialiser aussi quand le drawer s'ouvre
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      // console.log('Drawer ouvert, réinitialisation');
      this.initializeTeam();
      this.loadKPIs();
    }
  }

  private initializeTeam(): void {
    // console.log('initializeTeam appelé avec team:', this.team);

    if (this.team) {
      try {
        // Créer une copie profonde pour l'édition
        this.editableTeam = JSON.parse(JSON.stringify(this.team));
        this.originalTeam = JSON.parse(JSON.stringify(this.team));

        // console.log('editableTeam créé:', this.editableTeam);
        // console.log('originalTeam créé:', this.originalTeam);

        this.updateTeamManager();
      } catch (error) {
        // console.error('Erreur lors de la copie de team:', error);
      }
    } else {
      // console.warn('Team est undefined, impossible d\'initialiser');
      this.editableTeam = undefined;
      this.originalTeam = undefined;
    }
  }

  private updateTeamManager(): void {
    if (this.editableTeam?.members) {
      this.teamManager = this.editableTeam.members.find(user => user.role === "manager");
      // console.log('Team manager trouvé:', this.teamManager);
    }
  }

  onChangeName(name: string): void {
    // console.log('onChangeName appelé avec:', name);

    if (!this.editableTeam) {
      // console.error('Impossible de mettre à jour : équipe non définie');
      return;
    }

    // Modifier la copie mutable
    this.editableTeam.name = name;
    // console.log('Nom mis à jour:', this.editableTeam.name);
  }

  onChangeDescription(description: string): void {
    // console.log('onChangeDescription appelé avec:', description);

    if (!this.editableTeam) {
      // console.error('Impossible de mettre à jour : équipe non définie');
      return;
    }

    // Modifier la copie mutable
    this.editableTeam.description = description;
    // console.log('Description mise à jour:', this.editableTeam.description);
  }

  close(): void {
    this.isEditable = false;
    this.closeDrawer.emit();
  }

  toggleEdit(): void {
    this.isEditable = true;
    // Sauvegarder l'état actuel avant modification
    if (this.editableTeam) {
      this.originalTeam = JSON.parse(JSON.stringify(this.editableTeam));
      // console.log('Mode édition activé, sauvegarde originale:', this.originalTeam);
    }
  }

  cancelEdit(): void {
    // Restaurer les valeurs originales
    if (this.originalTeam) {
      this.editableTeam = JSON.parse(JSON.stringify(this.originalTeam));
      // console.log('Modifications annulées, restauration:', this.editableTeam);
    }
    this.isEditable = false;
  }

  saveChanges(): void {
    if (!this.editableTeam?.id) {
      // console.error('Impossible de sauvegarder : équipe non définie');
      return;
    }

    const updatedData: {
      id: number;
      name?: string;
      description?: string;
      field?: string;
    } = {id:Number(this.team?.id)};
    updatedData.id = Number(this.team?.id)
    // Comparer avec l'original
    if (this.editableTeam.name !== this.originalTeam?.name) {
      updatedData.name = this.editableTeam.name;
    }
    if (this.editableTeam.description !== this.originalTeam?.description) {
      updatedData.description = this.editableTeam.description;
    }
    if (this.editableTeam.field !== this.originalTeam?.field) {
      updatedData.field = this.editableTeam.field;
    }

    // console.log('Données à sauvegarder:', updatedData);

    if (Object.keys(updatedData).length === 0) {
      // console.log('Aucune modification à sauvegarder');
      this.isEditable = false;
      return;
    }

    this.teamService.updateTeam( updatedData).subscribe({
      next: (response) => {
        // console.log('Équipe mise à jour:', response.message);
        this.snackBarService.showSuccess('Équipe mise à jour avec succès');

        // Mettre à jour les valeurs
        if (this.editableTeam) {
          this.originalTeam = JSON.parse(JSON.stringify(this.editableTeam));
        }

      },
      error: (err) => {
        // console.error('Erreur lors de la mise à jour:', err);
        this.snackBarService.showError('Erreur lors de la sauvegarde des modifications');
      }
    });
    window.location.reload();
  }

  deleteTeam(): void {
    this.dialog.open(DeleteDialog, {
      data: {
        title: "Supprimer une équipe",
        message: "Êtes-vous sûr de vouloir supprimer cette équipe ? Cette action est irréversible.",
        cancel: "Annuler",
        confirm: "Supprimer",
        onConfirm: (dialogRef: MatDialogRef<DeleteDialog>) => {
          if (!this.editableTeam?.id) {
            // console.error('Impossible de supprimer : équipe non définie');
            return;
          }


          this.teamService.deleteTeam(Number(this.editableTeam.id)).subscribe({
            next: (response) => {
              // console.log('✅ Équipe supprimée avec succès', response);
              this.snackBarService.showSuccess('Équipe supprimée avec succès');
              this.teamDeleted.emit(Number(this.editableTeam!.id));
              window.location.reload();
              this.close();
            },
            error: (err) => {
              // console.error('Erreur lors de la suppression:', err);
              this.snackBarService.showError('Erreur lors de la suppression de l\'équipe');
            }
          });
          window.location.reload();
          dialogRef.close();
        },
        onCancel: (dialogRef: MatDialogRef<DeleteDialog>) => {
          dialogRef.close();
        },
      },
      panelClass: 'custom-dialog-container'
    })


  }



  async openDialog(): Promise<void> {
    const allUsers = await this.userService.getAllUsers();

    // 🔹 On garde uniquement ceux qui n'ont pas d'équipe
    const usersWithoutTeam = allUsers.filter((user: User) => user.team?.id == this.team?.id);
    const employees = usersWithoutTeam.filter((user: User)=> user.role == "employe");

    // 🔹 Puis on construit les options du dropdown
    this.dropdownOptionsUsers = employees.map((user: User) => ({
      label: `${user.firstName} ${user.lastName}`,
      value: Number(user.id)
    }));
    this.dialog.open(AddTeamEmploye, {
      data: {
        title: this.translateService.instant('TEAM.DIALOG.REMOVE-MEMBERS.TITLE-MEMBERS'),
        cancel: this.translateService.instant('BASE.CANCEL'),
        confirm: this.translateService.instant('BASE.SUPPRIMER'),
        dropdownOptions: this.dropdownOptionsUsers,

        onConfirm: (
          dialogRef: MatDialogRef<DeleteDialog>,
          selectedEmployeeIds: number[]
        ) => {
          // console.log("Selected employee IDs:", selectedEmployeeIds);

          // Appel à la mutation GraphQL
          this.teamService.removeMembers(Number(this.team?.id), selectedEmployeeIds)
            .subscribe({
              next: (res) => {
                this.snackBarService.showSuccess('Membres retirés de l\'équipe avec succès');
                window.location.reload();
                // console.log("Mutation success:", res);
                // Optionnel : rafraîchir la liste des équipes ici si besoin

                dialogRef.close();
              },
              error: (err) => {
                // console.error("Mutation error:", err);
                this.snackBarService.showError('Erreur lors de la suppression des membres');
              }
            });
        },

        onCancel: (dialogRef: MatDialogRef<DeleteDialog>) => {
          dialogRef.close();
        },
      },
      panelClass: 'custom-dialog-container'
    });
  }

  openMemberDetails(memberId: String, event: Event): void {
    event.stopPropagation();
    this.memberClick.emit(Number(memberId));
  }

  async openManagerDialog(): Promise<void> {
    const allUsers = await this.userService.getAllUsers();
    const managers = allUsers.filter((user: User) => user.role === "manager" && user.team == undefined);

    this.dialog.open(EditTeamManager, {
      data: {
        title: "Modifier le manager de l'équipe",
        message: "Choisissez le nouveau manager de l'équipe.",
        cancel: "Annuler",
        confirm: "Modifier",
        managers: managers,
        onConfirm: (dialogRef: MatDialogRef<EditTeamManager>, newManager: User | undefined) => {
          if (newManager) {
            // console.log('Nouveau manager sélectionné:', newManager);
            //TODO
            this.teamService.changeTeamManager(Number(this.team?.id), Number(newManager.id)).subscribe({
              next: (response: any) => {
                // console.log('✅ Manager changé avec succès', response);
                this.snackBarService.showSuccess('Manager de l\'équipe modifié avec succès');
                window.location.reload();
                this.updateTeamManager();
              },
              error: (err: any) => {
                // console.error('Erreur lors du changement de manager:', err);
                this.snackBarService.showError('Erreur lors du changement de manager de l\'équipe');
              }
            });
          }
          dialogRef.close();
        },
        onCancel: (dialogRef: MatDialogRef<EditTeamManager>) => {
          dialogRef.close();
        },
      },
      panelClass: 'custom-dialog-container'
    })
  }

  /**
   * Charge et calcule les KPI de l'équipe (moyenne journalière de la semaine en cours et taux de présence)
   */
  private async loadKPIs(): Promise<void> {
    if (!this.team || !this.team.members || this.team.members.length === 0) {
      this.totalHours = '0h00';
      this.attendanceRate = 0;
      return;
    }

    this.isLoadingKPIs = true;

    try {
      // Filtrer les employés (exclure le manager)
      const employees = this.team.members.filter(member => member.role === 'employe');

      if (employees.length === 0) {
        this.totalHours = '0h00';
        this.attendanceRate = 0;
        this.isLoadingKPIs = false;
        return;
      }

      // Récupérer tous les calendriers de tous les employés en parallèle
      const calendarPromises = employees.map(employee => 
        firstValueFrom(this.pointService.getAllCalendarsByUser(Number(employee.id)))
      );

      const allCalendarsArrays = await Promise.all(calendarPromises);
      
      // Calculer la moyenne journalière de la semaine en cours
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Calculer le début de la semaine en cours (lundi)
      const dayOfWeek = now.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Ajuster pour que lundi = 0
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      
      // Fin de la semaine = aujourd'hui (ou dimanche si on veut la semaine complète)
      const endOfWeek = new Date(now);
      endOfWeek.setHours(23, 59, 59, 999);
      
      // Pour chaque employé, compter ses jours de présence dans le mois
      const employeePresenceDays = new Map<number, Set<string>>();
      
      // Map pour stocker les heures par jour de la semaine (YYYY-MM-DD -> secondes)
      const dailyHours = new Map<string, number>();

      allCalendarsArrays.forEach((calendars, index) => {
        const employeeId = Number(employees[index].id);
        if (!employeePresenceDays.has(employeeId)) {
          employeePresenceDays.set(employeeId, new Set<string>());
        }
        const presenceDays = employeePresenceDays.get(employeeId)!;

        calendars.forEach((calendar: any) => {
          if (calendar.begin) {
            const date = new Date(calendar.begin);
            const dateString = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
            
            // Compter les jours de présence dans le mois en cours
            if (date >= firstDayOfMonth && date <= today) {
              presenceDays.add(dateString);
            }
            
            // Calculer les heures de la semaine en cours
            if (date >= startOfWeek && date <= endOfWeek) {
              // Ajouter les heures pour ce jour
              if (calendar.duration) {
                const currentHours = dailyHours.get(dateString) || 0;
                dailyHours.set(dateString, currentHours + calendar.duration);
              }
            }
          }
        });
      });

      // Calculer la moyenne journalière de la semaine
      if (dailyHours.size > 0) {
        let totalSecondsWeek = 0;
        dailyHours.forEach((seconds) => {
          totalSecondsWeek += seconds;
        });
        const averageSecondsPerDay = totalSecondsWeek / dailyHours.size;
        this.totalHours = this.timeUtils.formatSecondsToHours(averageSecondsPerDay);
      } else {
        this.totalHours = '0h00';
      }

      // Calculer le taux de présence pour le mois en cours
      // Compter les jours ouvrables du mois (du 1er au jour actuel)
      let workingDays = 0;
      for (let d = new Date(firstDayOfMonth); d <= today; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        // Exclure les weekends (samedi = 6, dimanche = 0)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          workingDays++;
        }
      }

      // Calculer le taux de présence
      if (workingDays > 0 && employees.length > 0) {
        // Compter le nombre total de jours de présence de tous les employés
        let totalPresenceDays = 0;
        employeePresenceDays.forEach((daysSet) => {
          totalPresenceDays += daysSet.size;
        });

        // Nombre total de jours attendus = jours ouvrables × nombre d'employés
        const totalExpectedDays = workingDays * employees.length;
        
        // Taux de présence = (jours de présence réels / jours attendus) * 100
        this.attendanceRate = totalExpectedDays > 0 
          ? Math.round((totalPresenceDays / totalExpectedDays) * 100) 
          : 0;
      } else {
        this.attendanceRate = 0;
      }

    } catch (error) {
      // console.error('Erreur lors du calcul des KPI:', error);
      this.totalHours = '0h00';
      this.attendanceRate = 0;
    } finally {
      this.isLoadingKPIs = false;
    }
  }
}
