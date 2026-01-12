// src/app/features/auth/login/login.ts
import {Component, inject, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/lang.service';
import { SnackBarService } from '../../../services/snackbar.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule], // FormsModule pour ngModel
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {

  email: string = '';
  password: string = '';
  loading: boolean = false;
  currentUser: any = null;

  // Injection de dépendances
  private authService = inject(AuthService);
  public router = inject(Router);
  private translateService = inject(TranslateService);
  private languageService = inject(LanguageService);
  private snackBarService = inject(SnackBarService);
  private userService = inject(UserService);

  ngOnInit(): void {
    // Appliquer la langue sauvegardée en localStorage
    const lang = this.languageService.getCurrentLanguage();
    this.translateService.use(lang);
  }


  // Méthode onLogin() appelée par votre formulaire
  async onLogin() {
    if (!this.email || !this.password) {
      this.snackBarService.showError(this.translateService.instant('ERRORS.FILL_ALL_FIELDS'));
      return;
    }

    this.loading = true;

    try {
      // Appel du service d'authentification
      const user = await this.authService.login(this.email, this.password);

      // console.log('Utilisateur connecté:', user);

      // Afficher un message de succès
      this.snackBarService.showSuccess(this.translateService.instant('LOGIN.SUCCESS') || 'Connexion réussie !');

      // Redirection vers le dashboard
      if (user.role === 'admin') {
        this.router.navigate(['/admin/users']);
        // console.log('Redirection vers /admin/users');
      } else {
        this.router.navigate(['/dashboard']);
        // console.log('Redirection vers /dashboard');
      }
     

    } catch (error: any) {
      // console.error('Erreur de connexion:', error);

      let errorMessage = '';

      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        const message = error.graphQLErrors[0].message;

        if (message.includes("credentials") || message.includes("Invalid")) {
          errorMessage = this.translateService.instant('ERRORS.INVALID_CREDENTIALS');
        } else {
          errorMessage = message;  // message serveur générique
        }

      } else if (error.networkError) {
        errorMessage = this.translateService.instant('ERRORS.NETWORK_ERROR');

      } else {
        errorMessage = this.translateService.instant('ERRORS.INVALID_CREDENTIALS');
      }

      // Afficher l'erreur dans la SnackBar
      this.snackBarService.showError(errorMessage);
    } finally {
      this.loading = false;
    }
  }
}
// Export nommé "Login" pour app.routes.ts
export { LoginComponent as Login };
