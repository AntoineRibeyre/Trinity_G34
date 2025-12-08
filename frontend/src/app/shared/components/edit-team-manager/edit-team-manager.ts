import {Component, Inject} from '@angular/core';
import {BasicTextButton} from "../basic-text-button/basic-text-button";
import {MatDialogRef} from '@angular/material/dialog';
import {DIALOG_DATA, DialogModule} from '@angular/cdk/dialog';

export interface EditTeamManager {
  title: string;
  message: string;
  confirm: string;
  onConfirm: (dialogRef: MatDialogRef<EditTeamManager>) => void;
  cancel: string;
  onCancel: (dialogRef: MatDialogRef<EditTeamManager>) => void;
}

@Component({
  selector: 'app-edit-team-manager',
    imports: [
      DialogModule,
      BasicTextButton,
    ],
  templateUrl: './edit-team-manager.html',
  styleUrl: './edit-team-manager.css'
})
export class EditTeamManager {

  constructor(
    public dialog: MatDialogRef<EditTeamManager>,
    @Inject(DIALOG_DATA) public data: EditTeamManager,
  ) {}
}
