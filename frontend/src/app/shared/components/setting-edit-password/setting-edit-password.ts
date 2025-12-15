import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {BasicTextButton} from '../basic-text-button/basic-text-button';
import {AddTeamEmployee} from '../add-team-employe/add-team-employe';

// Validator : mot de passe = confirmation
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password === confirmPassword ? null : { passwordMismatch: true };
}

// Validator : force du mot de passe
function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value || '';

  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasDigit = /[0-9]/.test(value);
  const minLength = value.length >= 6;

  const valid = hasUppercase && hasLowercase && hasDigit && minLength;

  return valid ? null : { passwordStrength: true };
}

// ✅ Interface pour les requirements
interface PasswordRequirement {
  key: string;
  label: string;
}

@Component({
  selector: 'app-setting-edit-password',
  standalone: true,
  templateUrl: './setting-edit-password.html',
  styleUrls: ['./setting-edit-password.css'],
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, BasicTextButton]
})
export class SettingEditPassword {

  form: FormGroup;
  hidePassword = true;
  hideConfirm = true;
  showPasswordRequirements = false; // ✅ Pour afficher/masquer les requirements

  // ✅ Liste des requirements avec leurs clés de traduction
  passwordRequirements: PasswordRequirement[] = [
    { key: 'minLength', label: 'SETTINGS.REQUIRE_MIN_LENGTH' },
    { key: 'uppercase', label: 'SETTINGS.REQUIRE_UPPERCASE' },
    { key: 'lowercase', label: 'SETTINGS.REQUIRE_LOWERCASE' },
    { key: 'digit', label: 'SETTINGS.REQUIRE_DIGIT' }
  ];

  constructor(
    public dialog: MatDialogRef<SettingEditPassword>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      title: string;
      confirm: string;
      cancel: string;
      onConfirm: (dialogRef: MatDialogRef<SettingEditPassword>, newPassword: string) => void;
      onCancel: (dialogRef: MatDialogRef<SettingEditPassword>) => void;
    },
    private fb: FormBuilder
  ) {
    this.form = this.fb.group(
      {
        password: ['', [Validators.required, passwordStrengthValidator]],
        confirmPassword: ['', Validators.required]
      },
      { validators: passwordMatchValidator }
    );
  }

  /**
   * ✅ Vérifie si un requirement est respecté (pour le HTML avec *ngFor)
   */
  isRequirementMet(requirement: string): boolean {
    const pwd = this.form.get('password')?.value || '';

    switch (requirement) {
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

  /**
   * Ancienne méthode conservée pour compatibilité
   * (peut être supprimée si vous n'utilisez que isRequirementMet)
   */
  checkRequirement(requirement: string): boolean {
    return this.isRequirementMet(requirement);
  }

  /**
   * Bouton "Confirmer"
   */
  confirm(): void {
    if (this.form.valid) {
      this.data.onConfirm(this.dialog, this.form.get('password')?.value);
    } else {
      this.form.markAllAsTouched();
    }
  }

  /**
   * Bouton "Annuler"
   */
  cancel(): void {
    this.data.onCancel(this.dialog);
  }
}
