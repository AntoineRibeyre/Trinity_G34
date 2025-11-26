import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import {FormsModule} from '@angular/forms';
import {NgIf} from '@angular/common';
import {BasicTextButton} from '../basic-text-button/basic-text-button';
import {TranslatePipe} from '@ngx-translate/core';
import {UserService} from '../../../services/user.service';
import {PointService} from '../../../services/point.service';
import {User} from '../../../models/user.model';

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

  private currentMonthWork: any
  private userId: number | undefined;

  constructor(
    private pointService: PointService
  ) {

  }

  close(): void {
    this.onClose.emit();
  }

  export(): void {
    this.userId = Number(this.employee.id);

    this.pointService.getMonthCalendar(this.userId).subscribe({
      next: result => {
        if (result) {
          this.currentMonthWork = result;
        }
      },
      error: error => {
        console.error('❌ Erreur lors du chargement:', error);
      }
    });
  }

  saveChanges(): void {
    this.onSave.emit(this.employee);
  }
}
