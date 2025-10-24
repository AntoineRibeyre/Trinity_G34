import {Component, Inject} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {DIALOG_DATA, DialogModule} from '@angular/cdk/dialog';
import {BasicTextButton} from '../basic-text-button/basic-text-button';
import {BasicDropdown, DropdownOption} from '../basic-dropdown/basic-dropdown';
import {BasicTextField} from '../basic-text-field/basic-text-field';

export interface AddTeamEmployee {
  title: string;
  message: string;
  confirm: string;
  dropdownOptions: DropdownOption[];
  onConfirm: (dialogRef: MatDialogRef<AddTeamEmployee>, selectedEmployeeId: number | null) => void;
  cancel: string;
  onCancel: (dialogRef: MatDialogRef<AddTeamEmployee>) => void;
}

@Component({
  selector: 'app-add-team-employe',
  imports: [
    DialogModule,
    BasicTextButton,
    BasicDropdown,
  ],
  templateUrl: './add-team-employe.html',
  styleUrl: './add-team-employe.css'
})
export class AddTeamEmploye {
  selectedEmployeeId: number | null = null;
  isSelected: boolean = false;

  constructor(
    public dialog: MatDialogRef<AddTeamEmployee>,
    @Inject(DIALOG_DATA) public data: AddTeamEmployee,
  ) {}

  onChange(employeeId: number): void {
    employeeId === 0 ? this.isSelected = false : this.isSelected = true
    this.selectedEmployeeId = employeeId;
  }
}
