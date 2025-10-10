import { Component } from '@angular/core';
import {NgIf} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [
    TranslateModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

  isAuthenticated = false; // À gérer avec votre service d'authentification

  constructor(private router: Router) {}

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

}
