import { Component, EventEmitter, Output, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/user.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DeleteDialog } from '../../../../shared/components/delete-dialog/delete-dialog';
import { DropdownOption } from '../../../../shared/components/basic-dropdown/basic-dropdown';

@Component({
  selector: 'app-employee-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css'
})
export class EmployeeList implements OnDestroy {
  @Output() search = new EventEmitter<string>();
  @Output() openOptions = new EventEmitter<void>();

  public allUsers: User[] = [];
  public filteredUsers: User[] = [];

  selectedEmployee: User | null = null;
  isModalOpen: boolean = false;
  editableModal: boolean = true;
  query: string = '';

  placeHolderText: string = "No data";

  dropdownOptions: DropdownOption[] = [
    { label: 'Ryan Wittert', value: 1 },
    { label: 'Antoine Ribeyre ', value: 2 },
    { label: 'Joan Guillard', value: 3 },
    {label: 'Houssem Jeguirim', value: 4}
  ];

  private q$ = new Subject<string>();
  private sub: Subscription;

  constructor(private userService: UserService,private dialog : MatDialog) {
    this.sub = this.q$.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(q => {
      this.filterUsers(q);
      this.search.emit(q);
    });
    this.loadUsers();
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

  displayEmployeeData(id: string, editable: boolean) {
    const user = this.allUsers.find(user => user.id === id);
    if (user) {
      this.selectedEmployee = user;
      this.isModalOpen = true;
      this.editableModal = editable;
      console.log(editable)
    }
  }

  async saveChanges() {
  if (!this.selectedEmployee) return;

  // try {
  //   await this.userService.updateUser(this.selectedEmployee.id, this.selectedEmployee);
  //   // Mets à jour la liste locale
  //   const index = this.allUsers.findIndex(u => u.id === this.selectedEmployee!.id);
  //   if (index !== -1) this.allUsers[index] = { ...this.selectedEmployee };
  //   this.filteredUsers = [...this.allUsers];
  //   this.closeModal();
  // } catch (error) {
  //   console.error('Erreur lors de la sauvegarde:', error);
  // }
}

  closeModal() {
    this.isModalOpen = false;
    this.selectedEmployee = null;
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
}