import { Scheduler } from '../../../features/main-layout/scheduler/scheduler';
import {AfterViewInit, Component, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges, inject} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import {FormsModule} from '@angular/forms';
import {NgIf} from '@angular/common';
import {BasicTextButton} from '../basic-text-button/basic-text-button';
import {TranslatePipe} from '@ngx-translate/core';
import {UserService} from '../../../services/user.service';
import {PointService} from '../../../services/point.service';
import {ExcelExportService} from '../../../services/excel-export.service';
import {User} from '../../../models/user.model';
import {firstValueFrom} from 'rxjs';
import {BasicTextField} from '../basic-text-field/basic-text-field';
import { SnackBarService } from '../../../services/snackbar.service';


@Component({
  selector: 'app-employee-drawer',
  standalone: true,
  templateUrl: './employee-drawer.html',
  styleUrls: ['./employee-drawer.css'],
  imports: [
    FormsModule,
    NgIf,
    BasicTextButton,
    TranslatePipe,
    Scheduler,
    BasicTextField
  ],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({transform: 'translateX(100%)'}),
        animate('300ms ease-out', style({transform: 'translateX(0)'}))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({transform: 'translateX(100%)'}))
      ])
    ])
  ]
})
export class EmployeeDrawer implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() employee: User | undefined;
  @Input() isEditable: boolean = false;
  @Input() manager: string = '';

  @Output() closeDrawer = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();
  @Output() Error = new EventEmitter<string>();


  private currentMonthWork: any
  private userId: number | undefined;
  saving: boolean = false;
  effectiveHours: string = '0h 0m';  // Changé de private à public

  private snackBarService = inject(SnackBarService);

  constructor(
    private pointService: PointService,
    private excelExportService: ExcelExportService,
    private userService: UserService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // When switching to editable mode, ensure nested objects exist to avoid template errors
    if (changes['isEditable'] && this.isEditable && this.employee) {
      if (!this.employee.team) {
        this.employee.team = { name: '' } as any;
      }
      // Ensure address and emergencyContact objects exist
      if (!this.employee.address) {
        this.employee.address = {
          number: '',
          street: '',
          postalCode: '',
          city: '',
          state: ''
        };
      }
      if (!this.employee.emergencyContact) {
        this.employee.emergencyContact = {
          courtesy: '',
          firstName: '',
          lastName: '',
          relation: '',
          phoneNumber: ''
        };
      }
    }
    // If employee input changed, ensure team exists and load effective hours
    if (changes['employee'] && this.employee) {
      if (this.isEditable && !this.employee.team) {
        this.employee.team = { name: '' } as any;
      }
      // Ensure address and emergencyContact objects exist when employee changes
      if (this.isEditable) {
        if (!this.employee.address) {
          this.employee.address = {
            number: '',
            street: '',
            postalCode: '',
            city: '',
            state: ''
          };
        }
        if (!this.employee.emergencyContact) {
          this.employee.emergencyContact = {
            courtesy: '',
            firstName: '',
            lastName: '',
            relation: '',
            phoneNumber: ''
          };
        }
      }
      // Charger les heures effectives
      this.loadEffectiveHours();
    }
  }

  private async loadEffectiveHours(): Promise<void> {
    if (!this.employee || !this.employee.id) {
      this.effectiveHours = '0h 0m';
      return;
    }

    try {
      const userId = Number(this.employee.id);

      // Récupérer tous les calendars de l'utilisateur
      const calendars = await firstValueFrom(
        this.pointService.getAllCalendarsByUser(userId)
      );

      // Calculer le total des secondes
      let totalSeconds = 0;

      calendars.forEach(calendar => {
        if (calendar.duration) {
          totalSeconds += calendar.duration; // duration est en secondes (int)
        }
      });

      // Convertir en heures et minutes
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      this.effectiveHours = `${hours}h ${minutes}m`;
    } catch (error) {
      // console.error('Erreur lors du chargement des heures effectives:', error);
      this.effectiveHours = '0h 0m';
    }
  }

  close(): void {
    this.closeDrawer.emit();
  }

  async export(): Promise<void> {
    if (!this.employee || !this.employee.id) {
      // console.error('Aucun employé sélectionné');
      return;
    }

    try {
      const userId = Number(this.employee.id);

      // Récupérer toutes les entrées Calendar de l'utilisateur
      const calendars = await firstValueFrom(
        this.pointService.getAllCalendarsByUser(userId)
      );

      // Préparer les données pour l'export Excel
      const exportData: any[] = [];

      // 1. Section informations personnelles
      exportData.push({ Champ: 'INFORMATIONS PERSONNELLES', Valeur: '' });
      exportData.push({ Champ: 'Nom', Valeur: this.employee.lastName || '' });
      exportData.push({ Champ: 'Prénom', Valeur: this.employee.firstName || '' });
      exportData.push({ Champ: 'Date de naissance', Valeur: this.employee.birthDate || '' });
      exportData.push({ Champ: 'Situation familiale', Valeur: this.employee.familySituation || '' });
      exportData.push({ Champ: 'Email', Valeur: this.employee.email || '' });
      exportData.push({ Champ: 'Email personnel', Valeur: this.employee.personalEmail || '' });
      exportData.push({ Champ: 'Téléphone', Valeur: this.employee.telephone || '' });
      exportData.push({ Champ: 'Rôle', Valeur: this.employee.role || '' });
      exportData.push({ Champ: 'Équipe', Valeur: this.employee.team?.name || '' });
      exportData.push({ Champ: 'Numéros de Sécurité Social', Valeur: this.employee.socialNumber || '' });
      exportData.push({ Champ: 'Type de contrat', Valeur: this.employee.contract || '' });
      exportData.push({ Champ: "Date d'arriver", Valeur: this.employee.arrivalDate || '' });
      exportData.push({ Champ: 'Salaire annuel', Valeur: this.employee.annualSalary || '' });
      exportData.push({ Champ: 'Adresse', Valeur: `${this.employee.address.number} ${this.employee.address.street}, ${this.employee.address.postalCode} ${this.employee.address.city}, ${this.employee.address.state}` });
      exportData.push({ Champ: "Contact d'urgence", Valeur: `${this.employee.emergencyContact.courtesy}, ${this.employee.emergencyContact.firstName} ${this.employee.emergencyContact.lastName}; ` });
      exportData.push({ Champ: '', Valeur: '' }); // Ligne vide

      // 2. Section entrées Calendar
      exportData.push({ Champ: 'ENTRÉES CALENDRIER', Valeur: '' });

      // En-têtes du tableau
      exportData.push({
        Champ: 'Date de début',
        Valeur: 'Date de fin',
        'Type de jour': 'Type de jour',
        Durée: 'Durée',
        'Jour terminé': 'Jour terminé'
      });

      // Trier les calendriers par date de début (ordre chronologique)
      const sortedCalendars = [...calendars].sort((a, b) => {
        const dateA = new Date(a.begin).getTime();
        const dateB = new Date(b.begin).getTime();
        return dateA - dateB;
      });

      // Ajouter chaque entrée Calendar
      sortedCalendars.forEach(calendar => {
        const beginDate = calendar.begin ? new Date(calendar.begin).toLocaleString('fr-FR') : '';
        const endDate = calendar.end ? new Date(calendar.end).toLocaleString('fr-FR') : '';
        const duration = calendar.durationFormatted || '';
        const dayType = calendar.dayType || '';
        const dayOver = calendar.dayOver ? 'Oui' : 'Non';

        exportData.push({
          Champ: beginDate,
          Valeur: endDate,
          'Type de jour': dayType,
          Durée: duration,
          'Jour terminé': dayOver
        });
      });

      // Exporter vers Excel
      const fileName = `export_${this.employee.firstName}_${this.employee.lastName}_${new Date().toISOString().split('T')[0]}`;
      this.excelExportService.exportToExcel(
        exportData,
        fileName,
        'Export Employé'
      );
      this.snackBarService.showSuccess('Export Excel généré avec succès');

    } catch (error) {
      // console.error('❌ Erreur lors de l\'export:', error);
      this.snackBarService.showError('Erreur lors de l\'export Excel');
    }
  }

  async saveChanges(): Promise<void> {
    if (!this.employee) return;
    this.saving = true;
    try {
      // Call userService.updateUser with the full employee object
      // pass employee id so backend updates the selected user (if caller has rights)
      const updated = await this.userService.updateUser(this.employee, this.employee.id);

      // Emit updated user (fall back to local employee if backend returns null)
      this.save.emit(updated ?? this.employee);
      if (updated) this.employee = updated;
      this.snackBarService.showSuccess('Modifications sauvegardées avec succès');
      this.close();
    } catch (err: any) {
      // console.error('Erreur lors de la sauvegarde de l\'utilisateur :', err);
      // Friendly message for common backend unique constraint on email
      let errorMessage = 'Erreur lors de la sauvegarde de l\'utilisateur';
      try {
        const message = err && (err.message || (err.graphQLErrors && err.graphQLErrors[0] && err.graphQLErrors[0].message));
        if (message && String(message).includes('duplicate key value')) {
          errorMessage = 'Cet email est déjà utilisé par un autre utilisateur';
        }
      } catch (e) {
        // Ignore parsing errors
      }
      this.snackBarService.showError(errorMessage);
    } finally {
      this.saving = false;
    }
  }

  protected readonly Number = Number;
}
