import {Component, inject, Inject} from '@angular/core';
import {BasicDropdown, DropdownOption} from '../basic-dropdown/basic-dropdown';
import {BasicTextButton} from '../basic-text-button/basic-text-button';
import {MatDialogRef} from '@angular/material/dialog';
import {DIALOG_DATA} from '@angular/cdk/dialog';
import {BasicTextField} from '../basic-text-field/basic-text-field';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {FormsModule} from '@angular/forms';

export interface CreateTeamDialog {
  title: string;
  confirm: string;
  managerList: DropdownOption[];
  dropdownOptions: DropdownOption[];
  onConfirm: (
    dialogRef: MatDialogRef<CreateTeamDialog>,
    teamName: string | null,
    teamField: number | null,
    manager : number | null,
    teamDescription: string | null
  ) => void;
  cancel: string;
  onCancel: (dialogRef: MatDialogRef<CreateTeamDialog>) => void;
}

@Component({
  selector: 'app-create-team-dialog',
  imports: [
    BasicDropdown,
    BasicTextButton,
    BasicTextField,
    TranslatePipe,
    FormsModule
  ],
  templateUrl: './create-team-dialog.html',
  styleUrl: './create-team-dialog.css'
})
export class CreateTeamDialog {

  translate: TranslateService = inject(TranslateService);
  isSelected: boolean = false;
  teamName: string | null = null;
  teamField: number | null = null;
  teamDescription: string | null = null;
  manager: number | null = null;

  namePlaceholder: string = this.translate.instant('TEAM.DIALOG.CREATE-TEAM.NAME-PLACEHOLDER');
  fieldPlaceholder: string = this.translate.instant('TEAM.DIALOG.CREATE-TEAM.FIELD-PLACEHOLDER');
  descriptionPlaceholder: string = this.translate.instant('TEAM.DIALOG.CREATE-TEAM.DESCRIPTION-PLACEHOLDER');
  managerPlaceholder: string = this.translate.instant('TEAM.DIALOG.CREATE-TEAM.MANAGER-PLACEHOLDER');

  constructor(
    public dialog: MatDialogRef<CreateTeamDialog>,
    @Inject(DIALOG_DATA) public data: CreateTeamDialog,
  ) {}

  onChangeName(name: string): void {
    this.teamName = name;
    this.isValid()
  }

  onChangeField(fieldId: number): void {
    this.teamField = fieldId;
    this.isValid()
  }

  onChangeManager(managerID: number): void {
    this.manager = managerID;
    this.isValid()
  }

  onChangeDescription(description: string): void {
    this.teamDescription = description
    this.isValid()
  }

  isValid(): void {
    this.isSelected = !!(this.teamName &&
      this.teamField &&
      this.teamDescription && this.manager);
  }
}
