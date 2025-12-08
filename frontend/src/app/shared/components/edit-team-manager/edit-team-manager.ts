import {Component, Inject} from '@angular/core';
import {BasicTextButton} from "../basic-text-button/basic-text-button";
import {MatDialogRef} from '@angular/material/dialog';
import {DIALOG_DATA, DialogModule} from '@angular/cdk/dialog';
import {BasicDropdown, DropdownOption} from '../basic-dropdown/basic-dropdown';
import {User} from '../../../models/user.model';

export interface EditTeamManager {
  title: string;
  message: string;
  confirm: string;
  managers: User[];
  onConfirm: (
    dialogRef: MatDialogRef<EditTeamManager>,
    newManager: User | undefined,
  ) => void;
  cancel: string;
  onCancel: (dialogRef: MatDialogRef<EditTeamManager>) => void;
}

@Component({
  selector: 'app-edit-team-manager',
  imports: [
    DialogModule,
    BasicTextButton,
    BasicDropdown,
  ],
  templateUrl: './edit-team-manager.html',
  styleUrl: './edit-team-manager.css'
})
export class EditTeamManager {

  managersList: DropdownOption[] = [];
  managers: User[] = [];
  managerSelected: User | undefined;
  isManager: boolean = true;

  constructor(
    public dialog: MatDialogRef<EditTeamManager>,
    @Inject(DIALOG_DATA) public data: EditTeamManager,
  ) {
    this.data.managers.forEach( user => {
      this.managersList.push({
        label: user.firstName + user.lastName,
        value: Number(user.id)
      })
    })
  }

  onChangeManager(managerId: number): void {
    this.managerSelected = this.data.managers.find(manager => manager.id === managerId.toString());
    this.isValid()
  }

  isValid(): void {
    if (this.managerSelected) {
      this.isManager = false;
    }
  }
}
