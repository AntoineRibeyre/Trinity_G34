import {Component, inject, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BasicTextButton} from '../basic-text-button/basic-text-button';
import {BasicTextField} from '../basic-text-field/basic-text-field';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {CommonModule} from '@angular/common';

interface AvatarItem {
  path: string;
  id: number;
}

@Component({
  selector: 'app-avatar-dialog',
  imports: [
    CommonModule,
    BasicTextButton,
    TranslatePipe
  ],
  templateUrl: './avatar-dialog.html',
  styleUrl: './avatar-dialog.css'
})
export class AvatarDialog {

  public avatarList: AvatarItem[] = [];
  public selectedAvatarId: number | null = null;

  public translateService: TranslateService = inject(TranslateService);
  public confirm = this.translateService.instant('BASE.EDIT')
  public cancel = this.translateService.instant('BASE.CANCEL')

  constructor(
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    for (let i = 1; i <= 18; i++) {
      this.avatarList.push({
        path: `assets/avatar/avatar-${i}.svg`,
        id: i,
      });
    }
  }

  selectAvatar(id: number): void {
    this.selectedAvatarId = id;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.selectedAvatarId) {
      this.dialogRef.close(this.selectedAvatarId);
    }
  }
}
