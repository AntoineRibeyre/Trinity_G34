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

  // isAuthenticated = true;


  constructor(private auth: AuthService, public router: Router) {}

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  onLogin() {
    console.log(this.email, this.password);
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => this.error = 'Email ou mot de passe incorrect'
    });
  }
}
