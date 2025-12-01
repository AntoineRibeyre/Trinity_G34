import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { LanguageService } from '../../../services/lang.service';
import { Subscription } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';
import { BasicTextButton } from '../../../shared/components/basic-text-button/basic-text-button';
import { MatDialog } from '@angular/material/dialog';
import { SettingEditPassword } from '../../../shared/components/setting-edit-password/setting-edit-password';
import {AvatarComponent} from '../../../shared/components/avatar/avatar';

/* -------------------- VALIDATEURS -------------------- */

// Vérifie si password === confirmPassword
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) return null;

  return password === confirmPassword ? null : { passwordMismatch: true };
}

// Vérifie la force du mot de passe
function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  const valid =
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    value.length >= 6;

  return valid ? null : { passwordStrength: true };
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, BasicTextButton, AvatarComponent],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css'],
})
export class Settings implements OnInit, OnDestroy {
  settingsForm: FormGroup;
  currentLanguage = 'en';
  availableLanguages: Array<{ code: string; label: string }> = [];
  isLoading = false;
  currentUser: User | null = null;


  private languageSubscription?: Subscription;

  // Pré-requis pour l'affichage live
  passwordRequirements = [
    { label: 'Minimum 6 caractères', key: 'minLength' },
    { label: 'Au moins une lettre majuscule', key: 'uppercase' },
    { label: 'Au moins une lettre minuscule', key: 'lowercase' },
    { label: 'Au moins un chiffre', key: 'digit' },
  ];

  constructor(
    private fb: FormBuilder,
    private languageService: LanguageService,
    private userService: UserService,
    private dialog: MatDialog,
    private translateService: TranslateService
  ) {
    this.settingsForm = this.fb.group(
      {
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        telephone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        password: ['', [passwordStrengthValidator]],
        confirmPassword: [''],
      },
      { validators: passwordMatchValidator }
    );
  }

  /* -------------------- PASSWORD REQUIREMENTS CHECK -------------------- */
  isRequirementMet(req: string): boolean {
    const pwd = this.settingsForm.get('password')?.value || '';

    switch (req) {
      case 'minLength':
        return pwd.length >= 6;
      case 'uppercase':
        return /[A-Z]/.test(pwd);
      case 'lowercase':
        return /[a-z]/.test(pwd);
      case 'digit':
        return /[0-9]/.test(pwd);
      default:
        return false;
    }
  }

  /* -------------------- INIT -------------------- */
  async ngOnInit(): Promise<void> {
    this.availableLanguages = this.languageService.getAvailableLanguages();

    this.currentLanguage = this.languageService.getCurrentLanguage();

    this.languageSubscription = this.languageService.currentLanguage$.subscribe(
      (lang) => (this.currentLanguage = lang)
    );

    // Charger user
    this.currentUser = await this.userService.loadCurrentUserFromServer();
    if (this.currentUser) {
      this.settingsForm.patchValue({
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        email: this.currentUser.email,
        telephone: this.currentUser.telephone,
      });
    }
  }

  ngOnDestroy(): void {
    this.languageSubscription?.unsubscribe();
  }

  /* -------------------- CHANGE LANGUAGE -------------------- */
  changeLanguage(event: Event | string): void {
    const lang =
      typeof event === 'string'
        ? event
        : (event.target as HTMLSelectElement).value;

    this.languageService.setLanguage(lang);

    this.currentLanguage = lang;
  }

  /* -------------------- SUBMIT -------------------- */
  async onSubmit(): Promise<void> {
    if (!this.settingsForm.valid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      const formData = { ...this.settingsForm.value };

      // Pas d’envoi du mot de passe si vide
      if (!formData.password) delete formData.password;

      const updatedUser = await this.userService.updateUser(formData);

      if (updatedUser) {
        this.currentUser = updatedUser;
        this.settingsForm.patchValue({ password: '', confirmPassword: '' });
        this.settingsForm.markAsPristine();
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la sauvegarde');
    }

    this.isLoading = false;
  }

  isInvalid(controlName: string): boolean {
    const c = this.settingsForm.get(controlName);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  /* -------------------- OPEN PASSWORD MODAL -------------------- */
  openEditPassword(): void {
    this.dialog.open(SettingEditPassword, {
      width: '500px',
      data: {
        title: this.translateService.instant('SETTINGS.DIALOG.TITLE'),
        confirm: this.translateService.instant('BASE.EDIT'),
        cancel: this.translateService.instant('BASE.CANCEL'),

        // Nouvelle validation + champs masqués + requirements
        validatePassword: (pwd: string): ValidationErrors | null =>
          passwordStrengthValidator({ value: pwd } as AbstractControl),

        requirements: this.passwordRequirements,

        onConfirm: async (dialogRef: any, newPassword: string) => {
          try {
            await this.userService.updateUser({ password: newPassword });
            alert(this.translateService.instant('SETTINGS.PASSWORD_UPDATED_SUCCESS'));
            dialogRef.close();
          } catch (err) {
            alert(this.translateService.instant('SETTINGS.PASSWORD_UPDATE_ERROR'));
          }
        },
      },
    });
  }
}
