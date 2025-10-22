import { Component, EventEmitter, Output, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/user.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 


@Component({
  selector: 'app-employee-list',
  imports: [CommonModule,
    FormsModule],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css'
})
export class EmployeeList {
  //Pour la search-bar
  @Output() search = new EventEmitter<string>();
  @Output() openOptions = new EventEmitter<void>();

  public allUsers: User[] = [];
  
  query: string = '';

  private q$ = new Subject<string>();
  private sub: Subscription;

  constructor(private userService: UserService) {
    // émets la valeur après 300ms d'inactivité et seulement si différente
    this.sub = this.q$.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(q => {
      this.search.emit(q);
    });
  }


  async loadUsers() {
    try {
      this.allUsers = await this.userService.getAllUsers();
      console.log('Utilisateurs chargés:', this.allUsers);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  }

  onQueryChange(value: string) {
    // appelé à chaque frappe via ngModelChange
    this.q$.next(value.trim());
  }

  clear() {
    this.query = '';
    this.q$.next('');
    this.search.emit('');
  }

  openFilters() {
    this.openOptions.emit();
  }

  

  ngOnDestroy() {
  this.sub.unsubscribe();
}

}
