import {Component, inject, Inject} from '@angular/core';
import {BasicTextButton} from '../basic-text-button/basic-text-button';
import {MatDialogRef} from '@angular/material/dialog';
import {DIALOG_DATA} from '@angular/cdk/dialog';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';

export interface ExportPeriodDialog {
  title: string;
  confirm: string;
  cancel: string;
  onConfirm: (
    dialogRef: MatDialogRef<ExportPeriodDialog>,
    startDate: string | null,
    endDate: string | null
  ) => void;
  onCancel: (dialogRef: MatDialogRef<ExportPeriodDialog>) => void;
}

@Component({
  selector: 'app-export-period-dialog',
  imports: [
    BasicTextButton,
    TranslatePipe,
    FormsModule,
    CommonModule
  ],
  templateUrl: './export-period-dialog.html',
  styleUrl: './export-period-dialog.css'
})
export class ExportPeriodDialog {
  translate: TranslateService = inject(TranslateService);
  isSelected: boolean = false;
  startDate: string | null = null;
  endDate: string | null = null;

  startDateLabel: string = this.translate.instant('TEAM.DIALOG.EXPORT-PERIOD.START-DATE');
  endDateLabel: string = this.translate.instant('TEAM.DIALOG.EXPORT-PERIOD.END-DATE');

  constructor(
    public dialog: MatDialogRef<ExportPeriodDialog>,
    @Inject(DIALOG_DATA) public data: ExportPeriodDialog,
  ) {
    // Initialiser avec la date d'aujourd'hui pour la fin et il y a 30 jours pour le début
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    this.endDate = this.formatDateForInput(today);
    this.startDate = this.formatDateForInput(thirtyDaysAgo);
    this.isValid();
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onChangeStartDate(date: string): void {
    this.startDate = date;
    this.isValid();
  }

  onChangeEndDate(date: string): void {
    this.endDate = date;
    this.isValid();
  }

  isValid(): void {
    if (!this.startDate || !this.endDate) {
      this.isSelected = false;
      return;
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    // Vérifier que la date de début est avant la date de fin
    this.isSelected = start <= end;
  }
}

