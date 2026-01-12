import {Component, Inject, OnInit} from '@angular/core';
import {BasicDropdown} from "../basic-dropdown/basic-dropdown";
import {BasicTextButton} from "../basic-text-button/basic-text-button";
import {BasicTextField} from "../basic-text-field/basic-text-field";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {MatDialogRef} from '@angular/material/dialog';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {AuthService} from '../../../services/auth.service';
import {Router} from '@angular/router';
import {LanguageService} from '../../../services/lang.service';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import { passwordMatchValidator, passwordStrengthValidator } from '../../utils/validators';
import { PASSWORD_REQUIREMENTS, isRequirementMet } from '../../utils/password.utils';
import { SnackBarService } from '../../../services/snackbar.service';


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
  employeeForm!: FormGroup;
  isSubmitting = false;
  displayPasswordRules = false;

  employeePasswordRules = PASSWORD_REQUIREMENTS;

  constructor(
    public dialog: MatDialogRef<AddEmployee>,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private translateService: TranslateService,
    private languageService: LanguageService,
    private snackBarService: SnackBarService,
  ) {}

  ngOnInit(): void {
    this.employeeForm = this.fb.group(
      {
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        telephone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        password: ['', [Validators.required, Validators.minLength(6), passwordStrengthValidator]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: passwordMatchValidator }
    );

    const lang = this.languageService.getCurrentLanguage();
    this.translateService.use(lang);
  }

  checkPasswordRequirement(requirement: string): boolean {
    const password = this.employeeForm.get('password')?.value;
    return isRequirementMet(password, requirement);
  }

  get hasPasswordMismatch(): boolean {
    return (
      this.employeeForm.hasError('passwordMismatch') &&
      this.employeeForm.get('confirmPassword')?.touched === true
    );
  }

  private getErrorMessage(error: any): string {
    const errorMessage = error?.message || error?.toString() || '';
    
    // Détecter les erreurs de clé unique (email déjà existant)
    if (errorMessage.includes('duplicate key') || errorMessage.includes('already exists')) {
      // Extraire l'email de l'erreur si possible
      const emailMatch = errorMessage.match(/\(email\)=\(([^)]+)\)/);
      if (emailMatch && emailMatch[1]) {
        return `L'adresse email ${emailMatch[1]} est déjà utilisée. Veuillez en choisir une autre.`;
      }
      return 'Cette adresse email est déjà utilisée. Veuillez en choisir une autre.';
    }
    
    // Message d'erreur par défaut
    return "Erreur lors de l'inscription. Veuillez réessayer.";
  }

  async onAddEmployee(): Promise<void> {
    if (this.employeeForm.valid) {
      this.isSubmitting = true;

      const { firstName, lastName, email, telephone, password } = this.employeeForm.value;
      const role = 'employe';
      const username = firstName;

      try {
        const response = await this.authService.register(username, firstName, lastName, email, telephone, password, role);
        this.isSubmitting = false;
        // console.log('Inscription réussie:', response);
        this.snackBarService.showSuccess('Employé ajouté avec succès !');
        this.dialog.close();
        window.location.reload();
      } catch (error: any) {
        this.isSubmitting = false;
        const errorMessage = this.getErrorMessage(error);
        this.snackBarService.showError(errorMessage);
        // console.error('Erreur inscription:', error);
      }
    } else {
      Object.keys(this.employeeForm.controls).forEach(key => {
        this.employeeForm.get(key)?.markAsTouched();
      });
      if (this.employeeForm.hasError('passwordMismatch')) {
        this.snackBarService.showError('Les mots de passe ne correspondent pas.');
      } else {
        this.snackBarService.showError('Veuillez remplir tous les champs correctement.');
      }
    }
  }

  protected readonly close = close;

  test(){
    // console.log(this.employeeForm.valid)
  }
}
