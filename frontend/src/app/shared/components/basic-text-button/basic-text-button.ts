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
  @Input() width: string = '14.5vw';
  @Input() disabled: boolean = false;
  @Output() click = new EventEmitter<void>();

  handleClick(): void {
    this.click.emit();
  }
}
