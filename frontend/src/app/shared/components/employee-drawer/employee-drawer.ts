import { Scheduler } from '../../../features/main-layout/scheduler/scheduler';
import {AfterViewInit, Component, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges} from '@angular/core';
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
    Scheduler
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
  @Input() employee: any = null;
  @Input() isEditable: boolean = false;
  @Input() manager: string = '';

  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();
  @Output() onError = new EventEmitter<string>();


  private currentMonthWork: any
  private userId: number | undefined;
  saving: boolean = false;
  

  constructor(
    private pointService: PointService,
    private excelExportService: ExcelExportService,
    private userService: UserService
  ) {

  }


  ngOnChanges(changes: SimpleChanges): void {
    // When switching to editable mode, ensure nested objects exist to avoid template errors
    if (changes['isEditable'] && this.isEditable && this.employee) {
      if (!this.employee.team) {
        this.employee.team = { name: '' } as any;
      }
      // ensure other nested fields exist if needed in future
    }
    // If employee input changed, ensure team exists
    if (changes['employee'] && this.employee) {
      if (this.isEditable && !this.employee.team) {
        this.employee.team = { name: '' } as any;
      }
    }
  }


  close(): void {
    this.onClose.emit();
  }

  async export(): Promise<void> {
    if (!this.employee || !this.employee.id) {
      console.error('Aucun employé sélectionné');
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
      exportData.push({ Champ: 'Email', Valeur: this.employee.email || '' });
      exportData.push({ Champ: 'Téléphone', Valeur: this.employee.telephone || '' });
      exportData.push({ Champ: 'Rôle', Valeur: this.employee.role || '' });
      exportData.push({ Champ: 'Équipe', Valeur: this.employee.team?.name || '' });
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

    } catch (error) {
      console.error('❌ Erreur lors de l\'export:', error);
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
      this.onSave.emit(updated ?? this.employee);
      if (updated) this.employee = updated;
      this.close();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de l\'utilisateur :', err);
      // Friendly message for common backend unique constraint on email
      // try {
      //   const message = err && (err.message || (err.graphQLErrors && err.graphQLErrors[0] && err.graphQLErrors[0].message));
      //   if (message && String(message).includes('duplicate key value')) {
      //     alert('Erreur : cet email est déjà utilisé par un autre utilisateur.');
      //   } else {
      //     alert('Erreur lors de la sauvegarde de l\'utilisateur. Voir la console pour plus de détails.');
      //   }
    }
  }
}      