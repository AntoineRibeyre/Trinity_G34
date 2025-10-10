import { Component } from '@angular/core';
import {TranslateModule, TranslatePipe} from '@ngx-translate/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [TranslateModule, TranslatePipe],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  isAuthenticated = true;

  constructor(private router: Router) {}

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
