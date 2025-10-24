import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-basic-text-button',
  imports: [],
  templateUrl: './basic-text-button.html',
  styleUrl: './basic-text-button.css'
})
export class BasicTextButton {
  @Input() text: string = 'Button';
  @Input() color: string = '#007bff';
  @Input() disabled: boolean = false;
  @Output() onClick = new EventEmitter<void>();

  handleClick(): void {
    this.onClick.emit();
  }
}
