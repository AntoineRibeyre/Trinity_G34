import {Component, Inject, OnInit} from '@angular/core';
import {BasicDropdown} from "../basic-dropdown/basic-dropdown";
import {BasicTextButton} from "../basic-text-button/basic-text-button";
import {BasicTextField} from "../basic-text-field/basic-text-field";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {MatDialogRef} from '@angular/material/dialog';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {AuthService} from '../../../services/auth.service';
import {Router} from '@angular/router';
import {LanguageService} from '../../../services/lang.service';
import {NgClass, NgForOf, NgIf} from '@angular/common';


@Component({
  selector: 'app-add-employee',
  imports: [
    BasicDropdown,
    BasicTextButton,
    BasicTextField,
    TranslatePipe,
    FormsModule,
    NgForOf,
    NgIf,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './add-employee.html',
  styleUrl: './add-employee.css'
})
export class AddEmployee implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPasswordRequirements = false;

  passwordRequirements = [
    { label: 'Minimum 6 caractères', key: 'minLength' },
    { label: 'Au moins une lettre majuscule', key: 'uppercase' },
    { label: 'Au moins une lettre minuscule', key: 'lowercase' },
    { label: 'Au moins un chiffre', key: 'digit' },
  ];

  constructor(
    public dialog: MatDialogRef<AddEmployee>,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private translateService: TranslateService,
    private languageService: LanguageService,
  ) {}

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
      { validators: this.passwordMatchValidator }
    );

    const lang = this.languageService.getCurrentLanguage();
    this.translateService.use(lang);
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

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
        this.dialog.close();
        window.location.reload();
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


}
