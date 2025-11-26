import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BasicTextButton } from '../basic-text-button/basic-text-button';
import { TranslatePipe } from '@ngx-translate/core';
import { Team } from '../../../models/team.model';
import { User } from '../../../models/user.model';
import {BasicTextField} from '../basic-text-field/basic-text-field';
import { TeamService } from '../../../services/team.service';

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
export class TeamDrawer implements OnInit {

  
  @Input() isOpen: boolean = false;
  @Input() team: Team | undefined = undefined;

  @Output() onClose = new EventEmitter<void>();
  @Output() onMemberClick = new EventEmitter<string>();

  constructor(private teamService: TeamService){
    
  }

  isEditable: boolean = false;
  teamManager: User | undefined;

  ngOnInit() {
    this.updateTeamManager();
  }

  private updateTeamManager(): void {
    this.teamManager = this.team?.members?.find(user => user.role === "manager");
  }

  onChangeName(name: string): void {

  }

  onChangeDescription(description: string): void {

  }

  close(): void {
    this.isEditable = false;
    this.onClose.emit();
  }

  toggleEdit(): void {
    this.isEditable = true;
  }

  cancelEdit(): void {
    this.isEditable = false;
  }

  saveChanges(): void {

  }

deleteTeam(): void {
  // ✅ Vérification que team existe et a un id
  if (!this.team?.id) {
    console.error('Impossible de supprimer : équipe non définie');
    return;
  }

  this.teamService.deleteTeam(Number(this.team.id)).subscribe({
    next: (response) => {
      console.log('Équipe supprimée avec succès', response);
      window.location.reload();
      this.close(); // Ferme le drawer après suppression
    },
    error: (err) => {
      console.error('Erreur lors de la suppression de l\'équipe:', err);
    }
  });
}

  openMemberDetails(memberId: string, event: Event): void {
    event.stopPropagation();
    this.onMemberClick.emit(memberId);
  }
}
