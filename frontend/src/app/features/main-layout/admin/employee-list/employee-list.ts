import { Component, EventEmitter, Output, OnDestroy, OnInit, inject } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/user.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DeleteDialog } from '../../../../shared/components/delete-dialog/delete-dialog';
import {BasicTextField} from '../../../../shared/components/basic-text-field/basic-text-field';
import {TranslatePipe} from '@ngx-translate/core';
import {EmployeeDrawer} from '../../../../shared/components/employee-drawer/employee-drawer';
import {ExcelExportService} from '../../../../services/excel-export.service';
import { Team } from '../../../../models/team.model';
import { TeamService } from '../../../../services/team.service';
import {TeamDrawer} from '../../../../shared/components/team-drawer/team-drawer';
import {AddEmployee} from '../../../../shared/components/add-employee/add-employee';
import { SnackBarService } from '../../../../services/snackbar.service';
import {BasicTextButton} from '../../../../shared/components/basic-text-button/basic-text-button';
import { FilterService, Filter } from '../../../../services/filter.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-employee-list',
  imports: [CommonModule, FormsModule, BasicTextField, TranslatePipe, EmployeeDrawer, TeamDrawer, BasicTextButton],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css'
})
export class EmployeeList implements OnDestroy, OnInit {
  @Output() changeSearch = new EventEmitter<string>();
  @Output() openOptions = new EventEmitter<void>();

  public allUsers: User[] = [];
  public filteredUsers: User[] = [];
  public router = inject(Router);
  teams: Team[] = [];

  selectedEmployee: User | undefined = undefined;
  isDrawerOpen: boolean = false;
  editableDrawer: boolean = false;
  query: string = '';

  // Filtres
  selectedRole: string = '';
  selectedTeamFilter: string = '';
  selectedTeamField: string = '';
  roles: string[] = ['admin', 'manager', 'employe'];
  teamFields: string[] = [];
  teamFieldFilters: Filter[] = [];

  selectedTeam: Team | undefined = undefined;
  isTeamDrawerOpen: boolean = false;
  placeHolderText: string = "No data";
  managerName: string = '';

  private teamSub?: Subscription;

  private q$ = new Subject<string>();
  private sub: Subscription;
  private snackBarService = inject(SnackBarService);

  constructor(
    private userService: UserService,
    private dialog : MatDialog,
    private exportService: ExcelExportService,
    private teamService: TeamService,
    private filterService: FilterService
  ) {
    this.sub = this.q$.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(q => {
      this.filterUsers(q);
      this.changeSearch.emit(q);
    });
  }
  ngOnInit(): void {
    this.initializeComponent();
  }

  private async initializeComponent(): Promise<void> {
    const currentUser = await this.userService.loadCurrentUserFromServer();
    if (!currentUser || currentUser.role !== 'admin') {
      this.router.navigate(['/dashboard']);
      return;
    }
    await this.loadUsers();

    // Récupérer tous les filtres disponibles depuis le FilterService
    const allFilters = this.filterService.getAllFilters();
    
    // Filtrer pour ne garder que les filtres d'équipe (exclure "tous")
    this.teamFieldFilters = allFilters.filter(f => 
      f.route === 'admin/teams' && f.value !== 'tous'
    );

    this.teamSub = this.teamService.getAllTeams().subscribe({
      next: (teams) => {
        this.teams = teams;
        // Extraire les types d'équipe uniques
        const fields = teams
          .map(team => team.field)
          .filter((field, index, self) => field && self.indexOf(field) === index);
        this.teamFields = fields;
      },
      error: (err) => console.error('Erreur lors du chargement des équipes:', err)
    });
  }

