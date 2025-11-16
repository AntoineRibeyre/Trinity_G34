import { Component, OnInit, OnDestroy } from '@angular/core';
import { Filter, FilterService } from '../../../../services/filter.service';
import { TeamService } from '../../../../services/team.service';
import { Subscription } from 'rxjs';
import { Team } from '../../../../models/team.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CreateTeamDialog } from '../../../../shared/components/create-team-dialog/create-team-dialog';
import { DeleteDialog } from '../../../../shared/components/delete-dialog/delete-dialog';
import { TranslateService } from '@ngx-translate/core';
import { DropdownOption } from '../../../../shared/components/basic-dropdown/basic-dropdown';
import { UserService } from '../../../../services/user.service';
import { AddTeamEmploye } from '../../../../shared/components/add-team-employe/add-team-employe';
import { User } from '../../../../models/user.model';
import { selectionSetMatchesResult } from '@apollo/client/cache/inmemory/helpers';

@Component({
  selector: 'app-team-list',
  templateUrl: './team-list.html',
  styleUrls: ['./team-list.css']
})
export class TeamList implements OnInit, OnDestroy {
  teams: Team[] = [];
  filteredTeams: Team[] = [];
  selectedFilter: Filter | null = null;
  public allUsers: User[] = [];

  private filterSub?: Subscription;
  private teamSub?: Subscription;

  dropdownOptions: DropdownOption[] = [
    { label: 'Commerce', value: 1 },
    { label: 'Finance', value: 2 },
    { label: 'Design', value: 3 }
  ];

  dropdownOptionsUsers: DropdownOption[] = []

  constructor(
    private filterService: FilterService,
    private teamService: TeamService,
    private dialog : MatDialog,
    private translateService: TranslateService,
    private userService: UserService
  ) {}

  ngOnInit() {
    // 🔹 1. Abonnement au filtre courant
    this.filterSub = this.filterService.selectedFilter$.subscribe(filter => {
      this.selectedFilter = filter;
      console.log('Filtre actuel:', filter?.label);
      this.applyFilter();
    });

    // 🔹 2. Récupération de toutes les équipes
    this.teamSub = this.teamService.getAllTeams().subscribe({
      next: (teams) => {
        this.teams = teams;
        this.applyFilter();
      },
      error: (err) => console.error('Erreur lors du chargement des équipes:', err)
    });

    // Récupération des utilisateurs pour l'ajout dans une team
    this.loadUsers();
  }

  async loadUsers() {
  try {
    this.allUsers = await this.userService.getAllUsers();
    console.log('Utilisateurs chargés:', this.allUsers);

    // 🔹 On garde uniquement ceux qui n'ont pas d'équipe
    const usersWithoutTeam = this.allUsers.filter((user: User) => user.team == null);

    // 🔹 Puis on construit les options du dropdown
    this.dropdownOptionsUsers = usersWithoutTeam.map((user: User) => ({
      label: `${user.firstName} ${user.lastName}`,
      value: Number(user.id)
    }));

    console.log('Utilisateurs sans équipe:', usersWithoutTeam);

  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs:', error);
  }
}


  /**
   * 🔹 Crée une nouvelle équipe
   */
  createTeam(name:string, field:string | null, description:string) {

    if (!name || !field || !description) {
      console.warn('Création annulée — champs manquants');
      return;
    }

    this.teamService.createTeam(name, field, description).subscribe({
      next: (newTeam) => {
        console.log('Équipe créée :', newTeam);
        this.teams.push(newTeam);
        this.applyFilter();
      },
      error: (err) => console.error('Erreur lors de la création de l’équipe :', err)
    });
  }

  /**
   * 🔹 Filtre les équipes selon le filtre sélectionné
   */
  applyFilter() {
    this.filteredTeams = this.teams.filter(team =>
      team.field.toLowerCase() === this.selectedFilter!.label.toLowerCase()
    );
  }

  ngOnDestroy() {
    this.filterSub?.unsubscribe();
    this.teamSub?.unsubscribe();
  }

  addMemberDialog(teamID: string) {
    console.log("add employees");

    this.dialog.open(AddTeamEmploye, {
      data: {
        title: this.translateService.instant('TEAM.DIALOG.ADD-EMPLOYE.TITLE'),
        cancel: this.translateService.instant('BASE.CANCEL'),
        confirm: this.translateService.instant('BASE.CREATE'),
        dropdownOptions: this.dropdownOptionsUsers,

        onConfirm: (
          dialogRef: MatDialogRef<DeleteDialog>,
          selectedEmployeeIds: number[]
        ) => {
          console.log("Selected employee IDs:", selectedEmployeeIds);

          // Appel à la mutation GraphQL
          this.teamService.addEmployees(Number(teamID), selectedEmployeeIds)
            .subscribe({
              next: (res) => {
                window.location.reload();
                console.log("Mutation success:", res);
                // Optionnel : rafraîchir la liste des équipes ici si besoin

                dialogRef.close();
              },
              error: (err) => {
                console.error("Mutation error:", err);
                // Optionnel : afficher un message d'erreur à l'utilisateur
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


  getManager(team: any) {
    return team.members.find((m: any) => m.role === 'manager');
  }

  createTeamDialog(): void {
    this.dialog.open(CreateTeamDialog, {
      data: {
        title: this.translateService.instant('TEAM.DIALOG.CREATE-TEAM.TITLE'),
        cancel: this.translateService.instant('BASE.CANCEL'),
        confirm: this.translateService.instant('BASE.CREATE'),
        dropdownOptions: this.dropdownOptions,
        onConfirm: (dialogRef: MatDialogRef<DeleteDialog>,
          teamName: string ,
          teamField: number ,
          teamDescription: string) => {
            const selectedOption = this.dropdownOptions.find(option => option.value === teamField);
            const label = selectedOption ? selectedOption.label.toLowerCase() : null;
            this.createTeam(teamName, label, teamDescription);
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
}
