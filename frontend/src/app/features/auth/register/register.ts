import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';

// Validateur personnalisé pour vérifier que les mots de passe correspondent
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        telephone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: passwordMatchValidator }
    );
  }

  // Getter pour vérifier s'il y a une erreur de correspondance des mots de passe
  get passwordMismatch(): boolean {
    return (
      this.registerForm.hasError('passwordMismatch') &&
      this.registerForm.get('confirmPassword')?.touched === true
    );
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { firstName, lastName, email, telephone, password } = this.registerForm.value;
      const role = 'employe';
      const username = firstName;

      this.authService.register(username, firstName, lastName, email, telephone, password, role).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Inscription réussie:', response);
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Erreur lors de l\'inscription.';
          console.error('Erreur inscription:', error);
        }
      });
    } else {
      // Marquer tous les champs comme "touched" pour afficher les erreurs
      Object.keys(this.registerForm.controls).forEach((key) => {
        this.registerForm.get(key)?.markAsTouched();
      });

      // Message d'erreur spécifique pour les mots de passe
      if (this.registerForm.hasError('passwordMismatch')) {
        this.errorMessage = 'Les mots de passe ne correspondent pas.';
      } else {
        this.errorMessage = 'Veuillez remplir tous les champs correctement.';
      }
    }
  }
}
