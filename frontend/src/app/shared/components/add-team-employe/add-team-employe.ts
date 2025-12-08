import { Component, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA, DialogModule } from '@angular/cdk/dialog';
import { BasicTextButton } from '../basic-text-button/basic-text-button';
import { DropdownOption } from '../basic-dropdown/basic-dropdown';
import { BasicTextField } from '../basic-text-field/basic-text-field';
import { CommonModule } from '@angular/common';

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
  imports: [DialogModule, BasicTextButton, BasicTextField, CommonModule],
  templateUrl: './add-team-employe.html',
  styleUrl: './add-team-employe.css'
})
export class AddTeamEmploye {
  selectedEmployeeIds: number[] = [];
  searchQuery: string = '';
  filteredOptions: DropdownOption[] = [];

  constructor(
    public dialog: MatDialogRef<AddTeamEmployee>,
    @Inject(DIALOG_DATA) public data: AddTeamEmployee,
  ) {
    this.filteredOptions = this.data.dropdownOptions;
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    if (!query || query.trim() === '') {
      this.filteredOptions = this.data.dropdownOptions;
      return;
    }

    const term = query.toLowerCase().trim();
    this.filteredOptions = this.data.dropdownOptions.filter(option =>
      option.label.toLowerCase().includes(term)
    );
  }

  onEmployeeToggle(employeeId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedEmployeeIds.push(employeeId);
    } else {
      this.selectedEmployeeIds = this.selectedEmployeeIds.filter(id => id !== employeeId);
    }
  }

  isEmployeeSelected(employeeId: number): boolean {
    return this.selectedEmployeeIds.includes(employeeId);
  }

  get isSelected(): boolean {
    return this.selectedEmployeeIds.length > 0;
  }
}
