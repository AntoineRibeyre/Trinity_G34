import { Component, EventEmitter, Output, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/user.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DeleteDialog } from '../../../../shared/components/delete-dialog/delete-dialog';
import { DropdownOption } from '../../../../shared/components/basic-dropdown/basic-dropdown';
import {BasicTextField} from '../../../../shared/components/basic-text-field/basic-text-field';
import {TranslatePipe} from '@ngx-translate/core';
import {EmployeeDrawer} from '../../../../shared/components/employee-drawer/employee-drawer';
import {ExcelExportService} from '../../../../services/excel-export.service';
import { Team } from '../../../../models/team.model';
import { TeamService } from '../../../../services/team.service';
import {TeamDrawer} from '../../../../shared/components/team-drawer/team-drawer';

@Component({
  selector: 'app-employee-list',
  imports: [CommonModule, FormsModule, BasicTextField, TranslatePipe, EmployeeDrawer, TeamDrawer],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css'
})
export class EmployeeList implements OnDestroy, OnInit {
  @Output() search = new EventEmitter<string>();
  @Output() openOptions = new EventEmitter<void>();

  public allUsers: User[] = [];
  public filteredUsers: User[] = [];

  teams: Team[] = [];

  selectedEmployee: User | undefined = undefined;
  isDrawerOpen: boolean = false;
  editableDrawer: boolean = false;
  query: string = '';

  selectedTeam: Team | undefined = undefined;
  isTeamDrawerOpen: boolean = false;
  placeHolderText: string = "No data";
  managerName: string = '';

  private teamSub?: Subscription;

  dropdownOptions: DropdownOption[] = [
    { label: 'Ryan Wittert', value: 1 },
    { label: 'Antoine Ribeyre ', value: 2 },
    { label: 'Joan Guillard', value: 3 },
    {label: 'Houssem Jeguirim', value: 4}
  ];

  private q$ = new Subject<string>();
  private sub: Subscription;

  constructor(
    private userService: UserService,
    private dialog : MatDialog,
    private exportService: ExcelExportService,
    private teamService: TeamService
  ) {
    this.sub = this.q$.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(q => {
      this.filterUsers(q);
      this.search.emit(q);
    });
    this.loadUsers();
  }
  ngOnInit(): void {
    this.teamSub = this.teamService.getAllTeams().subscribe({
      next: (teams) => {
        this.teams = teams;
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
    if (!searchTerm || searchTerm === '') {
      this.filteredUsers = this.allUsers;
      return;
    }

    const term = searchTerm.toLowerCase();

    this.filteredUsers = this.allUsers.filter(employee => {
      const lastName = employee.lastName?.toLowerCase() || '';
      const firstName = employee.firstName?.toLowerCase() || '';
      const email = employee.email?.toLowerCase() || '';

      return lastName.includes(term) ||
             firstName.includes(term) ||
             email.includes(term);
    });
  }

  onQueryChange(value: string) {
    this.q$.next(value.trim());
  }

  clear() {
    this.query = '';
    this.filteredUsers = this.allUsers;
    this.q$.next('');
    this.search.emit('');
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
    console.log("selected employee: " + this.selectedEmployee?.lastName)
    console.log("manager: " + manager)
    console.log("team members: " + this.selectedEmployee?.team?.members?.length)
    if (manager) {
      this.managerName = manager.firstName + ' ' + manager.lastName;
    }
    console.log("manager name: " + this.managerName)
    this.editableDrawer = editable;
    this.isDrawerOpen = true;
    console.log("tessssssssst")
    console.log(this.selectedEmployee)
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
        dropdownOptions: this.dropdownOptions,
        onConfirm: (dialogRef: MatDialogRef<DeleteDialog>) => {
          this.userService.deleteUser(id)
          this.loadUsers();
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

  export(): void {
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
