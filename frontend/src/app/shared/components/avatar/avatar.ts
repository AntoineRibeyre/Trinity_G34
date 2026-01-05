import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.html',
  styleUrls: ['./avatar.css']
})
export class AvatarComponent {
  @Input() firstName: string = '';
  @Input() lastName: string = '';

  get initials(): string {
    return `${this.firstName?.charAt(0) ?? ''}${this.lastName?.charAt(0) ?? ''}`.toUpperCase();
  }
}
