// login.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true, // obligatoire pour standalone
  imports: [CommonModule, FormsModule],
  templateUrl:'./login.html',
  styleUrls: ['./login.css']
})
export class Login {
  email = '';
  password = '';
  error = '';

  constructor(private auth: AuthService, public router: Router) {}

  onLogin() {
    this.auth.login(this.email, this.password).subscribe({
      next: (res: any) => {
        console.log("Réponse du login :", res);

        if (res?.token) {
          // Connexion réussie
          console.log("JWT reçu :", res.token);
          console.log("CSRF reçu :", res.csrfToken);

          // Redirige vers le tableau de bord
          this.router.navigate(['/dashboard']);
        } else {
          this.error = 'Erreur lors de la connexion';
        }
      },
      error: () => this.error = 'Email ou mot de passe incorrect'
    });
  }


}
