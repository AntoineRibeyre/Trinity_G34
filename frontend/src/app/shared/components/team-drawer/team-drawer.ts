import {Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BasicTextButton } from '../basic-text-button/basic-text-button';
import { TranslatePipe } from '@ngx-translate/core';
import { Team } from '../../../models/team.model';
import { User } from '../../../models/user.model';
import {BasicTextField} from '../basic-text-field/basic-text-field';
import { TeamService } from '../../../services/team.service';
import { DeleteDialog } from '../delete-dialog/delete-dialog';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

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

  @Output() onClose = new EventEmitter<void>();
  @Output() onMemberClick = new EventEmitter<number>();
  @Output() onTeamDeleted = new EventEmitter<number>();
  @Output() onTeamUpdated = new EventEmitter<Team>();

  constructor(private teamService: TeamService,private dialog : MatDialog) {}

  isEditable: boolean = false;
  teamManager: User | undefined;
  
  // Créer une copie mutable pour l'édition
  editableTeam: Team | undefined;
  private originalTeam: Team | undefined;

  // Supprimer ngOnInit et garder uniquement ngOnChanges
  ngOnChanges(changes: SimpleChanges): void {
    console.log('ngOnChanges appelé', changes);
    
    // Initialiser dès que team change ou au premier chargement
    if (changes['team']) {
      console.log('Team changé:', changes['team'].currentValue);
      this.initializeTeam();
    }
    
    // Réinitialiser aussi quand le drawer s'ouvre
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      console.log('Drawer ouvert, réinitialisation');
      this.initializeTeam();
    }
  }

  private initializeTeam(): void {
    console.log('initializeTeam appelé avec team:', this.team);
    
    if (this.team) {
      try {
        // Créer une copie profonde pour l'édition
        this.editableTeam = JSON.parse(JSON.stringify(this.team));
        this.originalTeam = JSON.parse(JSON.stringify(this.team));
        
        console.log('editableTeam créé:', this.editableTeam);
        console.log('originalTeam créé:', this.originalTeam);
        
        this.updateTeamManager();
      } catch (error) {
        console.error('Erreur lors de la copie de team:', error);
      }
    } else {
      console.warn('Team est undefined, impossible d\'initialiser');
      this.editableTeam = undefined;
      this.originalTeam = undefined;
    }
  }

  private updateTeamManager(): void {
    if (this.editableTeam?.members) {
      this.teamManager = this.editableTeam.members.find(user => user.role === "manager");
      console.log('Team manager trouvé:', this.teamManager);
    }
  }

  onChangeName(name: string): void {
    console.log('onChangeName appelé avec:', name);
    
    if (!this.editableTeam) {
      console.error('Impossible de mettre à jour : équipe non définie');
      return;
    }
    
    // Modifier la copie mutable
    this.editableTeam.name = name;
    console.log('Nom mis à jour:', this.editableTeam.name);
  }

  onChangeDescription(description: string): void {
    console.log('onChangeDescription appelé avec:', description);
    
    if (!this.editableTeam) {
      console.error('Impossible de mettre à jour : équipe non définie');
      return;
    }
    
    // Modifier la copie mutable
    this.editableTeam.description = description;
    console.log('Description mise à jour:', this.editableTeam.description);
  }

  close(): void {
    this.isEditable = false;
    this.onClose.emit();
  }

  toggleEdit(): void {
    this.isEditable = true;
    // Sauvegarder l'état actuel avant modification
    if (this.editableTeam) {
      this.originalTeam = JSON.parse(JSON.stringify(this.editableTeam));
      console.log('Mode édition activé, sauvegarde originale:', this.originalTeam);
    }
  }

  cancelEdit(): void {
    // Restaurer les valeurs originales
    if (this.originalTeam) {
      this.editableTeam = JSON.parse(JSON.stringify(this.originalTeam));
      console.log('Modifications annulées, restauration:', this.editableTeam);
    }
    this.isEditable = false;
  }

  saveChanges(): void {
    if (!this.editableTeam?.id) {
      console.error('Impossible de sauvegarder : équipe non définie');
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

    console.log('Données à sauvegarder:', updatedData);

    if (Object.keys(updatedData).length === 0) {
      console.log('Aucune modification à sauvegarder');
      this.isEditable = false;
      return;
    }

    this.teamService.updateTeam( updatedData).subscribe({
      next: (response) => {
        console.log('Équipe mise à jour:', response.message);
        
        // Mettre à jour les valeurs
        if (this.editableTeam) {
          this.originalTeam = JSON.parse(JSON.stringify(this.editableTeam));
        }
        
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour:', err);
        alert('Erreur lors de la sauvegarde des modifications');
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
            console.error('Impossible de supprimer : équipe non définie');
            return;
          }


          this.teamService.deleteTeam(Number(this.editableTeam.id)).subscribe({
            next: (response) => {
              console.log('✅ Équipe supprimée avec succès', response);
              this.onTeamDeleted.emit(Number(this.editableTeam!.id));
              window.location.reload();
              this.close();
            },
            error: (err) => {
              console.error('Erreur lors de la suppression:', err);
              alert('Erreur lors de la suppression de l\'équipe');
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

  openMemberDetails(memberId: String, event: Event): void {
    event.stopPropagation();
    this.onMemberClick.emit(Number(memberId));
  }
}