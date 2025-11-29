import { Component, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA, DialogModule } from '@angular/cdk/dialog';
import { BasicTextButton } from '../basic-text-button/basic-text-button';
import { DropdownOption } from '../basic-dropdown/basic-dropdown';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

export interface AddTeamEmployee {
  title: string;
  message: string;
  confirm: string;
  dropdownOptions: DropdownOption[];
  onConfirm: (dialogRef: MatDialogRef<AddTeamEmployee>, selectedEmployeeIds: number[] | null) => void;
  cancel: string;
  onCancel: (dialogRef: MatDialogRef<AddTeamEmployee>) => void;
}

@Component({
  selector: 'app-add-team-employe',
  imports: [DialogModule, BasicTextButton,MatFormFieldModule,  
    MatSelectModule,     
    MatOptionModule, ],
  templateUrl: './add-team-employe.html',
  styleUrl: './add-team-employe.css'
})
export class AddTeamEmploye {
  selectedEmployeeIds: number[] = [];

  constructor(
    public dialog: MatDialogRef<AddTeamEmployee>,
    @Inject(DIALOG_DATA) public data: AddTeamEmployee,
  ) {}

  onEmployeeToggle(employeeId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedEmployeeIds.push(employeeId);
    } else {
      this.selectedEmployeeIds = this.selectedEmployeeIds.filter(id => id !== employeeId);
    }
  }



  get isSelected(): boolean {
    return this.selectedEmployeeIds.length > 0;
  }
}
