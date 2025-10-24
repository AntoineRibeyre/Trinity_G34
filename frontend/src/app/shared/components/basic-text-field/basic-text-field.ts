import {Component, EventEmitter, Input, Output, forwardRef} from '@angular/core';
import {NgIf} from '@angular/common';
import {ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule} from '@angular/forms';

@Component({
  selector: 'app-basic-text-field',
  standalone: true,
  imports: [
    NgIf,
    FormsModule  // ← IMPORTANT
  ],
  templateUrl: './basic-text-field.html',
  styleUrl: './basic-text-field.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BasicTextField),
      multi: true
    }
  ]
})
export class BasicTextField implements ControlValueAccessor {
  @Input() width: string = 'auto';
  @Input() placeholder: string = 'Entrez votre texte...';
  @Input() rows: number = 4;
  @Input() maxLength: number | null = null;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() showCharCount: boolean = false;
  @Output() onTextChange = new EventEmitter<string>();

  value: string = '';

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleInput(): void {
    this.onChange(this.value);
    this.onTextChange.emit(this.value);
  }

  handleBlur(): void {
    this.onTouched();
  }
}
