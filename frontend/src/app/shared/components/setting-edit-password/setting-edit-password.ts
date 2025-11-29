import {Component, inject, Inject} from '@angular/core';
import {BasicDropdown, DropdownOption} from "../basic-dropdown/basic-dropdown";
import {BasicTextButton} from "../basic-text-button/basic-text-button";
import {BasicTextField} from "../basic-text-field/basic-text-field";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {MatDialogRef} from '@angular/material/dialog';
import {DIALOG_DATA} from '@angular/cdk/dialog';
import {CreateTeamDialog} from '../create-team-dialog/create-team-dialog';

export interface EditPasswordDialog {
  title: string;
  confirm: string;
  onConfirm: (
    dialogRef: MatDialogRef<SettingEditPassword>,
    password: string | null,
  ) => void;
  cancel: string;
  onCancel: (dialogRef: MatDialogRef<SettingEditPassword>) => void;
}


@Component({
  selector: 'app-setting-edit-password',
    imports: [
        BasicDropdown,
        BasicTextButton,
        BasicTextField,
        TranslatePipe
    ],
  templateUrl: './setting-edit-password.html',
  styleUrl: './setting-edit-password.css'
})
export class SettingEditPassword {

  translate: TranslateService = inject(TranslateService);
  newPassword: string | null = null;
  confirmPassword: string | null = null;
  isSelected: boolean = false;


  constructor(
    public dialog: MatDialogRef<SettingEditPassword>,
    @Inject(DIALOG_DATA) public data: EditPasswordDialog,
  ) {}

  onChangePassword(password: string): void {
    this.newPassword = password;
    this.isValid()
  }

  onConfirmChangePassword(password: string): void {
    this.confirmPassword = password;
    this.isValid()
  }

  isValid(): void {
    this.isSelected = (this.newPassword === this.confirmPassword);
  }
}
