import {Component, OnInit, OnDestroy, ViewChild, Directive, ElementRef, HostListener, AfterViewInit, inject} from '@angular/core';
import { Filter, FilterService } from '../../../../services/filter.service';
import { TeamService } from '../../../../services/team.service';
import { Subscription } from 'rxjs';
import { Team } from '../../../../models/team.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CreateTeamDialog } from '../../../../shared/components/create-team-dialog/create-team-dialog';
import { DeleteDialog } from '../../../../shared/components/delete-dialog/delete-dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DropdownOption } from '../../../../shared/components/basic-dropdown/basic-dropdown';
import { UserService } from '../../../../services/user.service';
import { AddTeamEmploye } from '../../../../shared/components/add-team-employe/add-team-employe';
import { User } from '../../../../models/user.model';
import { selectionSetMatchesResult } from '@apollo/client/cache/inmemory/helpers';
import {TeamDrawer} from '../../../../shared/components/team-drawer/team-drawer';
import {EmployeeDrawer} from '../../../../shared/components/employee-drawer/employee-drawer';
import { SnackBarService } from '../../../../services/snackbar.service';


@Component({
  selector: 'app-team-list',
  templateUrl: './team-list.html',
  imports: [
    TeamDrawer,
    EmployeeDrawer,
    TranslatePipe
  ],
  styleUrls: ['./team-list.css']
})
export class TeamList implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('teamsContainer') teamsContainer!: ElementRef<HTMLDivElement>;

  translate: TranslateService = inject(TranslateService);
  private snackBarService = inject(SnackBarService);
  teams: Team[] = [];
  filteredTeams: Team[] = [];
  selectedFilter: Filter | null = null;
  allFilters: Filter[] = [];
  public allUsers: User[] = [];

  private filterSub?: Subscription;
  private teamSub?: Subscription;

  dropdownOptions: DropdownOption[] = [];

  dropdownOptionsUsers: DropdownOption[] = []
  dropdownOptionsManagers: DropdownOption[] = []

  selectedTeam: Team | undefined = undefined;
  isTeamDrawerOpen: boolean = false;

  selectedEmployee: User | undefined = undefined;
  isEmployeeDrawerOpen: boolean = false;

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

    this.allFilters = this.filterService.getAllFilters();
    let count = 1;
    //Remplissage des options du dropdown de création d'équipe
    for (let filter of this.allFilters){
      if (!this.dropdownOptions.find(option => option.value === count) && filter.value != 'tous'){
        this.dropdownOptions.push({label: filter.label, value: count, field: filter.value});
      }
      count++;
    }
  }

  ngAfterViewInit() {
    this.setupHorizontalScroll();
  }

  private setupHorizontalScroll(): void {
    const container = this.teamsContainer.nativeElement;

    container.addEventListener('wheel', (event: WheelEvent) => {
      const canScrollHorizontally = container.scrollWidth > container.clientWidth;

      if (canScrollHorizontally) {
        event.preventDefault();
        container.scrollLeft += event.deltaY;
      }
    }, { passive: false }); // Important : passive: false pour permettre preventDefault()
  }

  async loadUsers() {
  try {
    this.allUsers = await this.userService.getAllUsers();
    console.log('Utilisateurs chargés:', this.allUsers);

    // 🔹 On garde uniquement ceux qui n'ont pas d'équipe
    const usersWithoutTeam = this.allUsers.filter((user: User) => user.team == null);

    const employees = usersWithoutTeam.filter((user: User)=> user.role == "employe");

    // 🔹 Puis on construit les options du dropdown
    this.dropdownOptionsUsers = employees.map((user: User) => ({
      label: `${user.firstName} ${user.lastName}`,
      value: Number(user.id)
    }));

    const managers = usersWithoutTeam.filter((user: User) => user.role == "manager");

    this.dropdownOptionsManagers = managers.map((user: User) => ({
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
  createTeam(name:string, field:string | null | undefined, description:string, manager: number) {

    if (!name || !field || !description) {
      console.warn('Création annulée — champs manquants');
      return;
    }

    this.teamService.createTeam(name, field, description, manager).subscribe({
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
      team.field.toLowerCase() === this.selectedFilter!.value.toLowerCase()
    );
  }

  ngOnDestroy() {
    this.filterSub?.unsubscribe();
    this.teamSub?.unsubscribe();
  }

  addMemberDialog(teamID: string) {

    this.dialog.open(AddTeamEmploye, {
      data: {
        title: this.translateService.instant('TEAM.DIALOG.ADD-EMPLOYE.TITLE'),
        cancel: this.translateService.instant('BASE.CANCEL'),
        confirm: this.translateService.instant('BASE.ADD'),
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
                this.snackBarService.showSuccess('Membres ajoutés à l\'équipe avec succès');
                window.location.reload();
                console.log("Mutation success:", res);
                // Optionnel : rafraîchir la liste des équipes ici si besoin

                dialogRef.close();
              },
              error: (err) => {
                console.error("Mutation error:", err);
                this.snackBarService.showError('Erreur lors de l\'ajout des membres');
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
        managerList: this.dropdownOptionsManagers,
        dropdownOptions: this.dropdownOptions,
        onConfirm: (dialogRef: MatDialogRef<CreateTeamDialog>,
          teamName: string ,
          teamField: number ,
          manager: number,
          teamDescription: string) => {
            //Récupération du field en fonction de l'id de son dropDownOption
            const selectedField = this.dropdownOptions.find(option => option.value === teamField);
            const field = selectedField ? selectedField.field?.toLowerCase() : null;
            //Récupération du manager en fonction de l'id de son dropDownOption
            const selectedManager = this.dropdownOptionsManagers.find(option => option.value === manager);
            this.createTeam(teamName, field, teamDescription, manager);
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

  displayTeamData(teamId: string): void {
    this.selectedTeam = this.teams.find(team => team.id === teamId);
    this.isTeamDrawerOpen = true;
  }

  closeTeamDrawer(): void {
    this.isTeamDrawerOpen = false;
    this.selectedTeam = undefined;
  }

  onMemberClick(memberId: number): void {
    this.selectedEmployee = this.allUsers.find((user) => user.id === String(memberId));
    this.isEmployeeDrawerOpen = true;
  }

  closeEmployeeDrawer() {
    this.isEmployeeDrawerOpen = false;
  }
}

@Directive({
  selector: "[appHorizontalScroll]",
})
export class HorizontalScrollDirective {
  constructor(private element: ElementRef) {}

  @HostListener("wheel", ["$event"])
  public onScroll(event: WheelEvent) {
    console.log("marche")
    this.element.nativeElement.scrollLeft += event.deltaY;
  }
}
