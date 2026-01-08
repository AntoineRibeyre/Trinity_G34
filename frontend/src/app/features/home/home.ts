import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class Home implements OnInit, OnDestroy {

  isAuthenticated = false; // À gérer avec votre service d'authentification

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Permettre le scroll sur la page home
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
  }

  ngOnDestroy(): void {
    // Restaurer le comportement par défaut
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

}
