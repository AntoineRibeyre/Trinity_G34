import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgForOf} from '@angular/common';

export interface DropdownOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-basic-dropdown',
  imports: [
    NgForOf
  ],
  templateUrl: './basic-dropdown.html',
  styleUrl: './basic-dropdown.css'
})
export class BasicDropdown {
  @Input() options: DropdownOption[] = [];
  @Input() placeholder: string = 'Sélectionnez une option';
  @Input() selectedValue: number = 0;
  @Output() onSelectionChange = new EventEmitter<number>();

  handleChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const value = Number(selectElement.value);
    this.selectedValue = value;
    this.onSelectionChange.emit(value);
  }
}
