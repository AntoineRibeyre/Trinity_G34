import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
@Injectable({
  providedIn: 'root'
})
//Permet de vérifier si les utilisateurs sont connectés
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    } else {
      // Redirection vers la page de login si non authentifié
      this.router.navigate(['/login']);
      return false;
    }
  }
}
