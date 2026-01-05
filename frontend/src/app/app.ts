import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SnackBarComponent } from './shared/components/snackbar/snackbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SnackBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
