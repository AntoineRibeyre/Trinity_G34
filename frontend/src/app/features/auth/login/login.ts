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
      if (res.success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.error = res.message;
      }
    },
    error: () => this.error = 'Email ou mot de passe incorrect'
  });
  }
}