  async loadUsers() {
    try {
      this.allUsers = await this.userService.getAllUsers();
      this.filteredUsers = this.allUsers; // Initialiser la liste filtrée
      console.log('Utilisateurs chargés:', this.allUsers);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  }

  filterUsers(searchTerm: string) {
    const term = searchTerm.toLowerCase();

    this.filteredUsers = this.allUsers.filter(employee => {
      // Filtre par terme de recherche
      const matchesSearch = !term || 
        employee.lastName?.toLowerCase().includes(term) ||
        employee.firstName?.toLowerCase().includes(term) ||
        employee.email?.toLowerCase().includes(term);

      // Filtre par rôle - avec trim et vérification null
      const matchesRole = !this.selectedRole || 
        employee.role?.toLowerCase().trim() === this.selectedRole.toLowerCase().trim();

      // Filtre par équipe
      const matchesTeam = !this.selectedTeamFilter || 
        (this.selectedTeamFilter === 'no-team' && !employee.team) ||
        employee.team?.id === this.selectedTeamFilter;

      // Filtre par type d'équipe (field)
      const matchesTeamField = !this.selectedTeamField ||
        employee.team?.field === this.selectedTeamField;

      return matchesSearch && matchesRole && matchesTeam && matchesTeamField;
    });
  }

  onQueryChange(value: string) {
    this.q$.next(value.trim());
  }

  clear() {
    this.query = '';
    this.selectedRole = '';
    this.selectedTeamFilter = '';
    this.selectedTeamField = '';
    this.filteredUsers = this.allUsers;
    this.q$.next('');
    this.changeSearch.emit('');
  }

  onRoleFilterChange(role: string) {
    this.selectedRole = role;
    this.applyFilters();
  }

  onTeamFilterChange(teamId: string) {
    this.selectedTeamFilter = teamId;
    this.applyFilters();
  }

  onTeamFieldFilterChange(field: string) {
    this.selectedTeamField = field;
    this.applyFilters();
  }

  applyFilters() {
    this.filterUsers(this.query);
  }

  openFilters() {
    this.openOptions.emit();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  displayEmployeeData(employeeId: string, editable: boolean): void {
    this.selectedEmployee = this.filteredUsers.find(emp => emp.id === employeeId);
    const manager = this.selectedEmployee?.team?.members?.find(emp => emp.role.toLowerCase() == "manager") || '';
    if (manager) {
      this.managerName = manager.firstName + ' ' + manager.lastName;
    }
    this.editableDrawer = editable;
    this.isDrawerOpen = true;
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    this.selectedEmployee = undefined;
    this.editableDrawer = false;
  }

  saveEmployeeChanges(updatedEmployee: any): void {
    // Ta logique de sauvegarde ici
    console.log('Sauvegarde:', updatedEmployee);

    // Exemple: mettre à jour dans la liste
    const index = this.filteredUsers.findIndex(emp => emp.id === updatedEmployee.id);
    if (index !== -1) {
      this.filteredUsers[index] = updatedEmployee;
    }

    this.closeDrawer();
  }

  displayTeamData(teamId: string): void {
    this.selectedTeam = this.teams.find(team => team.id === teamId);
    this.isTeamDrawerOpen = true;
  }

  openDialog(id: string): void {
    this.dialog.open(DeleteDialog, {
      data: {
        title: "Supprimer un employé",
        message: "Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible.",
        cancel: "Annuler",
        confirm: "Supprimer",
        onConfirm: (dialogRef: MatDialogRef<DeleteDialog>) => {
          this.userService.deleteUser(id).then(() => {
            this.snackBarService.showSuccess('Employé supprimé avec succès');
            this.loadUsers();
            window.location.reload();
            dialogRef.close();
          }).catch((err) => {
            console.error('Erreur lors de la suppression:', err);
            this.snackBarService.showError('Erreur lors de la suppression de l\'employé');
            dialogRef.close();
          });
        },
        onCancel: (dialogRef: MatDialogRef<DeleteDialog>) => {
          dialogRef.close();
        },
      },
      panelClass: 'custom-dialog-container'
    })
  }

  add(): void {
    this.dialog.open(AddEmployee)
  }

  export(): void {
    try {
      const columns = [
        { header: 'Nom', key: 'lastName', width: 20 },
        { header: 'Prénom', key: 'firstName', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Téléphone', key: 'telephone', width: 15 },
        { header: 'Équipe', key: 'team', width: 20 },
        { header: 'Poste', key: 'role', width: 25 },
      ];

      this.exportService.exportWithCustomColumns(
        this.allUsers,
        columns,
        'employes-details',
        'Liste détaillée'
      );
      this.snackBarService.showSuccess('Export Excel généré avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      this.snackBarService.showError('Erreur lors de l\'export Excel');
    }
  }

  closeTeamDrawer(): void {
    this.isTeamDrawerOpen = false;
    this.selectedTeam = undefined;
  }

  onMemberClick(memberId: number): void {
    this.selectedEmployee = this.allUsers.find((user) => user.id === String(memberId));
    this.isDrawerOpen = true;
  }
}
