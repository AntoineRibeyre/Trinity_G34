// src/app/features/auth/login/login.ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/lang.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule], // FormsModule pour ngModel
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {

  email: string = '';
  password: string = '';
  errorMessage: string = '';
  loading: boolean = false;

  // Injection de dépendances
  private authService = inject(AuthService);
  public router = inject(Router);
  private translateService = inject(TranslateService);
  private languageService = inject(LanguageService);

  ngOnInit(): void {
    // Appliquer la langue sauvegardée en localStorage
    const lang = this.languageService.getCurrentLanguage();
    this.translateService.use(lang);
  }


  // Méthode onLogin() appelée par votre formulaire
  async onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage = this.translateService.instant('ERRORS.FILL_ALL_FIELDS');
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

        const message = error.graphQLErrors[0].message;

        if (message.includes("credentials") || message.includes("Invalid")) {
          this.errorMessage = this.translateService.instant('ERRORS.INVALID_CREDENTIALS');
        } else {
          this.errorMessage = message;  // message serveur générique
        }

      } else if (error.networkError) {
        this.errorMessage = this.translateService.instant('ERRORS.NETWORK_ERROR');

      } else {
        this.errorMessage = this.translateService.instant('ERRORS.INVALID_CREDENTIALS');
      }
    }
  }
}
// Export nommé "Login" pour app.routes.ts
export { LoginComponent as Login };
