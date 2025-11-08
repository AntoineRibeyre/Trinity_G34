import { Component, EventEmitter, Input, Output } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import {FormsModule} from '@angular/forms';
import {NgIf} from '@angular/common';
import {BasicTextButton} from '../basic-text-button/basic-text-button';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-employee-drawer',
  templateUrl: './employee-drawer.html',
  styleUrls: ['./employee-drawer.css'],
  imports: [
    FormsModule,
    NgIf,
    BasicTextButton,
    TranslatePipe
  ],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({transform: 'translateX(100%)'}),
        animate('300ms ease-out', style({transform: 'translateX(0)'}))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({transform: 'translateX(100%)'}))
      ])
    ])
  ]
})
export class EmployeeDrawer {
  @Input() isOpen: boolean = false;
  @Input() employee: any = null;
  @Input() isEditable: boolean = false;

  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();

  close(): void {
    this.onClose.emit();
  }

  saveChanges(): void {
    this.onSave.emit(this.employee);
  }
}
