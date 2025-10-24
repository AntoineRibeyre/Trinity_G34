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



@Component({
  selector: 'app-team-list',
  templateUrl: './team-list.html',
  styleUrls: ['./team-list.css']
})
export class TeamList implements OnInit, OnDestroy {
  teams: Team[] = [];
  filteredTeams: Team[] = [];
  selectedFilter: Filter | null = null;

  private filterSub?: Subscription;
  private teamSub?: Subscription;

  dropdownOptions: DropdownOption[] = [
    { label: 'Commerce', value: 1 },
    { label: 'Finance', value: 2 },
    { label: 'Design', value: 3 }
  ];

  constructor(
    private filterService: FilterService,
    private teamService: TeamService,
    private dialog : MatDialog,
    private translateService: TranslateService
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

  onSelectTeam(team: any) {
    console.log('Équipe sélectionnée :', team.name);
  }

  onAddMember(team: any) {
    console.log('Ajout d’un membre à :', team.name);
  }

  getManager(team: any) {
    return team.members.find((m: any) => m.role === 'manager');
  }

  openDialog(): void {
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
