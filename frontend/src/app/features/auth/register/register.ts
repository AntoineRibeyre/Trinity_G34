import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';
import {LanguageService} from '../../../services/lang.service';

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
  showPasswordRequirements = false;

  // Pré-requis du mot de passe
  passwordRequirements = [
    { label: 'Minimum 6 caractères', key: 'minLength' },
    { label: 'Au moins une lettre majuscule', key: 'uppercase' },
    { label: 'Au moins une lettre minuscule', key: 'lowercase' },
    { label: 'Au moins un chiffre', key: 'digit' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private translateService: TranslateService,
    private languageService: LanguageService,
  ){}

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        telephone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        password: ['', [Validators.required, Validators.minLength(6), this.passwordStrengthValidator]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: passwordMatchValidator }
    );

    const lang = this.languageService.getCurrentLanguage();
    this.translateService.use(lang);
  }

  // Validateur personnalisé pour la force du mot de passe
  passwordStrengthValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasDigit = /[0-9]/.test(value);

    const passwordValid = hasUppercase && hasLowercase && hasDigit;

    return passwordValid ? null : { passwordStrength: true };
  };

  // Vérifier si chaque pré-requis est respecté
  isRequirementMet(requirement: string): boolean {
    const password = this.registerForm.get('password')?.value;

    if (!password) {
      return false;
    }

    switch (requirement) {
      case 'minLength':
        return password.length >= 6;
      case 'uppercase':
        return /[A-Z]/.test(password);
      case 'lowercase':
        return /[a-z]/.test(password);
      case 'digit':
        return /[0-9]/.test(password);
      default:
        return false;
    }
  }

  get passwordMismatch(): boolean {
    return (
      this.registerForm.hasError('passwordMismatch') &&
      this.registerForm.get('confirmPassword')?.touched === true
    );
  }

  async onSubmit(): Promise<void> {
  if (this.registerForm.valid) {
    this.isLoading = true;
    this.errorMessage = '';

      const { firstName, lastName, email, telephone, password } = this.registerForm.value;
      const role = 'employe';
      const username = firstName;

    try {
      const response = await this.authService.register(username, firstName, lastName, email, telephone, password, role);
      this.isLoading = false;
      console.log('Inscription réussie:', response);
      this.router.navigate(['/login']);
    } catch (error: any) {
      this.isLoading = false;
      this.errorMessage = error.message || "Erreur lors de l'inscription.";
      console.error('Erreur inscription:', error);
    }
  } else {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
    if (this.registerForm.hasError('passwordMismatch')) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
    } else {
      this.errorMessage = 'Veuillez remplir tous les champs correctement.';
    }
  }
}
  goHome(): void {
    this.router.navigate(['/home']);
  }
}
