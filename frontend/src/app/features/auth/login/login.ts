// src/app/features/auth/login/login.ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule], // FormsModule pour ngModel
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  // Propriétés utilisées dans votre template HTML
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  loading: boolean = false;

  // Injection de dépendances
  private authService = inject(AuthService);
  public router = inject(Router);

  // Méthode onLogin() appelée par votre formulaire
  async onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      // Appel du service d'authentification
      const user = await this.authService.login(this.email, this.password);
      
      console.log('Utilisateur connecté:', user);
      
      // Redirection vers le dashboard
      this.router.navigate(['/dashboard']);
      
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        this.errorMessage = error.graphQLErrors[0].message;
      } else if (error.networkError) {
        this.errorMessage = 'Erreur de connexion au serveur';
      } else {
        this.errorMessage = 'Email ou mot de passe incorrect';
      }
      
    } finally {
      this.loading = false;
    }
  }
}

// Export nommé "Login" pour app.routes.ts
export { LoginComponent as Login };