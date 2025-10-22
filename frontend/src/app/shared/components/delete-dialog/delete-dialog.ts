import {Component, Inject} from '@angular/core';
import {DIALOG_DATA, DialogModule} from '@angular/cdk/dialog';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';

export interface DeleteDialog {
  title: string;
  message: string;
  confirm: string;
  onConfirm: (dialogRef: MatDialogRef<DeleteDialog>) => void;
  cancel: string;
  onCancel: (dialogRef: MatDialogRef<DeleteDialog>) => void;
}

@Component({
  selector: 'app-delete-dialog',
  imports: [
    DialogModule,
  ],
  templateUrl: './delete-dialog.html',
  styleUrl: './delete-dialog.css'
})
export class DeleteDialog {

  constructor(
    public dialog: MatDialogRef<DeleteDialog>,
    @Inject(DIALOG_DATA) public data: DeleteDialog,
  ) {}
}
